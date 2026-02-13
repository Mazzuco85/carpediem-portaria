import { NextRequest, NextResponse } from "next/server";
import { ensureApiAuth } from "@/lib/api-auth";
import { supabaseRest } from "@/lib/supabase";
import type { Morador } from "@/lib/types";

export async function GET(request: NextRequest) {
  const unauthorized = ensureApiAuth(request);
  if (unauthorized) return unauthorized;

  try {
    const data = await supabaseRest<Morador[]>("moradores", {
      query: { select: "*", order: "created_at.desc" },
    });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Não foi possível carregar moradores agora. Tente novamente." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const unauthorized = ensureApiAuth(request);
  if (unauthorized) return unauthorized;

  const body = await request.json().catch(() => null);
  const apto = body?.apto ?? body?.apartamento;
  const torre = body?.torre ?? body?.bloco;

  if (!body?.nome || !apto || !torre) {
    return NextResponse.json({ error: "nome, apto e torre são obrigatórios." }, { status: 400 });
  }

  try {
    const [created] = await supabaseRest<Morador[]>("moradores", {
      method: "POST",
      body: {
        nome: String(body.nome),
        unidade: body.unidade ? String(body.unidade) : null,
        apto: String(apto),
        torre: String(torre),
        telefone: body.telefone ? String(body.telefone) : null,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Não foi possível cadastrar este morador." }, { status: 500 });
  }
}
