"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Ticket,
  Users,
  Clock3,
  ChartNoAxesCombined,
  ShieldCheck,
  ArrowRight,
  BadgeCheck,
} from "lucide-react";

const links = [
  { href: "/", label: "Inicio", icon: LayoutDashboard },
  { href: "/solicitudes", label: "Solicitudes", icon: Ticket, badge: "SLA" },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/tiempos", label: "Tiempos de respuesta", icon: Clock3 },
  { href: "/reportes", label: "Reportes SLA", icon: ChartNoAxesCombined },
];

export default function SlaSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <aside className="sla-sidebar">
      <div className="sla-brand">
        <Image
          src="/imagen.png"
          alt="Solutions & Payroll"
          width={280}
          height={120}
          priority
          className="sla-brand-logo"
        />
        <p>Seguimiento y control de solicitudes</p>
      </div>

      <nav className="sla-navigation" aria-label="Navegación principal">
        <span className="sla-nav-title">Menú</span>

        {links.map(({ href, label, icon: Icon, badge }) => (
          <Link
            key={href}
            href={href}
            className={`sla-nav-link${isActive(href) ? " active" : ""}`}
          >
            <Icon size={21} />
            <span>{label}</span>
            {badge && <span className="sla-nav-badge">{badge}</span>}
          </Link>
        ))}
      </nav>

      <div className="sla-sidebar-bottom">
        <div className="sla-session-status">
          <span className="sla-status-dot" />
          <span>Sesión: sin iniciar</span>
        </div>

        <Link href="/admin/login" className="sla-admin-link">
          <ShieldCheck size={20} />
          <span>Iniciar sesión admin</span>
          <ArrowRight size={16} className="sla-admin-link-arrow" />
        </Link>

        <div className="sla-sidebar-note">
          <BadgeCheck size={17} />
          <span>Acceso corporativo seguro</span>
        </div>
      </div>
    </aside>
  );
}