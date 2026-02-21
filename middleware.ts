import { NextRequest, NextResponse } from “next/server”;

const AUTH_COOKIE_NAME = “portaria_session”;
const PUBLIC_ROUTES = new Set([”/login”, “/api/auth/login”]);

/**

- O middleware apenas verifica se o cookie de sessão existe e tem formato válido.
- A validação criptográfica real acontece nos Route Handlers (Node.js runtime),
- onde o módulo crypto está disponível.
  */
  export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

const isPublic = PUBLIC_ROUTES.has(pathname);
const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

// Cookie válido = existe e tem 64 caracteres hex (HMAC-SHA256)
const isAuthenticated = typeof token === “string” && /^[a-f0-9]{64}$/.test(token);

if (!isAuthenticated && !isPublic) {
return NextResponse.redirect(new URL(”/login”, request.url));
}

if (isAuthenticated && pathname === “/login”) {
return NextResponse.redirect(new URL(”/dashboard”, request.url));
}

return NextResponse.next();
}

export const config = {
matcher: [”/((?!_next/static|_next/image|favicon.ico|.*\..*).+)”],
};
