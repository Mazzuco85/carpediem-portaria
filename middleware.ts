import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, isAuthenticatedRequest } from "@/lib/auth";

const PUBLIC_ROUTES = new Set(["/login", "/api/auth/login"]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_ROUTES.has(pathname);
  const isAuthenticated = isAuthenticatedRequest(request);

  if (!isAuthenticated && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthenticated && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Executa o middleware apenas em rotas relevantes.
     * Exclui automaticamente: _next/static, _next/image, favicon, arquivos com extensão.
     * Isso substitui os pathname.startsWith() manuais que estavam no corpo do middleware.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).+)",
  ],
};
