import { NextRequest, NextResponse } from "next/server";
import { ensureApiAuth } from "@/lib/api-auth";
import { supabaseRest } from "@/lib/supabase";
import type { Encomenda } from "@/lib/types";

export async function GET(request: NextRequest) {
  const unauthorized = ensureApiAuth(request);
  if (unauthorized) return unauthorized;

  try {
    const data = await supabaseRest<Encomenda[]>("encomendas", {
      query: {
        select: "*,moradores(id,nome,apartamento,bloco,telefone)",
        order: "recebido_em.desc",
      },
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const unauthorized = ensureApiAuth(request);
  if (unauthorized) return unauthorized;

  const body = await request.json().catch(() => null);

  if (!body?.morador_id || !body?.descricao) {
    return NextResponse.json({ error: "morador_id e descricao são obrigatórios." }, { status: 400 });
  }

  try {
    const [created] = await supabaseRest<Encomenda[]>("encomendas", {
      method: "POST",
      body: {
        morador_id: body.morador_id,
        descricao: body.descricao,
        codigo_rastreio: body.codigo_rastreio ?? null,
        observacoes: body.observacoes ?? null,
        status: "pendente",
        recebido_em: new Date().toISOString(),
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
