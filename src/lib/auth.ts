import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { getEnv, hasAdminConfig } from "@/lib/env";

export const AUTH_COOKIE_NAME = "portaria_session";

/**
 * Gera um token de sessão usando HMAC-SHA256.
 * O resultado é determinístico (mesmo input → mesmo token),
 * mas computacionalmente inviável de forjar sem o AUTH_SECRET.
 */
export function buildSessionToken(): string | null {
  if (!hasAdminConfig()) return null;

  const secret = process.env.AUTH_SECRET ?? "portaria-secret";
  const payload = `${getEnv("ADMIN_USER")}:${getEnv("ADMIN_PASS")}`;

  return createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Compara dois tokens usando tempo constante para evitar timing attacks.
 * Retorna false se os tokens tiverem tamanhos diferentes (sem vazar info).
 */
function safeTokenCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, "hex");
    const bufB = Buffer.from(b, "hex");
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Compara credenciais de login usando tempo constante.
 * Use esta função no lugar de === para evitar timing attacks.
 */
export function verifyCredentials(username: string, password: string): boolean {
  if (!hasAdminConfig()) return false;

  const expectedUser = getEnv("ADMIN_USER") ?? "";
  const expectedPass = getEnv("ADMIN_PASS") ?? "";

  // Ambas as comparações sempre executam — sem short-circuit
  const userMatch = safeStringCompare(username, expectedUser);
  const passMatch = safeStringCompare(password, expectedPass);

  return userMatch && passMatch;
}

function safeStringCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, "utf8");
    const bufB = Buffer.from(b, "utf8");
    // Padeia o buffer menor para evitar vazar tamanho via timing
    const maxLen = Math.max(bufA.length, bufB.length);
    const paddedA = Buffer.concat([bufA, Buffer.alloc(maxLen - bufA.length)]);
    const paddedB = Buffer.concat([bufB, Buffer.alloc(maxLen - bufB.length)]);
    // Ainda verificamos tamanho separadamente (sem timing leak aqui)
    const sameLength = bufA.length === bufB.length;
    return timingSafeEqual(paddedA, paddedB) && sameLength;
  } catch {
    return false;
  }
}

export function isAuthenticatedRequest(request: NextRequest): boolean {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const sessionToken = buildSessionToken();

  if (!token || !sessionToken) return false;

  return safeTokenCompare(token, sessionToken);
}

export async function isAuthenticatedServer(): Promise<boolean> {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  const sessionToken = buildSessionToken();

  if (!token || !sessionToken) return false;

  return safeTokenCompare(token, sessionToken);
}
