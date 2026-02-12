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
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const unauthorized = ensureApiAuth(request);
  if (unauthorized) return unauthorized;

  const body = await request.json().catch(() => null);

  if (!body?.nome || !body?.apartamento || !body?.bloco) {
    return NextResponse.json({ error: "nome, apartamento e bloco são obrigatórios." }, { status: 400 });
  }

  try {
    const [created] = await supabaseRest<Morador[]>("moradores", {
      method: "POST",
      body: {
        nome: String(body.nome),
        apartamento: String(body.apartamento),
        bloco: String(body.bloco),
        telefone: body.telefone ? String(body.telefone) : null,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
