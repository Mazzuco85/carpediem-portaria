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
        select: "id,nome,apartamento,telefone,email,torre_id,torres(codigo)",
        order: "nome.asc",
        ...(escapedQueryValue
          ? {
              or: `(nome.ilike.*${escapedQueryValue}*,apartamento.ilike.*${escapedQueryValue}*,telefone.ilike.*${escapedQueryValue}*)`,
            }
          : {}),
      },
    });

    const normalized = data.map((morador) => ({
      id: morador.id,
      nome: morador.nome,
      apartamento: morador.apartamento,
      telefone: morador.telefone,
      email: morador.email,
      torre_id: morador.torre_id,
      unidade: morador.torres?.codigo ? `${morador.apartamento}/${morador.torres.codigo}` : morador.apartamento,
    }));

    return NextResponse.json(normalized);
  } catch {
    return NextResponse.json({ error: "Não foi possível carregar moradores agora. Tente novamente." }, { status: 500 });
  }
}
