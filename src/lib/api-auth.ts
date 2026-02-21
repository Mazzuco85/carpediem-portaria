import { NextRequest, NextResponse } from “next/server”;
import { isAuthenticatedRequest } from “@/lib/auth”;

export async function ensureApiAuth(request: NextRequest): Promise<NextResponse | null> {
if (!(await isAuthenticatedRequest(request))) {
return NextResponse.json({ error: “Não autorizado.” }, { status: 401 });
}

return null;
}
