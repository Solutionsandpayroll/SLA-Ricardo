"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  FileText,
  BarChart3,
  Users,
  FileSpreadsheet,
  LogOut,
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
    <aside className="sticky top-0 flex h-dvh w-[72px] shrink-0 flex-col overflow-y-auto bg-[#102a43] px-2.5 py-4 text-white md:w-[260px] md:px-4 md:py-6">
      {/* Logo */}
      <Link
        href="/dashboard"
        aria-label="Ir al inicio"
        className="mb-2 flex items-center justify-center border-b border-white/10 px-0 pb-4 outline-none focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#d62839] md:px-2 md:pb-6"
      >
        <Image
          src="/imagen.png"
          alt="Solutions & Payroll"
          width={200}
          height={86}
          priority
          className="h-auto w-full max-w-[200px]"
        />
      </Link>

      {/* Etiqueta */}
      <p className="mx-3 mb-2.5 mt-5 hidden text-[11px] font-bold tracking-[1.2px] text-white/55 md:block">
        MENÚ PRINCIPAL
      </p>

      {/* Navegación */}
      <nav
        aria-label="Navegación principal"
        className="mt-4 flex flex-col gap-1.5 md:mt-0"
      >
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.title}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex w-full items-center justify-center gap-3 rounded-[10px] border border-transparent p-3 text-sm font-semibold text-white outline-none transition-colors duration-200 focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#d62839] md:justify-start md:px-3.5",
                isActive
                  ? "border-white/15 bg-white/[0.12] shadow-[inset_3px_0_0_#d62839]"
                  : "hover:bg-white/[0.08]"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="hidden truncate md:inline">{item.title}</span>
            </Link>
          );
        })}
      </nav>

      {/* Parte inferior */}
      <div className="mt-auto border-t border-white/10 pt-4">
        <div className="mb-2 flex min-w-0 items-center justify-center gap-3 px-0 py-2 md:justify-start md:px-2">
          <Avatar className="h-9 w-9 shrink-0 border-2 border-white/20">
            <AvatarImage src={user.image || ""} alt={user.name || "Usuario"} />
            <AvatarFallback className="bg-[#d62839] text-sm font-bold text-white">
              {userInitial}
            </AvatarFallback>
          </Avatar>

          <div className="hidden min-w-0 flex-1 md:block">
            <p className="truncate text-sm font-semibold text-white">
              {user.name || "Usuario"}
            </p>
            <p className="mt-0.5 truncate text-xs text-white/60">
              {user.email || "Correo no disponible"}
            </p>
          </div>
        </div>

        <button
          type="button"
          title="Cerrar sesión"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-[10px] border border-transparent bg-transparent p-3 text-sm font-semibold text-white outline-none transition-colors duration-200 hover:bg-white/[0.08] focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#d62839] md:justify-start md:px-3.5"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span className="hidden md:inline">Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}