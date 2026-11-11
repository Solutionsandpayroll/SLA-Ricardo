"use client";

import { useRouter } from "next/navigation";
import BotonEliminarSolicitud from "./boton-eliminar-solicitud";

export default function BotonEliminarSolicitudFila({
  id,
  asunto,
}: {
  id: string;
  asunto: string;
}) {
  const router = useRouter();

  return (
    <BotonEliminarSolicitud
      id={id}
      asunto={asunto}
      onEliminada={() => router.refresh()}
      onError={(mensaje) => window.alert(mensaje)}
    />
  );
}