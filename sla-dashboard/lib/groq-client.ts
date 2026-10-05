import { config } from "@/lib/config";

export interface ClassificationResult {
  esSolicitud: boolean;
  confianza: number;
  cliente: string | null;
  pais: string | null;
  tipoProceso: string | null;
  correoCliente: string | null;
}

export async function classifyEmail(
  subject: string,
  body: string,
  sender: string
): Promise<ClassificationResult> {
  const cleanBody = body.replace(/<[^>]*>/g, "").substring(0, 3000);

  const prompt = `Analiza este correo electrónico y determina si es una SOLICITUD de un cliente o NO es una solicitud.

SOLICITUD: El cliente pide algo específico (un trámite, información, un servicio, una gestión, etc.)
NO SOLICITUD: Es un correo informativo, notificación automática, saludo, firma, cadena, spam, etc.

Correo:
De: ${sender}
Asunto: ${subject}
Cuerpo: ${cleanBody}

Responde SOLO con un JSON válido en este formato exacto:
{
  "esSolicitud": true/false,
  "confianza": 0.0-1.0,
  "cliente": "nombre del cliente o null",
  "pais": "país mencionado o null",
  "tipoProceso": "tipo de solicitud o null",
  "correoCliente": "email del cliente o null"
}`;

  const maxRetries = 5;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.groq.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "qwen/qwen3.8-27b",
            messages: [
              {
                role: "system",
                content:
                  "Eres un asistente que clasifica correos electrónicos. Responde solo con JSON válido.",
              },
              { role: "user", content: prompt },
            ],
            temperature: 0.1,
            max_tokens: 500,
          }),
        }
      );

      if (response.status === 429) {
        // Rate limit exceeded - esperar más tiempo
        const waitTime = Math.pow(2, retries) * 5000; // 5s, 10s, 20s, 40s, 80s
        console.log(`    Rate limit alcanzado. Esperando ${waitTime / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        retries++;
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error de Groq (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;

      console.log(`    Respuesta IA: ${content.substring(0, 100)}...`);

      // Extraer JSON de la respuesta
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No se pudo extraer JSON de la respuesta");
      }

      const result = JSON.parse(jsonMatch[0]);

      return {
        esSolicitud: result.esSolicitud === true,
        confianza: result.confianza || 0.5,
        cliente: result.cliente || null,
        pais: result.pais || null,
        tipoProceso: result.tipoProceso || null,
        correoCliente: result.correoCliente || null,
      };
    } catch (error) {
      if (retries === maxRetries - 1) {
        console.error("Error clasificando correo:", error);
        throw error;
      }
      retries++;
      const waitTime = Math.pow(2, retries) * 3000;
      console.log(`    Error, reintentando en ${waitTime / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  throw new Error("Máximo de reintentos alcanzado");
}

export async function checkIfResponded(
  conversationEmails: any[],
  originalSender: string,
  originalDate: string
): Promise<{ respondido: boolean; fechaRespuesta: string | null }> {
  // Buscar si hay correos de la empresa al cliente después del correo original
  const domain = "solutionsandpayroll.com";

  // Ordenar correos por fecha (ascendente)
  const sortedEmails = [...conversationEmails].sort((a, b) => {
    return new Date(a.receivedDateTime).getTime() - new Date(b.receivedDateTime).getTime();
  });

  console.log(`      Conversación: ${sortedEmails.length} correos encontrados`);

  // Buscar correos de la empresa que sean posteriores al correo original
  const originalDateTime = new Date(originalDate).getTime();

  for (const email of sortedEmails) {
    const emailDateTime = new Date(email.receivedDateTime).getTime();
    const senderAddress = email.from?.emailAddress?.address || "";
    const senderDomain = senderAddress.split("@")[1]?.toLowerCase();

    // Solo considerar correos posteriores al original
    if (emailDateTime <= originalDateTime) {
      continue;
    }

    // Si el correo es de alguien de la empresa
    if (senderDomain === domain) {
      console.log(`      Respuesta encontrada: ${senderAddress} el ${email.receivedDateTime}`);
      return {
        respondido: true,
        fechaRespuesta: email.receivedDateTime,
      };
    }
  }

  return { respondido: false, fechaRespuesta: null };
}
