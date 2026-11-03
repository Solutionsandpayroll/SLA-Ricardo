
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // La pantalla de login de admin es pública.
  // Si ya es administrador, lo mandamos directo al panel.
  if (pathname === "/admin/login") {
    if (token?.role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  // Si no ha iniciado sesión, regresar al inicio.
  if (!token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Si no es administrador, impedir el acceso al panel admin.
  if (pathname.startsWith("/admin") && token.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/solicitudes", request.url));
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/solicitudes/:path*",
    "/analisis/:path*",
    "/admin/:path*",
  ],
};