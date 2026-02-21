import { NextResponse } from “next/server”;
import { AUTH_COOKIE_NAME, buildSessionToken, verifyCredentials } from “@/lib/auth”;
import { hasAdminConfig } from “@/lib/env”;

// Mapa em memória para rate limiting simples (por IP)
// Para produção, prefira Upstash Redis (veja comentário abaixo)
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_MAX = 5;          // tentativas
const RATE_LIMIT_WINDOW_MS = 60_000; // por minuto
const LOCKOUT_DELAY_MS = 1_000;    // penalidade por falha

function getRateLimitKey(request: Request): string {
// Em produção com Vercel, use o header x-forwarded-for
return request.headers.get(“x-forwarded-for”)?.split(”,”)[0]?.trim() ?? “unknown”;
}

function checkRateLimit(key: string): { allowed: boolean; remaining: number } {
const now = Date.now();
const entry = loginAttempts.get(key);

if (!entry || now > entry.resetAt) {
loginAttempts.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
}

if (entry.count >= RATE_LIMIT_MAX) {
return { allowed: false, remaining: 0 };
}

entry.count += 1;
return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count };
}

function resetRateLimit(key: string): void {
loginAttempts.delete(key);
}

export async function POST(request: Request) {
const body = await request.json().catch(() => null);

if (!body?.username || !body?.password) {
return NextResponse.json({ error: “Credenciais inválidas.” }, { status: 400 });
}

if (!hasAdminConfig()) {
return NextResponse.json(
{ error: “Variáveis ADMIN_USER e ADMIN_PASS não configuradas.” },
{ status: 500 }
);
}

// Rate limiting por IP
const ipKey = getRateLimitKey(request);
const { allowed } = checkRateLimit(ipKey);

if (!allowed) {
return NextResponse.json(
{ error: “Muitas tentativas. Aguarde 1 minuto.” },
{ status: 429 }
);
}

// Comparação em tempo constante via verifyCredentials
const valid = await verifyCredentials(body.username, body.password);

if (!valid) {
// Penalidade de tempo para dificultar brute force
await new Promise((r) => setTimeout(r, LOCKOUT_DELAY_MS));
return NextResponse.json({ error: “Usuário ou senha incorretos.” }, { status: 401 });
}

// Login bem-sucedido: limpar contagem de tentativas
resetRateLimit(ipKey);

const sessionToken = await buildSessionToken();

if (!sessionToken) {
return NextResponse.json(
{ error: “Não foi possível iniciar sessão no momento.” },
{ status: 500 }
);
}

const response = NextResponse.json({ ok: true });

response.cookies.set(AUTH_COOKIE_NAME, sessionToken, {
httpOnly: true,
secure: process.env.NODE_ENV === “production”,
sameSite: “lax”,
path: “/”,
maxAge: 60 * 60 * 8, // 8 horas
});

return response;
}

/*

- UPGRADE PARA PRODUÇÃO — Rate Limiting com Upstash Redis:
- 
- Se o servidor reiniciar, o Map em memória é zerado.
- Para persistência real, use:
- 
- import { Ratelimit } from “@upstash/ratelimit”;
- import { Redis } from “@upstash/redis”;
- 
- const ratelimit = new Ratelimit({
- redis: Redis.fromEnv(),
- limiter: Ratelimit.slidingWindow(5, “1 m”),
- });
- 
- const { success } = await ratelimit.limit(ipKey);
- if (!success) return NextResponse.json({ error: “…” }, { status: 429 });
  */
