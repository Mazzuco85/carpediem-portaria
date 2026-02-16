import { NextRequest, NextResponse } from "next/server";
import { ensureApiAuth } from "@/lib/api-auth";
import { supabaseRest } from "@/lib/supabase";
import type { MoradorV2 } from "@/lib/types";

export async function GET(request: NextRequest) {
  const unauthorized = ensureApiAuth(request);
  if (unauthorized) return unauthorized;

  const queryValue = request.nextUrl.searchParams.get("q")?.trim();
  const escapedQueryValue = queryValue?.replace(/[(),]/g, " ");

  try {
    const data = await supabaseRest<MoradorV2[]>("moradores_v2", {
      query: {
        select: "id,nome,apartamento,telefone,email,torre_id",
        order: "nome.asc",
        ...(escapedQueryValue
          ? {
              or: `(nome.ilike.*${escapedQueryValue}*,apartamento.ilike.*${escapedQueryValue}*)`,
            }
          : {}),
      },
    });

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Não foi possível carregar moradores agora. Tente novamente." }, { status: 500 });
  }
}
