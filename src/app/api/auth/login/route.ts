import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, buildSessionToken } from "@/lib/auth";
import { getEnv, hasAdminConfig } from "@/lib/env";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body?.username || !body?.password) {
    return NextResponse.json({ error: "Credenciais inválidas." }, { status: 400 });
  }

  if (!hasAdminConfig()) {
    return NextResponse.json({ error: "Variáveis ADMIN_USER e ADMIN_PASS não configuradas." }, { status: 500 });
  }

  const valid = body.username === getEnv("ADMIN_USER") && body.password === getEnv("ADMIN_PASS");

  if (!valid) {
    return NextResponse.json({ error: "Usuário ou senha incorretos." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  const sessionToken = buildSessionToken();

  if (!sessionToken) {
    return NextResponse.json({ error: "Não foi possível iniciar sessão no momento." }, { status: 500 });
  }

  response.cookies.set(AUTH_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return response;
}
