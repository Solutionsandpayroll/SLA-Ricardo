
import {
  PublicClientApplication,
  type AuthenticationResult,
} from "@azure/msal-node";

const clientId = process.env.AZURE_AD_CLIENT_ID;
const tenantId = process.env.AZURE_AD_TENANT_ID;

if (!clientId || !tenantId) {
  throw new Error(
    "Faltan AZURE_AD_CLIENT_ID o AZURE_AD_TENANT_ID en .env.local"
  );
}

const msal = new PublicClientApplication({
  auth: {
    clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
  },
});

export async function authenticateWithDeviceCode(): Promise<AuthenticationResult> {
  const result = await msal.acquireTokenByDeviceCode({
    scopes: ["User.Read", "Mail.Read"],
    deviceCodeCallback: (response) => {
      console.log("\n=== INICIO DE SESIÓN DE MICROSOFT ===");
      console.log(response.message);
      console.log("====================================\n");
    },
  });

  if (!result?.accessToken) {
    throw new Error("Microsoft no devolvió un token de acceso.");
  }

  return result;
}
