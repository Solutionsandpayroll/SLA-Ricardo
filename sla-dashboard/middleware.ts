import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;

    // El login de administrador es público.
    if (pathname === "/admin/login") {
      return NextResponse.next();
    }

    const role = req.nextauth.token?.role;

    // Un empleado no puede entrar a ninguna ruta /admin.
    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Sin sesión, NextAuth envía al usuario a "/" (pages.signIn).
      authorized: ({ token, req }) =>
        req.nextUrl.pathname === "/admin/login" || !!token,
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/admin", "/admin/:path*"],
};