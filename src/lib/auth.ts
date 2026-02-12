import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { getEnv } from "@/lib/env";

export const AUTH_COOKIE_NAME = "portaria_session";

function toBase64Url(value: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(value, "utf8").toString("base64url");
  }

  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function buildSessionToken(): string {
  const user = getEnv("ADMIN_USER");
  const pass = getEnv("ADMIN_PASS");
  const secret = process.env.AUTH_SECRET ?? "portaria-secret";

  return toBase64Url(`${user}:${pass}:${secret}`);
}

export function isAuthenticatedRequest(request: NextRequest): boolean {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  return token === buildSessionToken();
}

export async function isAuthenticatedServer(): Promise<boolean> {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  return token === buildSessionToken();
}
