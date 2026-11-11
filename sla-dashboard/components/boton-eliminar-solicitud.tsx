"use client";

import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  id: string;
  asunto: string;
  onEliminada: (id: string) => void;
  onError?: (mensaje: string) => void;
}

export default function BotonEliminarSolicitud({
  id,
  asunto,
  onEliminada,
  onError,
}: Props) {
  const [eliminando, setEliminando] = useState(false);

  const eliminar = async () => {
    const ok = window.confirm(
      `¿Eliminar la solicitud "${asunto}"?\nEsta acción no se puede deshacer.`
    );
    if (!ok) return;

    setEliminando(true);
    try {
      const res = await fetch(
        `/api/procesar-correos?id=${encodeURIComponent(id)}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "No se pudo eliminar la solicitud.");
      }
      onEliminada(id);
    } catch (err) {
      onError?.(
        err instanceof Error ? err.message : "Error al eliminar la solicitud."
      );
    } finally {
      setEliminando(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={eliminar}
      disabled={eliminando}
      aria-label={`Eliminar solicitud ${asunto}`}
      title="Eliminar solicitud"
      className="cursor-pointer gap-1.5 whitespace-nowrap rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-600 shadow-sm transition-colors hover:border-red-600 hover:bg-red-600 hover:text-white focus-visible:ring-2 focus-visible:ring-red-300 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {eliminando ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Trash2 className="h-3.5 w-3.5" />
      )}
      {eliminando ? "Eliminando..." : "Eliminar"}
    </Button>
  );
}