
import { prisma } from "@/lib/prisma";
import { ClientesManager } from "./clientes-manager";
export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const solicitudes = await prisma.solicitud.findMany({
    where: {
      nombreCliente: {
        not: "",
      },
    },
    select: {
      nombreCliente: true,
      correoCliente: true,
      paisCliente: true,
    },
    orderBy: {
      nombreCliente: "asc",
    },
  });

  const clientesAgrupados = new Map<
    string,
    {
      nombre: string;
      dominio: string;
      pais: string | null;
      solicitudes: number;
    }
  >();

  for (const solicitud of solicitudes) {
    const nombre = solicitud.nombreCliente?.trim();

    if (!nombre) continue;

    const clave = nombre.toLocaleLowerCase("es");
    const clienteExistente = clientesAgrupados.get(clave);

    if (clienteExistente) {
      clienteExistente.solicitudes += 1;

      if (
        !clienteExistente.dominio &&
        solicitud.correoCliente
      ) {
        clienteExistente.dominio = solicitud.correoCliente;
      }

      if (
        !clienteExistente.pais &&
        solicitud.paisCliente
      ) {
        clienteExistente.pais = solicitud.paisCliente;
      }

      continue;
    }

    clientesAgrupados.set(clave, {
      nombre,
      dominio: solicitud.correoCliente ?? "",
      pais: solicitud.paisCliente ?? null,
      solicitudes: 1,
    });
  }

  const clientes = Array.from(
    clientesAgrupados.values()
  ).map((cliente, index) => ({
    id: `cliente-${index + 1}`,
    ...cliente,
  }));

  return <ClientesManager clientes={clientes} />;
}
