import { prisma } from "@/lib/prisma";

const normalizar = (t: string) =>
  t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

export interface ResponsableAsignado {
  responsable: string;
  correoResponsable: string;
}

/** Lista los tipos de proceso configurados, para dárselos a Groq. */
export async function listarProcesosValidos(): Promise<string[]> {
  const filas = await prisma.responsableProceso.findMany({
    where: { activo: true },
    select: { tipoProceso: true },
    distinct: ["tipoProceso"],
  });

  return filas.map((f) => f.tipoProceso);
}

/** Devuelve el responsable según tipoProceso y paisCliente. */
export async function asignarResponsable(
  tipoProceso: string | null,
  paisCliente: string | null
): Promise<ResponsableAsignado | null> {
  if (!tipoProceso) return null;

  const proceso = normalizar(tipoProceso);
  const pais = paisCliente ? normalizar(paisCliente) : "";

  const filas = await prisma.responsableProceso.findMany({
    where: { activo: true },
  });

  const delProceso = filas.filter(
    (f) => normalizar(f.tipoProceso) === proceso
  );

  const elegido =
    (pais
      ? delProceso.find((f) => normalizar(f.paisCliente) === pais)
      : undefined) ?? delProceso.find((f) => f.paisCliente === "*");

  return elegido
    ? {
        responsable: elegido.responsable,
        correoResponsable: elegido.correoResponsable,
      }
    : null;
}