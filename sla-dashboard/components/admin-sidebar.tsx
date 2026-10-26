"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UserCog,
  Building2,
  Inbox,
  BarChart3,
  ArrowLeft,
} from "lucide-react";

const items = [
  { label: "Panel principal", href: "/admin", icon: LayoutDashboard, exact: true },
  { label: "Usuarios", href: "/admin/usuarios", icon: UserCog },
  { label: "Clientes", href: "/dashboard/clientes", icon: Building2 },
  { label: "Solicitudes", href: "/dashboard/solicitudes", icon: Inbox },
  { label: "Análisis", href: "/dashboard/analisis", icon: BarChart3 },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="admin-sidebar">
      <Link href="/admin" className="admin-sidebar-brand">
        <LayoutDashboard size={27} />
        <span>SLA Dashboard</span>
      </Link>

      <p className="admin-sidebar-label">MENÚ PRINCIPAL</p>

      <nav className="admin-sidebar-nav">
        {items.map(({ label, href, icon: Icon, exact }) => {
          const active = exact
            ? pathname === href
            : pathname === href || pathname.startsWith(href + "/");

          return (
            <Link
              key={href}
              href={href}
              className={`admin-sidebar-link${active ? " active" : ""}`}
            >
              <Icon size={20} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="admin-sidebar-bottom">
        <Link href="/dashboard" className="admin-sidebar-link">
          <ArrowLeft size={20} />
          <span>Volver al dashboard</span>
        </Link>
      </div>
    </aside>
  );
}