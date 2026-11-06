import { ConfidentialClientApplication } from "@azure/msal-node";
import { prisma } from "./prisma";

interface GraphAddress {
  emailAddress?: {
    name?: string;
    address?: string;
  };
}

export interface GraphEmail {
  id: string;
  subject?: string;
  body?: {
    contentType?: string;
    content?: string;
  };
  from?: GraphAddress;
  toRecipients?: GraphAddress[];
  ccRecipients?: GraphAddress[];
  receivedDateTime: string;
  sentDateTime?: string;
  isDraft?: boolean;
  parentFolderId?: string;
  conversationId?: string;
  internetMessageId?: string;
  [key: string]: unknown;
}

interface GraphResponse {
  value?: GraphEmail[];
  "@odata.nextLink"?: string;
}

interface GraphProfile {
  displayName?: string;
  mail?: string;
  userPrincipalName?: string;
}

interface GraphFolder {
  id?: string;
}

const cca = new ConfidentialClientApplication({
  auth: {
    clientId: process.env.AZURE_AD_CLIENT_ID!,
    authority: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID!}`,
    clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
  },
});

const GRAPH_URL = "https://graph.microsoft.com/v1.0";

const TEXT_BODY_PREFER = 'outlook.body-content-type="text"';

/**
 * Carpetas que NO deben contar al buscar respuestas en una conversación.
 * /me/messages consulta todas las carpetas del buzón, incluidas estas dos.
 */
const EXCLUDED_WELL_KNOWN_FOLDERS = ["deleteditems", "junkemail"];

/**
 * Obtiene el token de Microsoft Graph.
 * Renueva el token cuando está próximo a vencer.
 */
async function getGraphToken(userId: string): Promise<string> {
  const account = await prisma.account.findFirst({
    where: {
      userId,
      provider: "azure-ad",
    },
  });

  if (!account) {
    throw new Error(
      "No se encontró una cuenta de Microsoft vinculada. Cierra sesión e inicia sesión nuevamente."
    );
  }

  const now = Math.floor(Date.now() / 1000);

  if (
    account.access_token &&
    account.expires_at &&
    account.expires_at > now + 300
  ) {
    return account.access_token;
  }

  if (!account.refresh_token) {
    throw new Error(
      "No existe un refresh token de Microsoft. Inicia sesión nuevamente para autorizar los permisos."
    );
  }

  const result = await cca.acquireTokenByRefreshToken({
    refreshToken: account.refresh_token,
    scopes: ["User.Read", "Mail.Read"],
  });

  if (!result?.accessToken) {
    throw new Error(
      "No fue posible renovar el token de Microsoft. Inicia sesión nuevamente."
    );
  }

  await prisma.account.update({
    where: {
      id: account.id,
    },
    data: {
      access_token: result.accessToken,
      expires_at: result.expiresOn
        ? Math.floor(result.expiresOn.getTime() / 1000)
        : now + 3600,
      scope: result.scopes.join(" "),
    },
  });

  return result.accessToken;
}

/**
 * Consulta Microsoft Graph.
 */
async function graphFetch<T>(
  endpoint: string,
  token: string
): Promise<T> {
  const response = await fetch(`${GRAPH_URL}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      Prefer: TEXT_BODY_PREFER,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();

    throw new Error(
      `Error de Microsoft Graph (${response.status}): ${detail}`
    );
  }

  return (await response.json()) as T;
}

/**
 * Devuelve los ids de las carpetas que no deben contar como respuesta
 * (Elementos eliminados y Correo no deseado).
 * Si alguna carpeta no se puede consultar, simplemente se omite.
 */
async function getExcludedFolderIds(token: string): Promise<Set<string>> {
  const ids = await Promise.all(
    EXCLUDED_WELL_KNOWN_FOLDERS.map(async (folderName) => {
      try {
        const folder = await graphFetch<GraphFolder>(
          `/me/mailFolders/${folderName}?$select=id`,
          token
        );

        return folder.id;
      } catch (error) {
        console.warn(
          `No se pudo consultar la carpeta ${folderName}:`,
          error
        );

        return undefined;
      }
    })
  );

  return new Set(ids.filter((id): id is string => Boolean(id)));
}

/**
 * Obtiene correos recibidos en la bandeja de entrada
 * dentro del rango de fechas indicado.
 */
export async function getEmailsFromMailbox(
  _mailbox: string,
  sinceDate: Date | string,
  untilDate: Date | string,
  token: string
): Promise<GraphEmail[]> {
  const since = new Date(sinceDate).toISOString();
  const until = new Date(untilDate).toISOString();

  const params = new URLSearchParams({
    "$select":
      "id,subject,body,from,toRecipients,ccRecipients,receivedDateTime,sentDateTime,conversationId,internetMessageId",
    "$filter":
      `receivedDateTime ge ${since} and receivedDateTime le ${until}`,
    "$orderby": "receivedDateTime desc",
    "$top": "100",
  });

  const emails: GraphEmail[] = [];

  let nextUrl: string | undefined =
    `${GRAPH_URL}/me/mailFolders/inbox/messages?${params.toString()}`;

  while (nextUrl) {
    const response = await fetch(nextUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        Prefer: TEXT_BODY_PREFER,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const detail = await response.text();

      throw new Error(
        `Error consultando la Bandeja de entrada (${response.status}): ${detail}`
      );
    }

    const data = (await response.json()) as GraphResponse;

    emails.push(...(data.value ?? []));

    console.log(
      "Página de correos recibida:",
      data.value?.length ?? 0
    );

    nextUrl = data["@odata.nextLink"];
  }

  console.log(
    "Total de correos recuperados de la Bandeja de entrada:",
    emails.length
  );

  return emails;
}

/**
 * Obtiene el perfil del usuario autenticado en Microsoft.
 */
export async function getUserProfile(
  _userEmail: string,
  token: string
): Promise<GraphProfile> {
  const params = new URLSearchParams({
    "$select": "displayName,mail,userPrincipalName",
  });

  return graphFetch<GraphProfile>(`/me?${params.toString()}`, token);
}

/**
 * Devuelve todos los correos de una conversación,
 * incluyendo recibidos y enviados.
 *
 * /me/messages consulta todas las carpetas del buzón, así que los
 * Enviados sí se leen. Se excluyen borradores, Elementos eliminados
 * y Correo no deseado, y se ordenan cronológicamente.
 */
export async function getConversationEmails(
  conversationId: string,
  _mailbox: string,
  token: string
): Promise<GraphEmail[]> {
  const escapedConversationId = conversationId.replace(/'/g, "''");

  const params = new URLSearchParams({
    "$select":
      "id,subject,body,from,toRecipients,ccRecipients,receivedDateTime,sentDateTime,isDraft,parentFolderId,conversationId,internetMessageId",
    "$filter": `conversationId eq '${escapedConversationId}'`,
    "$top": "100",
  });

  const emails: GraphEmail[] = [];

  let nextUrl: string | undefined =
    `${GRAPH_URL}/me/messages?${params.toString()}`;

  while (nextUrl) {
    const response = await fetch(nextUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        Prefer: TEXT_BODY_PREFER,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const detail = await response.text();

      throw new Error(
        `Error consultando la conversación (${response.status}): ${detail}`
      );
    }

    const data = (await response.json()) as GraphResponse;

    emails.push(...(data.value ?? []));

    nextUrl = data["@odata.nextLink"];
  }

  const excludedFolderIds = await getExcludedFolderIds(token);

  return emails
    .filter((email) => !email.isDraft)
    .filter(
      (email) =>
        !email.parentFolderId ||
        !excludedFolderIds.has(email.parentFolderId)
    )
    .sort((a, b) => {
      const fechaA = new Date(
        a.sentDateTime || a.receivedDateTime
      ).getTime();

      const fechaB = new Date(
        b.sentDateTime || b.receivedDateTime
      ).getTime();

      return fechaA - fechaB;
    });
}

export { getGraphToken };