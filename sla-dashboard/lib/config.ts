export const config = {
  azure: {
    clientId: process.env.AZURE_AD_CLIENT_ID!,
    clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
    tenantId: process.env.AZURE_AD_TENANT_ID!,
  },
  groq: {
    apiKey: process.env.GROQ_API_KEY!,
  },
};
