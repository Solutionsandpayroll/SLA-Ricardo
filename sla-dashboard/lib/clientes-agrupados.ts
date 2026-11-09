import { prisma } from "@/lib/prisma";

export type ClienteAgrupado = {
  id: string;
  nombre: string;
  correo: string;
  dominio: string;
  pais: string | null;
  solicitudes: number;
  ultimaSolicitud: Date | null;
};

export async function obtenerClientesAgrupados(): Promise<ClienteAgrupado[]> {
  const solicitudes = await prisma.solicitud.findMany({
    where: { nombreCliente: { not: "" } },
    select: {
      nombreCliente: true,
      correoCliente: true,
      paisCliente: true,
      fechaRecibido: true,
    },
    orderBy: { nombreCliente: "asc" },
  });

  const agrupados = new Map<string, Omit<ClienteAgrupado, "id">>();

  for (const s of solicitudes) {
    const nombre = s.nombreCliente?.trim();
    if (!nombre) continue;

    const clave = nombre.toLocaleLowerCase("es");
    const existente = agrupados.get(clave);

    if (existente) {
      existente.solicitudes += 1;

      if (!existente.correo && s.correoCliente) {
        existente.correo = s.correoCliente;
        existente.dominio = s.correoCliente.split("@")[1] ?? s.correoCliente;
      }

      if (!existente.pais && s.paisCliente) {
        existente.pais = s.paisCliente;
      }

      if (
        !existente.ultimaSolicitud ||
        s.fechaRecibido > existente.ultimaSolicitud
      ) {
        existente.ultimaSolicitud = s.fechaRecibido;
      }

      continue;
    }

    const correo = s.correoCliente ?? "";

    agrupados.set(clave, {
      nombre,
      correo,
      dominio: correo.split("@")[1] ?? correo,
      pais: s.paisCliente ?? null,
      solicitudes: 1,
      ultimaSolicitud: s.fechaRecibido,
    });
  }

  return Array.from(agrupados.values()).map((c, i) => ({
    id: `cliente-${i + 1}`,
    ...c,
  }));
}