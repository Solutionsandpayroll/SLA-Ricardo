import { ConfidentialClientApplication } from "@azure/msal-node";
import { config } from "@/lib/config";

export interface GraphEmail {
  id: string;
  conversationId?: string;
  subject?: string;
  receivedDateTime: string;
  sentDateTime?: string;
  body?: {
    contentType?: string;
    content?: string;
  };
  from?: {
    emailAddress?: {
      name?: string;
      address?: string;
    };
  };
  toRecipients?: Array<{
    emailAddress?: {
      name?: string;
      address?: string;
    };
  }>;
  internetMessageId?: string;
  isRead?: boolean;
}

const msalClient = new ConfidentialClientApplication({
  auth: {
    clientId: config.azure.clientId,
    clientSecret: config.azure.clientSecret,
    authority: `https://login.microsoftonline.com/${config.azure.tenantId}`,
  },
});

const GRAPH_URL = "https://graph.microsoft.com/v1.0";

async function obtenerToken(): Promise<string> {
  const result = await msalClient.acquireTokenByClientCredential({
    scopes: ["https://graph.microsoft.com/.default"],
  });

  if (!result?.accessToken) {
    throw new Error("No fue posible obtener el token de Microsoft Graph.");
  }

  return result.accessToken;
}

async function graphFetch<T>(
  endpoint: string,
  accessToken: string
): Promise<T> {
  const response = await fetch(`${GRAPH_URL}${endpoint}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.text();

    throw new Error(
      `Error de Microsoft Graph (${response.status}): ${error.substring(0, 500)}`
    );
  }

  return response.json() as Promise<T>;
}

interface GraphCollection<T> {
  value: T[];
  "@odata.nextLink"?: string;
}

async function obtenerColeccion<T>(
  endpoint: string,
  accessToken: string,
  maxPages = 5
): Promise<T[]> {
  const resultados: T[] = [];
  let url: string | undefined = `${GRAPH_URL}${endpoint}`;
  let pagina = 0;

  while (url && pagina < maxPages) {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const error = await response.text();

      throw new Error(
        `Error de Microsoft Graph (${response.status}): ${error.substring(0, 500)}`
      );
    }

    const data = (await response.json()) as GraphCollection<T>;

    resultados.push(...(data.value || []));

    url = data["@odata.nextLink"];
    pagina++;
  }

  return resultados;
}

/**
 * Obtiene el perfil del buzón configurado.
 */
export async function getUserProfile(mailbox: string) {
  const token = await obtenerToken();

  return graphFetch<{
    id: string;
    displayName: string;
    mail: string | null;
    userPrincipalName: string;
  }>(
    `/users/${encodeURIComponent(mailbox)}?$select=id,displayName,mail,userPrincipalName`,
    token
  );
}

/**
 * Obtiene correos recibidos en el buzón.
 */
export async function getEmailsFromMailbox(
  mailbox: string,
  limit = 100
): Promise<GraphEmail[]> {
  const token = await obtenerToken();

  const endpoint =
    `/users/${encodeURIComponent(mailbox)}/mailFolders/inbox/messages` +
    `?$top=${Math.min(Math.max(limit, 1), 100)}` +
    `&$orderby=receivedDateTime desc` +
    `&$select=id,conversationId,subject,receivedDateTime,sentDateTime,body,from,toRecipients,internetMessageId,isRead`;

  return obtenerColeccion<GraphEmail>(endpoint, token);
}

/**
 * Obtiene correos enviados desde el buzón.
 */
export async function getSentEmailsFromMailbox(
  mailbox: string,
  limit = 100
): Promise<GraphEmail[]> {
  const token = await obtenerToken();

  const endpoint =
    `/users/${encodeURIComponent(mailbox)}/mailFolders/sentitems/messages` +
    `?$top=${Math.min(Math.max(limit, 1), 100)}` +
    `&$orderby=sentDateTime desc` +
    `&$select=id,conversationId,subject,receivedDateTime,sentDateTime,body,from,toRecipients,internetMessageId,isRead`;

  return obtenerColeccion<GraphEmail>(endpoint, token);
}

/**
 * Obtiene los correos de una conversación específica.
 */
export async function getConversationEmails(
  mailbox: string,
  conversationId: string
): Promise<GraphEmail[]> {
  const token = await obtenerToken();

  const filter = encodeURIComponent(
    `conversationId eq '${conversationId.replace(/'/g, "''")}'`
  );

  const endpoint =
    `/users/${encodeURIComponent(mailbox)}/messages` +
    `?$filter=${filter}` +
    `&$top=100` +
    `&$orderby=receivedDateTime asc` +
    `&$select=id,conversationId,subject,receivedDateTime,sentDateTime,body,from,toRecipients,internetMessageId,isRead`;

  return obtenerColeccion<GraphEmail>(endpoint, token);
}