import { NextRequest, NextResponse } from "next/server";
import { ensureApiAuth } from "@/lib/api-auth";
import { supabaseRest } from "@/lib/supabase";
import type { Morador } from "@/lib/types";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = ensureApiAuth(request);
  if (unauthorized) return unauthorized;

  const body = await request.json().catch(() => null);
  const { id } = await params;

  const apto = body?.apto ?? body?.apartamento;
  const torre = body?.torre ?? body?.bloco;

  try {
    const [updated] = await supabaseRest<Morador[]>("moradores", {
      method: "PATCH",
      query: { id: `eq.${id}` },
      body: {
        nome: body?.nome,
        unidade: body?.unidade ?? null,
        apto,
        torre,
        telefone: body?.telefone ?? null,
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
