/**

- auth.ts — compatível com Edge Runtime (Vercel Middleware)
- Usa Web Crypto API (globalThis.crypto) em vez do módulo “crypto” do Node.js.
  */
  import { cookies } from “next/headers”;
  import { NextRequest } from “next/server”;
  import { getEnv, hasAdminConfig } from “@/lib/env”;

export const AUTH_COOKIE_NAME = “portaria_session”;

// Cache do CryptoKey para não reimportar a cada request
let _cachedKey: CryptoKey | null = null;

async function getHmacKey(): Promise<CryptoKey> {
if (_cachedKey) return _cachedKey;

const secret = process.env.AUTH_SECRET ?? “portaria-secret”;
const keyData = new TextEncoder().encode(secret);

_cachedKey = await globalThis.crypto.subtle.importKey(
“raw”,
keyData,
{ name: “HMAC”, hash: “SHA-256” },
false,
[“sign”, “verify”]
);

return _cachedKey;
}

/**

- Gera um token de sessão usando HMAC-SHA256 via Web Crypto API.
- Determinístico e compatível com Edge Runtime.
  */
  export async function buildSessionToken(): Promise<string | null> {
  if (!hasAdminConfig()) return null;

const payload = `${getEnv("ADMIN_USER")}:${getEnv("ADMIN_PASS")}`;
const key = await getHmacKey();
const data = new TextEncoder().encode(payload);
const signature = await globalThis.crypto.subtle.sign(“HMAC”, key, data);

return Array.from(new Uint8Array(signature))
.map((b) => b.toString(16).padStart(2, “0”))
.join(””);
}

/**

- Verifica se um token hex é válido usando Web Crypto verify() — tempo constante.
  */
  async function isValidToken(token: string): Promise<boolean> {
  try {
  const key = await getHmacKey();
  const payload = `${getEnv("ADMIN_USER")}:${getEnv("ADMIN_PASS")}`;
  const data = new TextEncoder().encode(payload);
  
  const tokenBytes = new Uint8Array(
  token.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
  );
  
  return await globalThis.crypto.subtle.verify(“HMAC”, key, tokenBytes, data);
  } catch {
  return false;
  }
  }

/**

- Verifica credenciais de login em tempo constante via HMAC.
  */
  export async function verifyCredentials(
  username: string,
  password: string
  ): Promise<boolean> {
  if (!hasAdminConfig()) return false;

const encoder = new TextEncoder();
const key = await getHmacKey();

// Assina os 4 valores em paralelo — tempo constante independente do input
const [sigExpUser, sigRecUser, sigExpPass, sigRecPass] = await Promise.all([
globalThis.crypto.subtle.sign(“HMAC”, key, encoder.encode(getEnv(“ADMIN_USER”) ?? “”)),
globalThis.crypto.subtle.sign(“HMAC”, key, encoder.encode(username)),
globalThis.crypto.subtle.sign(“HMAC”, key, encoder.encode(getEnv(“ADMIN_PASS”) ?? “”)),
globalThis.crypto.subtle.sign(“HMAC”, key, encoder.encode(password)),
]);

// Compara HMACs — verify() garante tempo constante
const [userMatch, passMatch] = await Promise.all([
globalThis.crypto.subtle.verify(“HMAC”, key, sigRecUser, encoder.encode(getEnv(“ADMIN_USER”) ?? “”)),
globalThis.crypto.subtle.verify(“HMAC”, key, sigRecPass, encoder.encode(getEnv(“ADMIN_PASS”) ?? “”)),
]);

void sigExpUser; void sigExpPass; // calculados apenas para manter tempo constante

return userMatch && passMatch;
}

export async function isAuthenticatedRequest(request: NextRequest): Promise<boolean> {
const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
if (!token) return false;
return isValidToken(token);
}

export async function isAuthenticatedServer(): Promise<boolean> {
const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
if (!token) return false;
return isValidToken(token);
}
