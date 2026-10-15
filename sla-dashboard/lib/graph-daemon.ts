
import { ConfidentialClientApplication } from "@azure/msal-node";
import { prisma } from "./prisma";

export interface GraphEmail {
  id: string;
  subject?: string;
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
  receivedDateTime: string;
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

const cca = new ConfidentialClientApplication({
  auth: {
    clientId: process.env.AZURE_AD_CLIENT_ID!,
    authority: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID!}`,
    clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
  },
});

const GRAPH_URL = "https://graph.microsoft.com/v1.0";

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

async function graphFetch<T>(
  endpoint: string,
  token: string
): Promise<T> {
  const response = await fetch(`${GRAPH_URL}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
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
      "id,subject,body,from,receivedDateTime,conversationId,internetMessageId",
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

export async function getUserProfile(
  _userEmail: string,
  token: string
): Promise<GraphProfile> {
  const params = new URLSearchParams({
    "$select": "displayName,mail,userPrincipalName",
  });

  return graphFetch<GraphProfile>(`/me?${params.toString()}`, token);
}

export async function getConversationEmails(
  conversationId: string,
  _mailbox: string,
  token: string
): Promise<GraphEmail[]> {
  const escapedConversationId = conversationId.replace(/'/g, "''");

  const params = new URLSearchParams({
    "$select":
      "id,subject,body,from,receivedDateTime,conversationId,internetMessageId",
    "$filter": `conversationId eq '${escapedConversationId}'`,
    "$orderby": "receivedDateTime asc",
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

  return emails;
}

export { getGraphToken };
