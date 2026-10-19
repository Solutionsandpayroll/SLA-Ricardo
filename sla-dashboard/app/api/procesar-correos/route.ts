import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import {
  getGraphToken,
  getEmailsFromMailbox,
  getConversationEmails,
  getUserProfile,
} from "@/lib/graph-daemon";

import { classifyEmail, checkIfResponded } from "@/lib/groq-client";
import { calcularSLA } from "@/lib/sla-calculator";

export const runtime = "nodejs";
export const maxDuration = 300;

function obtenerRangoFechas() {
  const ahora = new Date();

  const fechaHasta = process.env.SLA_FECHA_HASTA
    ? new Date(process.env.SLA_FECHA_HASTA)
    : ahora;

  const fechaDesde = process.env.SLA_FECHA_DESDE
    ? new Date(process.env.SLA_FECHA_DESDE)
    : new Date(fechaHasta.getTime() - 30 * 24 * 60 * 60 * 1000);

  if (
    Number.isNaN(fechaDesde.getTime()) ||
    Number.isNaN(fechaHasta.getTime())
  ) {
    throw new Error("Las fechas configuradas para el SLA no son válidas.");
  }

  return { fechaDesde, fechaHasta };
}

function obtenerRemitente(email: {
  from?: {
    emailAddress?: {
      address?: string;
    };
  };
}): string {
  return email.from?.emailAddress?.address?.trim().toLowerCase() || "";
}

/**
 * PROCESAR CORREOS DEL USUARIO AUTENTICADO
 * (guarda las solicitudes en la base de datos compartida)
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Obtener el token de Microsoft de este usuario.
    const token = await getGraphToken(userId);
    const perfil = await getUserProfile("", token);

    const buzon = (
      perfil.mail ||
      perfil.userPrincipalName ||
      session.user.email ||
      ""
    ).trim().toLowerCase();

    if (!buzon) {
      throw new Error("No se pudo identificar el buzón de Microsoft.");
    }

    // Nombre que se mostrará como "Encargado" en la vista del equipo.
    const encargado =
      (perfil as { displayName?: string }).displayName?.trim() ||
      session.user.name?.trim() ||
      buzon;

    const { fechaDesde, fechaHasta } = obtenerRangoFechas();

    // Descargar correos del buzón autenticado.
    const correos = await getEmailsFromMailbox(
      buzon,
      fechaDesde,
      fechaHasta,
      token
    );

    let solicitudes = 0;
    let noSolicitudes = 0;
    let respondidos = 0;
    let pendientes = 0;
    let errores = 0;
    let descartadosDominio = 0;

    console.log("==================================");
    console.log("PROCESAMIENTO SLA");
    console.log("Usuario:", userId);
    console.log("Buzón:", buzon);
    console.log("Encargado:", encargado);
    console.log("Rango:", fechaDesde.toISOString(), "->", fechaHasta.toISOString());
    console.log("Correos encontrados:", correos.length);
    console.log("==================================");

    for (const correo of correos) {
      try {
        const remitente = obtenerRemitente(correo);
        const asunto = correo.subject || "(Sin asunto)";
        const cuerpo = correo.body?.content || "";
        const fechaRecibido = new Date(correo.receivedDateTime);

        if (!remitente) {
          descartadosDominio++;
          continue;
        }

        if (Number.isNaN(fechaRecibido.getTime())) {
          errores++;
          console.error("Fecha inválida:", asunto);
          continue;
        }

        // Excluir correos internos.
        const dominio = remitente.split("@")[1] || "";

        if (dominio === "solutionsandpayroll.com") {
          descartadosDominio++;
          continue;
        }

        // Evitar duplicados dentro de las solicitudes del usuario.
        const identificadores = [
          correo.id,
          correo.internetMessageId,
        ].filter((id): id is string => Boolean(id));

        const existente = identificadores.length
          ? await prisma.solicitud.findFirst({
              where: {
                userId,
                OR: [{ messageId: { in: identificadores } }],
              },
            })
          : null;

        if (existente) {
          console.log("Correo ya registrado:", asunto);
          continue;
        }

        // Clasificar el correo con IA.
        const clasificacion = await classifyEmail(
          asunto,
          cuerpo,
          remitente
        );

        if (!clasificacion.esSolicitud) {
          noSolicitudes++;
          continue;
        }

        // Comprobar si hubo respuesta.
        let respondido = false;
        let fechaRespuesta: string | null = null;

        if (correo.conversationId) {
          const conversacion = await getConversationEmails(
            correo.conversationId,
            buzon,
            token
          );

          const resultadoRespuesta = await checkIfResponded(
            conversacion,
            remitente,
            fechaRecibido.toISOString()
          );

          respondido = resultadoRespuesta.respondido;
          fechaRespuesta = resultadoRespuesta.fechaRespuesta;
        }

        // Calcular todos los datos del SLA.
        const resultadoSLA = calcularSLA(
          fechaRecibido,
          fechaRespuesta ? new Date(fechaRespuesta) : undefined
        );

        // Guardar la solicitud asociada al usuario actual.
        await prisma.solicitud.create({
          data: {
            userId,
            encargado,
            messageId: correo.id,
            conversationId: correo.conversationId || null,
            asunto,
            cuerpo,
            remitente,
            correoCliente: remitente,
            nombreCliente: clasificacion.cliente || remitente,
            paisCliente: clasificacion.pais || null,
            tipoProceso: clasificacion.tipoProceso || null,
            fechaRecibido,
            fechaRespuesta: fechaRespuesta
              ? new Date(fechaRespuesta)
              : null,

            inicioConteoSLA: resultadoSLA.inicioConteoSLA,
            vencimientoSLA: resultadoSLA.vencimientoSLA,
            tiempoHabil: resultadoSLA.tiempoHabil,
            estadoSLA: resultadoSLA.estadoSLA,

            estado: respondido ? "respondido" : "en_gestion",
          },
        });

        solicitudes++;

        if (respondido) {
          respondidos++;
        } else {
          pendientes++;
        }

        console.log("Solicitud guardada:", asunto);
      } catch (error) {
        errores++;
        console.error("Error procesando un correo:", error);
      }
    }

    const resumen = {
      total: correos.length,
      solicitudes,
      noSolicitudes,
      respondidos,
      pendientes,
      errores,
      descartadosDominio,
    };

    return NextResponse.json({
      success: true,
      buzon,
      resumen,
      ...resumen,
    });
  } catch (error) {
    console.error("Error general procesando correos:", error);

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

/**
 * CONSULTAR SOLICITUDES
 *  - /api/procesar-correos                  -> solo las del usuario actual
 *  - /api/procesar-correos?alcance=equipo   -> las de TODO el equipo
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const verEquipo = searchParams.get("alcance") === "equipo";

    const solicitudesGuardadas = await prisma.solicitud.findMany({
      where: verEquipo ? {} : { userId: session.user.id },
      orderBy: {
        fechaRecibido: "desc",
      },
      // Antes: verEquipo ? 500 : 50. Ahora "mis solicitudes" también trae hasta 500.
      take: 500,
    });

    // Para filas antiguas sin "encargado", usar el nombre del usuario dueño.
    const nombresPorUsuario = new Map<string, string>();

    if (verEquipo) {
      try {
        const ids = Array.from(
          new Set(solicitudesGuardadas.map((s) => s.userId).filter(Boolean))
        ) as string[];

        const usuarios = await prisma.user.findMany({
          where: { id: { in: ids } },
          select: { id: true, name: true, email: true },
        });

        for (const u of usuarios) {
          nombresPorUsuario.set(u.id, u.name || u.email || "");
        }
      } catch (error) {
        console.warn("No se pudieron cargar los nombres de usuario:", error);
      }
    }

    const solicitudes = solicitudesGuardadas.map((sol) => {
      const estadoOriginal = String(sol.estado || "").toLowerCase();

      let estado = "en_gestion";

      if (
        estadoOriginal === "respondido" ||
        estadoOriginal === "respondida"
      ) {
        estado = "respondida";
      } else if (estadoOriginal === "cerrada") {
        estado = "cerrada";
      }

      // El cuerpo de los correos NO se envía a la vista del equipo.
      const { cuerpo: _cuerpo, ...resto } = sol;

      return {
        ...resto,
        paisCliente: sol.paisCliente ?? null,
        encargado:
          sol.encargado ??
          (sol.userId ? nombresPorUsuario.get(sol.userId) : undefined) ??
          null,
        inicioConteoSLA: sol.inicioConteoSLA ?? null,
        vencimientoSLA: sol.vencimientoSLA ?? null,
        tiempoHabil: sol.tiempoHabil ?? null,
        estadoSLA: sol.estadoSLA ?? null,
        confianzaIA: sol.confianzaIA ?? null,
        estado,
      };
    });

    return NextResponse.json({
      success: true,
      solicitudes,
    });
  } catch (error) {
    console.error("Error consultando solicitudes:", error);

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