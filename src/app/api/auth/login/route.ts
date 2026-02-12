import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, buildSessionToken } from "@/lib/auth";
import { getEnv } from "@/lib/env";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body?.username || !body?.password) {
    return NextResponse.json({ error: "Credenciais inválidas." }, { status: 400 });
  }

  const valid = body.username === getEnv("ADMIN_USER") && body.password === getEnv("ADMIN_PASS");

  if (!valid) {
    return NextResponse.json({ error: "Usuário ou senha incorretos." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(AUTH_COOKIE_NAME, buildSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return response;
}
