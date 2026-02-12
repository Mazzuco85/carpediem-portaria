import { NextRequest, NextResponse } from "next/server";
import { ensureApiAuth } from "@/lib/api-auth";
import { supabaseRest } from "@/lib/supabase";
import type { Morador } from "@/lib/types";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = ensureApiAuth(request);
  if (unauthorized) return unauthorized;

  const body = await request.json().catch(() => null);
  const { id } = await params;

  try {
    const [updated] = await supabaseRest<Morador[]>("moradores", {
      method: "PATCH",
      query: { id: `eq.${id}` },
      body: {
        nome: body?.nome,
        apartamento: body?.apartamento,
        bloco: body?.bloco,
        telefone: body?.telefone ?? null,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
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
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
