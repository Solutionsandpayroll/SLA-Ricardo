"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  Building2,
  Inbox,
  BarChart3,
  LogOut,
} from "lucide-react";

const RUTA_PRINCIPAL = "/admin/dashboard";

const enlaces = [
  { href: RUTA_PRINCIPAL, texto: "Panel principal", icono: LayoutDashboard },
  { href: "/admin/dashboard/usuarios", texto: "Usuarios", icono: Users },
  { href: "/admin/dashboard/clientes", texto: "Clientes", icono: Building2 },
  { href: "/admin/dashboard/solicitudes", texto: "Solicitudes", icono: Inbox },
  { href: "/admin/dashboard/analisis", texto: "Análisis", icono: BarChart3 },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  function estaActivo(href: string) {
    // El panel principal solo se marca cuando estás exactamente en él,
    // porque el resto de rutas también empiezan con "/admin/dashboard"
    if (href === RUTA_PRINCIPAL) {
      return pathname === RUTA_PRINCIPAL;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-brand">
        <LayoutDashboard size={27} />
        <span>SLA Dashboard</span>
      </div>

      <p className="admin-sidebar-label">ADMINISTRACIÓN</p>

      <nav className="admin-sidebar-nav">
        {enlaces.map(({ href, texto, icono: Icono }) => {
          const activo = estaActivo(href);

          return (
            <Link
              key={href}
              href={href}
              className={`admin-sidebar-link${activo ? " active" : ""}`}
              aria-current={activo ? "page" : undefined}
            >
              <Icono size={20} />
              <span>{texto}</span>
            </Link>
          );
        })}
      </nav>

      <div className="admin-sidebar-bottom">
        <button
          type="button"
          className="admin-sidebar-link"
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          style={{
            width: "100%",
            background: "none",
            border: "none",
            cursor: "pointer",
            font: "inherit",
            textAlign: "left",
          }}
        >
          <LogOut size={20} />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}