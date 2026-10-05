import * as msal from "@azure/msal-node";
import { config } from "@/lib/config";

const msalConfig = {
  auth: {
    clientId: config.azure.clientId,
    authority: `https://login.microsoftonline.com/${config.azure.tenantId}`,
    clientSecret: config.azure.clientSecret,
  },
};

const cca = new msal.ConfidentialClientApplication(msalConfig);

export async function getGraphToken(): Promise<string> {
  const result = await cca.acquireTokenByClientCredential({
    scopes: ["https://graph.microsoft.com/.default"],
  });

  if (!result || !result.accessToken) {
    throw new Error("No se pudo obtener el token de Graph");
  }

  return result.accessToken;
}

export async function getEmailsFromMailbox(
  mailbox: string,
  sinceDate: string,
  untilDate: string,
  token: string
): Promise<any[]> {
  const allEmails: any[] = [];
  let url = `https://graph.microsoft.com/v1.0/users/${mailbox}/messages?$filter=receivedDateTime ge ${sinceDate} and receivedDateTime le ${untilDate}&$orderby=receivedDateTime desc&$select=id,subject,body,from,receivedDateTime,conversationId&$top=100`;

  while (url) {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `Error al leer correos de ${mailbox}: ${JSON.stringify(error)}`
      );
    }

    const data = await response.json();
    allEmails.push(...data.value);

    url = data["@odata.nextLink"] || "";
  }

  return allEmails;
}

export async function getUserProfile(
  userEmail: string,
  token: string
): Promise<{ displayName: string; mail: string }> {
  const url = `https://graph.microsoft.com/v1.0/users/${userEmail}?$select=displayName,mail`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `Error al obtener perfil de ${userEmail}: ${JSON.stringify(error)}`
    );
  }

  const data = await response.json();
  return {
    displayName: data.displayName,
    mail: data.mail,
  };
}

export async function getConversationEmails(
  subject: string,
  mailbox: string,
  token: string
): Promise<any[]> {
  // Limpiar el asunto: quitar Re:, RE:, Fwd:, caracteres especiales, y tomar solo palabras clave
  const cleanSubject = subject
    .replace(/^(Re|RE|Fwd|FW|RV|rv):\s*/gi, "") // Quitar prefijos
    .replace(/[\[\](){}<>]/g, "") // Quitar corchetes y paréntesis
    .replace(/ref:!?[^:]+:/g, "") // Quitar referencias tipo ref:!xxx:
    .replace(/\s+/g, " ") // Normalizar espacios
    .trim();

  // Tomar solo las primeras 5 palabras significativas para la búsqueda
  const keywords = cleanSubject
    .split(" ")
    .filter(word => word.length > 3) // Solo palabras con más de 3 caracteres
    .slice(0, 5)
    .join(" ");

  console.log(`      Buscando hilos con palabras clave: "${keywords}"`);

  // Usar $search sin $orderBy (no se pueden combinar)
  const url = `https://graph.microsoft.com/v1.0/users/${mailbox}/messages?$search="${keywords}"&$select=id,subject,from,receivedDateTime&$top=50`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ConsistencyLevel: "eventual", // Requerido para $search
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.log(`      Error en Graph API: ${response.status} - ${error.substring(0, 200)}`);
    return [];
  }

  const data = await response.json();
  const emails = data.value || [];
  
  // Ordenar en memoria por fecha (más antiguo primero)
  emails.sort((a, b) => {
    return new Date(a.receivedDateTime).getTime() - new Date(b.receivedDateTime).getTime();
  });
  
  console.log(`      Graph API devolvió ${emails.length} correos relacionados`);
  
  return emails;
}
