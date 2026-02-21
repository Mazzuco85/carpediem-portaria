export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

const AUTH_COOKIE_NAME = "portaria_session";
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
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const isAuthenticated = typeof token === "string" && token.length > 10;

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
