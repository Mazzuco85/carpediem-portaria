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
        select: "id,nome,apartamento,torre_id,telefone,email",
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
      torre_id: morador.torre_id,
      telefone: morador.telefone,
      email: morador.email,
      display: `${morador.apartamento} - ${morador.nome}`,
    }));

    return NextResponse.json(normalized);
  } catch {
    return NextResponse.json({ error: "Não foi possível carregar moradores agora. Tente novamente." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const unauthorized = ensureApiAuth(request);
  if (unauthorized) return unauthorized;

  const body = await request.json().catch(() => null);
  const nome = body?.nome ? String(body.nome).trim() : "";
  const apartamento = body?.apartamento ? String(body.apartamento).trim() : "";
  const telefone = body?.telefone ? String(body.telefone).trim() : null;
  const email = body?.email ? String(body.email).trim() : null;
  const torreId = body?.torre_id ? String(body.torre_id).trim() : null;

  if (!nome || !apartamento) {
    return NextResponse.json({ error: "nome e apartamento são obrigatórios." }, { status: 400 });
  }

  try {
    const [created] = await supabaseRest<MoradorV2[]>("moradores_v2", {
      method: "POST",
      body: {
        nome,
        apartamento,
        telefone,
        email,
        torre_id: torreId,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Não foi possível cadastrar este morador." }, { status: 500 });
  }
}
