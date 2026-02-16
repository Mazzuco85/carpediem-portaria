import { NextRequest, NextResponse } from "next/server";
import { ensureApiAuth } from "@/lib/api-auth";
import { supabaseRest } from "@/lib/supabase";
import type { MoradorV2 } from "@/lib/types";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = ensureApiAuth(request);
  if (unauthorized) return unauthorized;

  const { id } = await params;
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
    const [updated] = await supabaseRest<MoradorV2[]>("moradores_v2", {
      method: "PATCH",
      query: { id: `eq.${id}` },
      body: {
        nome,
        apartamento,
        telefone,
        email,
        torre_id: torreId,
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
    await supabaseRest<null>("moradores_v2", {
      method: "DELETE",
      query: { id: `eq.${id}` },
      prefer: "return=minimal",
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Não foi possível remover este morador." }, { status: 500 });
  }
}
