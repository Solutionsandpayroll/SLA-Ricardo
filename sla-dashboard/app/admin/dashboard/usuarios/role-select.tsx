"use client";

import { useState, useTransition } from "react";
import { cambiarRol } from "./actions";

export default function RoleSelect({
  userId,
  rolActual,
}: {
  userId: string;
  rolActual: "USER" | "ADMIN";
}) {
  const [rol, setRol] = useState(rolActual);
  const [error, setError] = useState("");
  const [pendiente, startTransition] = useTransition();

  function onChange(nuevo: "USER" | "ADMIN") {
    const anterior = rol;
    setRol(nuevo);
    setError("");
    startTransition(async () => {
      const res = await cambiarRol(userId, nuevo);
      if (!res.ok) {
        setRol(anterior);
        setError(res.error ?? "No se pudo cambiar el rol.");
      }
    });
  }

  return (
    <div className="admin-role">
      <select
        className={`admin-role-select ${rol === "ADMIN" ? "is-admin" : ""}`}
        value={rol}
        disabled={pendiente}
        onChange={(e) => onChange(e.target.value as "USER" | "ADMIN")}
      >
        <option value="USER">Usuario</option>
        <option value="ADMIN">Administrador</option>
      </select>
      {error && <span className="admin-role-error">{error}</span>}
    </div>
  );
}