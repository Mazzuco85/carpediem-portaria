import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { getEnv, hasAdminConfig } from "@/lib/env";

export const AUTH_COOKIE_NAME = "portaria_session";

function toBase64Url(value: string): string {
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function buildSessionToken(): string | null {
  if (!hasAdminConfig()) {
    return null;
  }

  const user = getEnv("ADMIN_USER");
  const pass = getEnv("ADMIN_PASS");
  const secret = process.env.AUTH_SECRET ?? "portaria-secret";

  return toBase64Url(`${user}:${pass}:${secret}`);
}

export function isAuthenticatedRequest(request: NextRequest): boolean {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const sessionToken = buildSessionToken();

  if (!sessionToken) {
    return false;
  }

  return token === sessionToken;
}

export async function isAuthenticatedServer(): Promise<boolean> {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  const sessionToken = buildSessionToken();

  if (!sessionToken) {
    return false;
  }

  return token === sessionToken;
}
