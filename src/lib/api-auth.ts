import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedRequest } from "@/lib/auth";

export function ensureApiAuth(request: NextRequest): NextResponse | null {
  if (!isAuthenticatedRequest(request)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  return null;
}
