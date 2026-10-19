"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  BarChart3,
  Users,
  FileSpreadsheet,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

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

  const userInitial =
    user.name?.trim().charAt(0).toUpperCase() ||
    user.email?.trim().charAt(0).toUpperCase() ||
    "U";

  return (
    <aside className="flex h-dvh max-h-dvh w-64 shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white">
      {/* Logo con fondo azul oscuro */}
      <div className="shrink-0 p-3">
        <Link
          href="/dashboard"
          aria-label="Ir al inicio"
          className="relative block h-32 w-full overflow-hidden rounded-lg bg-[#102a43] outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        >
          <Image
            src="/imagen.png"
            alt="Logo"
            fill
            priority
            sizes="256px"
            className="object-contain p-2"
          />
        </Link>
      </div>

      <Separator className="shrink-0 bg-slate-200" />

      {/* Menú principal sin scroll */}
      <nav
        aria-label="Navegación principal"
        className="flex min-h-0 flex-1 flex-col gap-1 overflow-hidden px-3 py-4"
      >
        <p className="mb-2 shrink-0 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
          Menú principal
        </p>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "group relative flex shrink-0 items-center gap-3 overflow-hidden rounded-lg px-3 py-2.5 text-sm font-medium outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-red-500",
                isActive
                  ? "bg-[#102a43] text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-[#102a43]"
              )}
            >
              {isActive && (
                <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-[#d62839]" />
              )}

              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                  isActive
                    ? "bg-white/10 text-white"
                    : "bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-[#d62839]"
                )}
              >
                <Icon className="h-[17px] w-[17px]" />
              </span>

              <span className="min-w-0 flex-1 truncate">
                {item.title}
              </span>

              <ChevronRight
                className={cn(
                  "h-4 w-4 shrink-0 transition-all duration-200",
                  isActive
                    ? "text-white/80"
                    : "-translate-x-1 text-slate-300 opacity-0 group-hover:translate-x-0 group-hover:text-slate-500 group-hover:opacity-100"
                )}
              />
            </Link>
          );
        })}
      </nav>

      {/* Usuario y cierre de sesión */}
      <div className="mt-auto shrink-0">
        <Separator className="bg-slate-200" />

        <div className="p-3">
          <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Cuenta
          </p>

          <div className="mb-3 flex min-w-0 items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 p-2.5">
            <Avatar className="h-9 w-9 shrink-0 border-2 border-white shadow-sm">
              <AvatarImage
                src={user.image || ""}
                alt={user.name || "Usuario"}
              />
              <AvatarFallback className="bg-[#102a43] text-sm font-bold text-white">
                {userInitial}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-[#102a43]">
                {user.name || "Usuario"}
              </p>
              <p className="mt-0.5 truncate text-[11px] text-slate-500">
                {user.email || "Correo no disponible"}
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="h-9 w-full justify-center gap-2 rounded-lg border-slate-200 bg-white text-xs font-semibold text-slate-600 transition-all hover:border-red-200 hover:bg-red-50 hover:text-[#d62839]"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </Button>
        </div>
      </div>
    </aside>
  );
}