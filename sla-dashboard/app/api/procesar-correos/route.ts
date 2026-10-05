import { NextRequest, NextResponse } from "next/server";
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
import { calcularSLA, calcularTiempoHabil } from "@/lib/sla-calculator";
import { esDominioCliente } from "@/lib/dominios-clientes";

const BUZONES = [
  "ghincapie@solutionsandpayroll.com",
];

const FECHA_DESDE = "2026-09-03T00:00:00Z";
const FECHA_HASTA = "2026-09-03T23:59:59Z";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    console.log("Iniciando procesamiento de correos...");
    console.log(`Buzones: ${BUZONES.join(", ")}`);
    console.log(`Fecha desde: ${FECHA_DESDE}`);
    console.log(`Fecha hasta: ${FECHA_HASTA}`);

    const token = await getGraphToken();
    console.log("Token de Graph obtenido");

    const resultados = {
      total: 0,
      solicitudes: 0,
      noSolicitudes: 0,
      respondidos: 0,
      pendientes: 0,
      errores: 0,
      detalles: [] as any[],
    };

    for (const buzón of BUZONES) {
      console.log(`\nProcesando buzón: ${buzón}`);

      try {
        // Obtener nombre del encargado
        const perfil = await getUserProfile(buzón, token);
        const nombreEncargado = perfil.displayName;
        console.log(`  Encargado: ${nombreEncargado}`);

        const emails = await getEmailsFromMailbox(buzón, FECHA_DESDE, FECHA_HASTA, token);
        console.log(`  ${emails.length} correos encontrados`);

        for (const email of emails) {
          try {
            resultados.total++;

            const subject = email.subject || "(Sin asunto)";
            const body = email.body?.content || "";
            const sender = email.from?.emailAddress?.address || "";
            const conversationId = email.conversationId;

            console.log(`    ConversationId: ${conversationId || 'NO TIENE'}`);

            // Filtro: solo procesar correos de dominios de clientes
            if (!esDominioCliente(sender)) {
              console.log(
                `  [${resultados.total}] Saltando (no es cliente): ${sender}`
              );
              resultados.noSolicitudes++;
              continue;
            }

            console.log(
              `  [${resultados.total}] Clasificando: ${subject.substring(0, 50)}...`
            );

            let clasificacion;
            try {
              clasificacion = await classifyEmail(subject, body, sender);
              console.log(
                `    Resultado: ${clasificacion.esSolicitud ? "SOLICITUD" : "NO SOLICITUD"} (confianza: ${clasificacion.confianza})`
              );
            } catch (error) {
              console.error(`    Error clasificando:`, error);
              resultados.errores++;
              continue;
            }

            if (clasificacion.esSolicitud) {
              resultados.solicitudes++;

              let respondido = false;
              let fechaRespuesta = null;

              if (conversationId) {
                const conversationEmails = await getConversationEmails(
                  subject,
                  buzón,
                  token
                );
                const verificacion = await checkIfResponded(
                  conversationEmails,
                  sender,
                  email.receivedDateTime
                );
                respondido = verificacion.respondido;
                fechaRespuesta = verificacion.fechaRespuesta;

                if (respondido) {
                  resultados.respondidos++;
                } else {
                  resultados.pendientes++;
                }
              }

            // Calcular SLA
            const sla = calcularSLA(new Date(email.receivedDateTime), fechaRespuesta ? new Date(fechaRespuesta) : undefined);
            
            if (respondido) {
              console.log(`    📅 Fecha recepción: ${email.receivedDateTime}`);
              console.log(`    📅 Fecha respuesta: ${fechaRespuesta}`);
              console.log(`    ⏱️  Tiempo hábil calculado: ${sla.tiempoHabil}`);
            }

            const solicitud = await prisma.solicitud.create({
              data: {
                asunto: subject,
                cuerpo: body.substring(0, 5000),
                remitente: sender,
                encargado: nombreEncargado,
                fechaRecibido: new Date(email.receivedDateTime),
                inicioConteoSLA: sla.inicioConteoSLA,
                vencimientoSLA: sla.vencimientoSLA,
                fechaRespuesta: fechaRespuesta
                  ? new Date(fechaRespuesta)
                  : null,
                tiempoHabil: sla.tiempoHabil,
                estadoSLA: sla.estadoSLA,
                estado: respondido ? "respondida" : "en_gestion",
                conversationId: conversationId || null,
                clasificacionIA: "SOLICITUD",
                confianzaIA: clasificacion.confianza,
                nombreCliente: clasificacion.cliente,
                paisCliente: clasificacion.pais,
                tipoProceso: clasificacion.tipoProceso,
                correoCliente: clasificacion.correoCliente,
              },
            });

              resultados.detalles.push({
                id: solicitud.id,
                asunto: subject,
                remitente: sender,
                buzón,
                esSolicitud: true,
                respondido,
                cliente: clasificacion.cliente,
                pais: clasificacion.pais,
                tipoProceso: clasificacion.tipoProceso,
                confianza: clasificacion.confianza,
              });

              console.log(
                `    ✓ SOLICITUD - ${respondido ? "Respondido" : "Pendiente"}`
              );
            } else {
              resultados.noSolicitudes++;
              console.log(`    ✗ No es solicitud`);
            }

            // Esperar 5 segundos entre peticiones para evitar rate limits
            await new Promise((resolve) => setTimeout(resolve, 5000));
          } catch (error) {
            resultados.errores++;
            console.error(`  Error procesando correo:`, error);
          }
        }
      } catch (error) {
        console.error(`Error procesando buzón ${buzón}:`, error);
        resultados.errores++;
      }
    }

    console.log("\n=== RESUMEN ===");
    console.log(`Total procesados: ${resultados.total}`);
    console.log(`Solicitudes: ${resultados.solicitudes}`);
    console.log(`No solicitudes: ${resultados.noSolicitudes}`);
    console.log(`Respondidos: ${resultados.respondidos}`);
    console.log(`Pendientes: ${resultados.pendientes}`);
    console.log(`Errores: ${resultados.errores}`);

    return NextResponse.json({
      success: true,
      resumen: {
        total: resultados.total,
        solicitudes: resultados.solicitudes,
        noSolicitudes: resultados.noSolicitudes,
        respondidos: resultados.respondidos,
        pendientes: resultados.pendientes,
        errores: resultados.errores,
      },
      detalles: resultados.detalles,
    });
  } catch (error: any) {
    console.error("Error en procesar-correos:", error);
    return NextResponse.json(
      { error: error.message || "Error procesando correos" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const solicitudes = await prisma.solicitud.findMany({
    orderBy: { fechaRecibido: "desc" },
    take: 50,
  });

  return NextResponse.json({ solicitudes });
}
