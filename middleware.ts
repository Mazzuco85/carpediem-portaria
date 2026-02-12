import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, buildSessionToken } from "@/lib/auth";

const publicRoutes = ["/login", "/api/auth/login"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/public") ||
    pathname.match(/\.(.*)$/)
  ) {
    return NextResponse.next();
  }

  const isPublic = publicRoutes.some((route) => pathname === route);
  const isAuthenticated = request.cookies.get(AUTH_COOKIE_NAME)?.value === buildSessionToken();

  if (!isAuthenticated && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthenticated && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
