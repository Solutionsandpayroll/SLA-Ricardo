
"use client";

import "../app/sidebar.css";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

import {
  FileText,
  BarChart3,
  Users,
  FileSpreadsheet,
  LogOut,
  ChevronRight,
  LayoutDashboard,
} from "lucide-react";

import { cn } from "@/lib/utils";

interface SidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

const menuItems = [
  {
    title: "Resumen",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Solicitudes",
    href: "/dashboard/solicitudes",
    icon: FileText,
  },
  {
    title: "Análisis",
    href: "/dashboard/analisis",
    icon: BarChart3,
  },
  {
    title: "Clientes",
    href: "/dashboard/clientes",
    icon: Users,
  },
  {
    title: "Exportar informe",
    href: "/dashboard/exportar-informe",
    icon: FileSpreadsheet,
  },
];

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  const userInitial =
    user.name?.trim().charAt(0).toUpperCase() ||
    user.email?.trim().charAt(0).toUpperCase() ||
    "U";

  return (
    <aside className="sticky top-0 z-40 flex h-screen h-dvh w-[76px] shrink-0 flex-col border-r border-white/[0.07] bg-[#10243e] text-white shadow-xl md:w-[270px]">

      {/* MARCA Y LOGO */}
      <div className="flex h-[135px] shrink-0 items-center justify-center border-b border-white/[0.08] px-2 md:h-[150px] md:px-5">
        <Link
          href="/dashboard"
          aria-label="Inicio del dashboard"
          className="flex h-full w-full items-center justify-center"
        >
          <Image
            src="/imagen.png"
            alt="Solutions & Payroll"
            width={240}
            height={110}
            priority
            className="h-auto max-h-[95px] w-full max-w-[225px] object-contain"
            sizes="(max-width: 767px) 60px, 225px"
          />
        </Link>
      </div>

      {/* NAVEGACIÓN */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-7 md:px-4">

        <p className="mb-4 hidden px-3 text-[10px] font-bold uppercase tracking-[2px] text-slate-400 md:block">
          Menú principal
        </p>

        <nav
          aria-label="Navegación principal"
          className="flex flex-col gap-2"
        >
          {menuItems.map((item) => {
            const Icon = item.icon;

            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.title}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "group relative flex min-h-[49px] items-center justify-center gap-3 rounded-xl px-3 text-sm font-medium transition-all duration-200 md:justify-start md:px-4",
                  isActive
                    ? "bg-white/[0.12] text-white shadow-sm"
                    : "text-slate-300 hover:bg-white/[0.07] hover:text-white"
                )}
              >
                {isActive && (
                  <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r-full bg-[#e4003a]" />
                )}

                <Icon
                  className={cn(
                    "h-[20px] w-[20px] shrink-0 transition-colors",
                    isActive
                      ? "text-[#ff536b]"
                      : "text-slate-400 group-hover:text-white"
                  )}
                  strokeWidth={2}
                />

                <span className="hidden flex-1 truncate md:block">
                  {item.title}
                </span>

                {isActive && (
                  <ChevronRight className="hidden h-4 w-4 text-[#ff536b] md:block" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* INFORMACIÓN DEL SISTEMA */}
        <div className="mt-9 hidden rounded-xl border border-white/[0.08] bg-white/[0.04] p-4 md:block">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />

            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
              Sistema activo
            </span>
          </div>

          <p className="text-xs leading-relaxed text-slate-400">
            Plataforma de seguimiento y gestión de solicitudes SLA.
          </p>
        </div>
      </div>

      {/* PERFIL Y CIERRE DE SESIÓN */}
      <div className="shrink-0 border-t border-white/[0.08] p-3 md:p-4">

        <div className="mb-3 flex items-center justify-center gap-3 rounded-xl bg-white/[0.05] p-2 md:justify-start md:p-3">
          <Avatar className="h-10 w-10 shrink-0 border border-white/20">
            <AvatarImage
              src={user.image || ""}
              alt={user.name || "Usuario"}
            />

            <AvatarFallback className="bg-[#d62839] font-bold text-white">
              {userInitial}
            </AvatarFallback>
          </Avatar>

          <div className="hidden min-w-0 flex-1 md:block">
            <p className="truncate text-sm font-semibold text-white">
              {user.name || "Usuario"}
            </p>

            <p className="mt-1 truncate text-[11px] text-slate-400">
              {user.email || "Correo no disponible"}
            </p>
          </div>
        </div>

        <button
          type="button"
          title="Cerrar sesión"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex min-h-[45px] w-full items-center justify-center gap-3 rounded-xl px-3 text-sm font-medium text-slate-300 transition-all duration-200 hover:bg-red-500/10 hover:text-red-400 md:justify-start md:px-4"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span className="hidden md:block">Cerrar sesión</span>
        </button>

        <p className="mt-3 hidden text-center text-[10px] text-slate-500 md:block">
          SOLUTIONS & PAYROLL · SLA
        </p>
      </div>
    </aside>
  );
}
