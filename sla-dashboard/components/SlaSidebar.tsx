"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  LayoutDashboard,
  ChartNoAxesCombined,
  ShieldCheck,
  ArrowRight,
  BadgeCheck,
} from "lucide-react";

const links = [
  {
    href: "/",
    label: "Inicio",
    icon: LayoutDashboard,
  },
  {
    href: "/reportes",
    label: "Reportes SLA",
    icon: ChartNoAxesCombined,
    badge: "SLA",
  },
];

export default function SlaSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <aside className="sla-sidebar">
      {/* LOGO */}
      <div className="sla-brand">
        <Link href="/" aria-label="Ir al inicio">
          <Image
            src="/imagen.png"
            alt="Solutions & Payroll"
            width={280}
            height={120}
            priority
            className="sla-brand-logo"
          />
        </Link>

        <p>Seguimiento y control de solicitudes</p>
      </div>

      {/* MENÚ PRINCIPAL */}
      <nav className="sla-navigation" aria-label="Navegación principal">
        <span className="sla-nav-title">Menú</span>

        {links.map(({ href, label, icon: Icon, badge }) => (
          <Link
            key={href}
            href={href}
            title={label}
            className={`sla-nav-link ${isActive(href) ? "active" : ""}`}
          >
            <span className="sla-nav-icon">
              <Icon size={19} />
            </span>

            <span>{label}</span>

            {badge && <span className="sla-nav-badge">{badge}</span>}
          </Link>
        ))}
      </nav>

      {/* PARTE INFERIOR */}
      <div className="sla-sidebar-bottom">
        <div className="sla-session-status">
          <span className="sla-status-dot" />
          <span>Sesión: sin iniciar</span>
        </div>

        <Link href="/admin/login" className="sla-admin-link" title="Iniciar sesión admin">
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