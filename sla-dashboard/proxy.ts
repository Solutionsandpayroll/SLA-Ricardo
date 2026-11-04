
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Login administrativo
  if (pathname === "/admin/login") {
    if (token?.role === "ADMIN") {
      return NextResponse.redirect(
        new URL("/admin/dashboard", request.url)
      );
    }

    return NextResponse.next();
  }

  // Proteger el panel administrativo
  if (pathname.startsWith("/admin/dashboard")) {
    if (!token) {
      return NextResponse.redirect(
        new URL("/admin/login",
          request.url)
      );
    }

    if (token.role !== "ADMIN") {
      return NextResponse.redirect(
        new URL("/dashboard", request.url)
      );
    }
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: ["/admin/:path*"],
};
