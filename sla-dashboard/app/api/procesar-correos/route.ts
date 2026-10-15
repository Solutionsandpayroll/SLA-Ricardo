
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
                OR: [
                  { messageId: { in: identificadores } },
                ],
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
 * CONSULTAR ÚNICAMENTE LAS SOLICITUDES DEL USUARIO ACTUAL
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 }
      );
    }

    const solicitudesGuardadas = await prisma.solicitud.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        fechaRecibido: "desc",
      },
      take: 50,
    });

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

      return {
        ...sol,
        paisCliente: sol.paisCliente ?? null,
        encargado: sol.encargado ?? null,
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
