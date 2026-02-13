import { NextRequest, NextResponse } from "next/server";
import { ensureApiAuth } from "@/lib/api-auth";
import { supabaseRest } from "@/lib/supabase";
import type { Morador } from "@/lib/types";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = ensureApiAuth(request);
  if (unauthorized) return unauthorized;

  const body = await request.json().catch(() => null);
  const { id } = await params;
  const nome = body?.nome ? String(body.nome) : "";
  const unidade = body?.unidade ? String(body.unidade) : null;
  const apto = body?.apto ? String(body.apto) : "";
  const torre = body?.torre ? String(body.torre) : "";
  const telefone = body?.telefone ? String(body.telefone) : null;

  if (!nome || !apto || !torre) {
    return NextResponse.json({ error: "nome, apto e torre são obrigatórios." }, { status: 400 });
  }

  try {
    const [updated] = await supabaseRest<Morador[]>("moradores", {
      method: "PATCH",
      query: { id: `eq.${id}` },
      body: {
        nome,
        unidade,
        apto,
        torre,
        telefone,
      },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Não foi possível atualizar este morador." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = ensureApiAuth(request);
  if (unauthorized) return unauthorized;

  const { id } = await params;

  try {
    await supabaseRest<null>("moradores", {
      method: "DELETE",
      query: { id: `eq.${id}` },
      prefer: "return=minimal",
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Não foi possível remover este morador." }, { status: 500 });
  }
}
