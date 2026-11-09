import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import { config } from "@/lib/config";
import { prisma } from "@/lib/prisma";

import {
  getGraphToken,
  getEmailsFromMailbox,
  getConversationEmails,
  getUserProfile,
  type GraphEmail,
} from "@/lib/graph-daemon";

import {
  classifyEmail,
  checkIfResponded,
} from "@/lib/groq-client";

import {
  asignarResponsable,
  listarProcesosValidos,
} from "@/lib/responsable";

import { calcularSLA } from "@/lib/sla-calculator";

export const runtime = "nodejs";
export const maxDuration = 300;

const DOMINIO_INTERNO = "solutionsandpayroll.com";
const MAX_CARACTERES_ACUSE = 200;

const PATRON_ACUSE =
  /\b(recibido|acuso recibo|lo (estamos )?revis(amos|ando)|lo revisaremos|estamos revisando|en revisi[oó]n|gracias por (escribir|tu|su) (correo|mensaje))\b/i;

// ======================================================
// CLIENTES AUTOMÁTICOS
// ======================================================

const DOMINIOS_GENERICOS = [
  "gmail.com",
  "hotmail.com",
  "outlook.com",
  "yahoo.com",
  "live.com",
  "icloud.com",
];

/**
 * Crea el cliente (por dominio) si todavía no existe.
 * Ignora correos personales como gmail o hotmail.
 */
async function asegurarCliente(
  remitente: string,
  nombre?: string | null,
  pais?: string | null
) {
  const dominio =
    remitente.trim().toLowerCase().split("@").pop() || "";

  if (!dominio || DOMINIOS_GENERICOS.includes(dominio)) return;

  const existe = await prisma.cliente.findFirst({
    where: { dominio },
  });

  if (existe) return;

  await prisma.cliente.create({
    data: {
      nombre: nombre?.trim() || dominio,
      dominio,
      pais: pais || null,
    },
  });
}

// ======================================================
// FECHAS
// ======================================================

function obtenerRangoFechas() {
  const ahora = new Date();

  const fechaHasta = process.env.SLA_FECHA_HASTA
    ? new Date(process.env.SLA_FECHA_HASTA)
    : ahora;

  const fechaDesde = process.env.SLA_FECHA_DESDE
    ? new Date(process.env.SLA_FECHA_DESDE)
    : new Date(
        fechaHasta.getTime() - 30 * 24 * 60 * 60 * 1000
      );

  if (
    Number.isNaN(fechaDesde.getTime()) ||
    Number.isNaN(fechaHasta.getTime()) ||
    fechaDesde > fechaHasta
  ) {
    throw new Error(
      "Las fechas configuradas para el SLA no son válidas."
    );
  }

  return { fechaDesde, fechaHasta };
}

// ======================================================
// UTILIDADES DE CORREOS
// ======================================================

function obtenerRemitente(email: GraphEmail): string {
  return (
    email.from?.emailAddress?.address
      ?.trim()
      .toLowerCase() || ""
  );
}

function obtenerDirecciones(
  lista?: GraphEmail["toRecipients"]
): string[] {
  return (lista ?? [])
    .map((destinatario) =>
      destinatario.emailAddress?.address
        ?.trim()
        .toLowerCase()
    )
    .filter((direccion): direccion is string =>
      Boolean(direccion)
    );
}

/**
 * Extrae el texto nuevo del correo y evita analizar
 * el historial de mensajes citado.
 */
function textoNuevo(cuerpo?: string): string {
  const texto = (cuerpo || "").replace(/\r/g, "");

  const corte = texto.search(
    /^(de|from)\s*:|^el .{5,80} escribi[oó]:|^on .{5,80} wrote:|^-{2,}\s*(mensaje original|original message)/im
  );

  return (
    corte >= 0 ? texto.slice(0, corte) : texto
  ).trim();
}

function esAcuse(texto: string): boolean {
  return (
    texto.length < MAX_CARACTERES_ACUSE &&
    PATRON_ACUSE.test(texto)
  );
}

function recortar(texto: string, max: number): string {
  const plano = texto.replace(/\s+/g, " ").trim();

  return plano.length > max
    ? `${plano.slice(0, max - 1).trimEnd()}…`
    : plano;
}

function generarResumen(cuerpo?: string): string {
  return recortar(textoNuevo(cuerpo), 300);
}

// ======================================================
// DETECCIÓN DE RESPUESTAS
// ======================================================

/**
 * Un correo interno solo cuenta como respuesta cuando:
 * - No es borrador.
 * - Es posterior a la solicitud.
 * - No es un reenvío.
 * - Está dirigido al cliente.
 * - No es un simple acuse de recibo.
 */
function esRespuestaValida(
  email: GraphEmail,
  correoCliente: string,
  fechaRecibido: Date
): boolean {
  if (email.isDraft) {
    return false;
  }

  const fechaEnvio = new Date(
    email.sentDateTime || email.receivedDateTime
  );

  if (
    Number.isNaN(fechaEnvio.getTime()) ||
    fechaEnvio.getTime() <= fechaRecibido.getTime()
  ) {
    return false;
  }

  const asunto = (email.subject || "").trim();

  if (/^(fw|fwd|rv|reenv)\s*:/i.test(asunto)) {
    return false;
  }

  const destinatarios = [
    ...obtenerDirecciones(email.toRecipients),
    ...obtenerDirecciones(email.ccRecipients),
  ];

  const dominioCliente = correoCliente.split("@")[1] || "";

  const esDominioLibre = [
    "gmail.com",
    "hotmail.com",
    "outlook.com",
    "yahoo.com",
    "live.com",
    "icloud.com",
  ].includes(dominioCliente);

  const dirigido = destinatarios.some(
    (d) =>
      d === correoCliente ||
      (!esDominioLibre &&
        dominioCliente !== "" &&
        d.endsWith(`@${dominioCliente}`))
  );

  if (!dirigido) {
    return false;
  }
  if (esAcuse(textoNuevo(email.body?.content))) {
    return false;
  }

  return true;
}

/**
 * Conserva los correos del cliente y las respuestas
 * internas que cumplen los criterios.
 */
function filtrarConversacion(
  conversacion: GraphEmail[],
  correoCliente: string,
  fechaRecibido: Date
): GraphEmail[] {
  return conversacion.filter((email) => {
    const remitente = obtenerRemitente(email);

    const esInterno = remitente.endsWith(
      `@${DOMINIO_INTERNO}`
    );

    if (!esInterno) {
      return true;
    }

    return esRespuestaValida(
      email,
      correoCliente,
      fechaRecibido
    );
  });
}

// ======================================================
// EVIDENCIA
// ======================================================

function construirEvidencia(email: GraphEmail): string {
  const quien =
    email.from?.emailAddress?.name?.trim() ||
    obtenerRemitente(email);

  const fecha = new Date(
    email.sentDateTime || email.receivedDateTime
  ).toLocaleString("es-CO", {
    timeZone: "America/Bogota",
    dateStyle: "short",
    timeStyle: "short",
  });

  const extracto = recortar(
    textoNuevo(email.body?.content),
    300
  );

  return `${quien} respondió al cliente el ${fecha}: "${extracto}"`;
}

// ======================================================
// EVALUACIÓN DE CONVERSACIÓN
// ======================================================

async function evaluarRespuesta(
  conversationId: string,
  buzon: string,
  token: string,
  correoCliente: string,
  fechaRecibido: Date
): Promise<{
  respondido: boolean;
  fechaRespuesta: string | null;
  evidencia: string | null;
}> {
  const conversacion = await getConversationEmails(
    conversationId,
    buzon,
    token
  );

  const filtrada = filtrarConversacion(
    conversacion,
    correoCliente,
    fechaRecibido
  );

  const resultado = await checkIfResponded(
    filtrada,
    correoCliente,
    fechaRecibido.toISOString(),
    correoCliente
  );

  const primeraValida = filtrada.find((email) => {
    const remitente = obtenerRemitente(email);

    return (
      remitente.endsWith(`@${DOMINIO_INTERNO}`) &&
      esRespuestaValida(
        email,
        correoCliente,
        fechaRecibido
      )
    );
  });

  return {
    respondido: resultado.respondido,
    fechaRespuesta: resultado.fechaRespuesta,
    evidencia:
      resultado.respondido && primeraValida
        ? construirEvidencia(primeraValida)
        : null,
  };
}

// ======================================================
// PROCESAR CORREOS
// ======================================================

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "No autorizado",
        },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Token de Microsoft del usuario autenticado.
    const token = await getGraphToken(userId);

    // Perfil del buzón autenticado.
    const perfil = await getUserProfile("", token);

    const buzon = (
      perfil.mail ||
      perfil.userPrincipalName ||
      session.user.email ||
      ""
    )
      .trim()
      .toLowerCase();

    if (!buzon) {
      throw new Error(
        "No se pudo identificar el buzón de Microsoft."
      );
    }

    // Dueño del buzón: se usa como responsable cuando
    // no hay uno configurado para el proceso y el país.
    const encargadoBuzon =
      perfil.displayName?.trim() ||
      session.user.name?.trim() ||
      buzon;

    const { fechaDesde, fechaHasta } =
      obtenerRangoFechas();

    // Tipos de proceso permitidos para la clasificación (una vez por ejecución).
    let procesosValidos: string[] = [];

    try {
      procesosValidos = await listarProcesosValidos();
    } catch (error) {
      console.warn(
        "No se pudieron cargar los procesos configurados:",
        error
      );
    }

    let solicitudes = 0;
    let noSolicitudes = 0;
    let respondidos = 0;
    let pendientes = 0;
    let errores = 0;
    let descartadosDominio = 0;
    let revisadas = 0;
    let pasaronARespondida = 0;

    // ==================================================
    // PASO 1: REVISAR SOLICITUDES PENDIENTES
    // ==================================================

    const pendientesGuardadas =
      await prisma.solicitud.findMany({
        where: {
          userId,
          estado: "en_gestion",
          conversationId: {
            not: null,
          },
        },
      });

    console.log(
      "Solicitudes pendientes a revisar:",
      pendientesGuardadas.length
    );

    for (const sol of pendientesGuardadas) {
      try {
        const fechaRecibidoSol = new Date(
          sol.fechaRecibido
        );

        const {
          respondido,
          fechaRespuesta,
          evidencia,
        } = await evaluarRespuesta(
          sol.conversationId!,
          buzon,
          token,
          (sol.correoCliente || sol.remitente)
            .trim()
            .toLowerCase(),
          fechaRecibidoSol
        );

        const resultadoSLA = calcularSLA(
          fechaRecibidoSol,
          fechaRespuesta
            ? new Date(fechaRespuesta)
            : undefined,
          sol.slaHoras
        );

        // Si aún no tiene responsable por proceso, intentar asignarlo.
        const asignado =
          !sol.correoResponsable && sol.tipoProceso
            ? await asignarResponsable(
                sol.tipoProceso,
                sol.paisCliente
              )
            : null;

        await prisma.solicitud.update({
          where: {
            id: sol.id,
          },
          data: {
            fechaRespuesta: fechaRespuesta
              ? new Date(fechaRespuesta)
              : null,

            inicioConteoSLA:
              resultadoSLA.inicioConteoSLA,

            vencimientoSLA:
              resultadoSLA.vencimientoSLA,

            tiempoHabil:
              resultadoSLA.tiempoHabil,

            estadoSLA:
              resultadoSLA.estadoSLA,

            estado: respondido
              ? "respondido"
              : "en_gestion",

            evidenciaRespuesta: evidencia,

            resumen:
              sol.resumen ||
              generarResumen(sol.cuerpo),

            ...(asignado
              ? {
                  encargado: asignado.responsable,
                  correoResponsable:
                    asignado.correoResponsable,
                }
              : {}),
          },
        });

        revisadas++;

        if (respondido) {
          pasaronARespondida++;
        }
      } catch (error) {
        errores++;

        console.error(
          "Error revisando solicitud pendiente:",
          sol.id,
          error
        );
      }
    }

    // ==================================================
    // PASO 2: DESCARGAR CORREOS NUEVOS
    // ==================================================

    const correos = await getEmailsFromMailbox(
      buzon,
      fechaDesde,
      fechaHasta,
      token
    );

    console.log("==================================");
    console.log("PROCESAMIENTO SLA");
    console.log("Usuario:", userId);
    console.log("Buzón:", buzon);
    console.log("Encargado por defecto:", encargadoBuzon);
    console.log(
      "Procesos configurados:",
      procesosValidos.length
    );
    console.log(
      "Rango:",
      fechaDesde.toISOString(),
      "->",
      fechaHasta.toISOString()
    );
    console.log("Correos encontrados:", correos.length);
    console.log("==================================");

    for (const correo of correos) {
      try {
        const remitente = obtenerRemitente(correo);
        const asunto = correo.subject || "(Sin asunto)";
        const cuerpo = correo.body?.content || "";

        const fechaRecibido = new Date(
          correo.receivedDateTime
        );

        if (!remitente) {
          descartadosDominio++;
          continue;
        }

        if (Number.isNaN(fechaRecibido.getTime())) {
          errores++;
          console.error(
            "Fecha inválida:",
            asunto
          );
          continue;
        }

        // Excluir correos internos.
        const dominio = remitente.split("@")[1] || "";

        if (dominio === DOMINIO_INTERNO) {
          descartadosDominio++;
          continue;
        }

        // Evitar duplicados.
        const identificadores = [
          correo.id,
          correo.internetMessageId,
        ].filter(
          (id): id is string => Boolean(id)
        );

        const existente = identificadores.length
          ? await prisma.solicitud.findFirst({
              where: {
                userId,
                messageId: {
                  in: identificadores,
                },
              },
            })
          : null;

        if (existente) {
          // Asegura el cliente de solicitudes ya guardadas.
          await asegurarCliente(
            existente.remitente,
            existente.nombreCliente,
            existente.paisCliente
          );
          console.log(
            "Correo ya registrado:",
            asunto
          );
          continue;
        }

        // Clasificar el correo con Groq (solo con los procesos configurados).
        const clasificacion = await classifyEmail(
          asunto,
          cuerpo,
          remitente,
          procesosValidos
        );

        if (!clasificacion.esSolicitud) {
          noSolicitudes++;
          continue;
        }

        // El cliente es quien escribió: a esa dirección se le
        // busca la respuesta, tanto ahora como en las revisiones.
        const correoCliente = remitente;

        // ==================================================
        // PASO 3: BUSCAR RESPUESTA
        // ==================================================

        let respondido = false;
        let fechaRespuesta: string | null = null;
        let evidencia: string | null = null;

        if (correo.conversationId) {
          const resultado = await evaluarRespuesta(
            correo.conversationId,
            buzon,
            token,
            correoCliente,
            fechaRecibido
          );

          respondido = resultado.respondido;
          fechaRespuesta = resultado.fechaRespuesta;
          evidencia = resultado.evidencia;
        }

        // ==================================================
        // PASO 4: CALCULAR SLA
        // ==================================================

        const slaHoras = config.sla.horasPorDefecto;

        const resultadoSLA = calcularSLA(
          fechaRecibido,
          fechaRespuesta
            ? new Date(fechaRespuesta)
            : undefined,
          slaHoras
        );

        // ==================================================
        // PASO 4B: ASIGNAR RESPONSABLE
        // ==================================================

        const asignado = await asignarResponsable(
          clasificacion.tipoProceso,
          clasificacion.pais
        );

        // ==================================================
        // PASO 4C: CREAR CLIENTE SI NO EXISTE
        // ==================================================

        await asegurarCliente(
          remitente,
          clasificacion.cliente,
          clasificacion.pais
        );

        // ==================================================
        // PASO 5: GUARDAR EN PRISMA
        // ==================================================

        await prisma.solicitud.create({
          data: {
            userId,

            encargado:
              asignado?.responsable ??
              encargadoBuzon,

            correoResponsable:
              asignado?.correoResponsable ?? null,

            messageId: correo.id,

            conversationId:
              correo.conversationId || null,

            asunto,
            cuerpo,
            remitente,

            correoCliente,

            nombreCliente:
              clasificacion.cliente || remitente,

            paisCliente:
              clasificacion.pais || null,

            tipoProceso:
              clasificacion.tipoProceso || null,

            clasificacionIA: "solicitud",

            confianzaIA:
              clasificacion.confianza,

            fechaRecibido,

            slaHoras,

            fechaRespuesta: fechaRespuesta
              ? new Date(fechaRespuesta)
              : null,

            inicioConteoSLA:
              resultadoSLA.inicioConteoSLA,

            vencimientoSLA:
              resultadoSLA.vencimientoSLA,

            tiempoHabil:
              resultadoSLA.tiempoHabil,

            estadoSLA:
              resultadoSLA.estadoSLA,

            estado: respondido
              ? "respondido"
              : "en_gestion",

            resumen: generarResumen(cuerpo),

            evidenciaRespuesta: evidencia,
          },
        });

        solicitudes++;

        if (respondido) {
          respondidos++;
        } else {
          pendientes++;
        }

        console.log(
          "Solicitud guardada:",
          asunto
        );
      } catch (error) {
        errores++;

        console.error(
          "Error procesando un correo:",
          error
        );
      }
    }

    // ==================================================
    // RESULTADO
    // ==================================================

    const resumen = {
      total: correos.length,
      solicitudes,
      noSolicitudes,
      respondidos,
      pendientes,
      errores,
      descartadosDominio,
      revisadas,
      pasaronARespondida,
    };

    return NextResponse.json({
      success: true,
      buzon,
      resumen,
      ...resumen,
    });
  } catch (error) {
    console.error(
      "Error general procesando correos:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error inesperado al procesar los correos.",
      },
      { status: 500 }
    );
  }
}

// ======================================================
// CONSULTAR SOLICITUDES
// ======================================================

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "No autorizado",
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    const verEquipo =
      searchParams.get("alcance") === "equipo";

    const solicitudesGuardadas =
      await prisma.solicitud.findMany({
        where: verEquipo
          ? {}
          : {
              userId: session.user.id,
            },
        orderBy: {
          fechaRecibido: "desc",
        },
        take: 500,
      });

    // Obtener nombres de los responsables.
    const nombresPorUsuario = new Map<
      string,
      string
    >();

    if (verEquipo) {
      try {
        const ids = Array.from(
          new Set(
            solicitudesGuardadas
              .map((sol) => sol.userId)
              .filter(
                (id): id is string => Boolean(id)
              )
          )
        );

        if (ids.length > 0) {
          const usuarios =
            await prisma.user.findMany({
              where: {
                id: {
                  in: ids,
                },
              },
              select: {
                id: true,
                name: true,
                email: true,
              },
            });

          for (const usuario of usuarios) {
            nombresPorUsuario.set(
              usuario.id,
              usuario.name ||
                usuario.email ||
                ""
            );
          }
        }
      } catch (error) {
        console.warn(
          "No se pudieron cargar los nombres de usuario:",
          error
        );
      }
    }

    const solicitudes = solicitudesGuardadas.map(
      (sol) => {
        const estadoOriginal = String(
          sol.estado || ""
        ).toLowerCase();

        let estado = "en_gestion";

        if (
          estadoOriginal === "respondido" ||
          estadoOriginal === "respondida"
        ) {
          estado = "respondida";
        } else if (
          estadoOriginal === "cerrada"
        ) {
          estado = "cerrada";
        }

        // No enviar el cuerpo del correo a la vista.
        const { cuerpo: _cuerpo, ...resto } = sol;

        return {
          ...resto,

          paisCliente:
            sol.paisCliente ?? null,

          encargado:
            sol.encargado ??
            (
              sol.userId
                ? nombresPorUsuario.get(sol.userId)
                : undefined
            ) ??
            null,

          inicioConteoSLA:
            sol.inicioConteoSLA ?? null,

          vencimientoSLA:
            sol.vencimientoSLA ?? null,

          tiempoHabil:
            sol.tiempoHabil ?? null,

          estadoSLA:
            sol.estadoSLA ?? null,

          confianzaIA:
            sol.confianzaIA ?? null,

          estado,
        };
      }
    );

    return NextResponse.json({
      success: true,
      solicitudes,
    });
  } catch (error) {
    console.error(
      "Error consultando solicitudes:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "No fue posible consultar las solicitudes.",
      },
      { status: 500 }
    );
  }
}