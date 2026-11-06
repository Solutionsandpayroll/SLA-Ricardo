export const config = {
  azure: {
    clientId: process.env.AZURE_AD_CLIENT_ID!,
    clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
    tenantId: process.env.AZURE_AD_TENANT_ID!,
  },
  groq: {
    apiKey: process.env.GROQ_API_KEY!,
  },
  sla: {
    // Plazo por defecto en horas hábiles (se puede cambiar con la variable SLA_HORAS).
    horasPorDefecto:
      Number(process.env.SLA_HORAS) > 0 ? Number(process.env.SLA_HORAS) : 2,
    // Minutos hábiles restantes para marcar una solicitud como "próxima a vencer".
    minutosAlertaProximo:
      Number(process.env.SLA_MINUTOS_ALERTA) > 0
        ? Number(process.env.SLA_MINUTOS_ALERTA)
        : 30,
  },
};