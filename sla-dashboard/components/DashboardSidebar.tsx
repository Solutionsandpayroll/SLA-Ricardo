"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  FileText,
  BarChart3,
  Users,
  FileSpreadsheet,
  LogOut,
  ChevronRight,
} from "lucide-react";

import "./dashboard-sidebar.css";

interface DashboardSidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

const enlaces = [
  { href: "/dashboard/solicitudes", texto: "Solicitudes", icono: FileText },
  { href: "/dashboard/analisis", texto: "Análisis", icono: BarChart3 },
  { href: "/dashboard/clientes", texto: "Clientes", icono: Users },
  {
    href: "/dashboard/exportar-informe",
    texto: "Exportar informe",
    icono: FileSpreadsheet,
  },
];

export default function DashboardSidebar({ user }: DashboardSidebarProps) {
  const pathname = usePathname();

  function estaActivo(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const inicial =
    user.name?.trim().charAt(0).toUpperCase() ||
    user.email?.trim().charAt(0).toUpperCase() ||
    "U";

  return (
    <aside className="dsb">
      <Link href="/dashboard" aria-label="Ir al inicio" className="dsb-brand">
        <Image
          src="/imagen.png"
          alt="Solutions & Payroll"
          width={200}
          height={86}
          priority
        />
      </Link>

      <div className="dsb-section">
        <p className="dsb-label">MENÚ PRINCIPAL</p>

        <nav className="dsb-nav" aria-label="Navegación principal">
          {enlaces.map(({ href, texto, icono: Icono }) => {
            const activo = estaActivo(href);

            return (
              <Link
                key={href}
                href={href}
                className={`dsb-link${activo ? " active" : ""}`}
                aria-current={activo ? "page" : undefined}
                title={texto}
              >
                <span className="dsb-icon">
                  <Icono size={18} />
                </span>
                <span className="dsb-text">{texto}</span>
                {activo && (
                  <ChevronRight size={16} className="dsb-chevron" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="dsb-bottom">
        <p className="dsb-label">CUENTA</p>

        <div className="dsb-user">
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.image}
              alt={user.name || "Usuario"}
              className="dsb-avatar"
            />
          ) : (
            <span className="dsb-avatar dsb-avatar-inicial">{inicial}</span>
          )}

          <div className="dsb-user-info">
            <p className="dsb-user-name">{user.name || "Usuario"}</p>
            <p className="dsb-user-email">
              {user.email || "Correo no disponible"}
            </p>
          </div>
        </div>

        <button
          type="button"
          className="dsb-logout"
          onClick={() => signOut({ callbackUrl: "/" })}
          title="Cerrar sesión"
        >
          <LogOut size={18} />
          <span className="dsb-text">Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}