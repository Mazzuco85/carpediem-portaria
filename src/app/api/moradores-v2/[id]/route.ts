import { NextRequest, NextResponse } from "next/server";
import { ensureApiAuth } from "@/lib/api-auth";
import { supabaseRest } from "@/lib/supabase";
import type { MoradorV2 } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Ctx) {
  const unauthorized = ensureApiAuth(request);
  if (unauthorized) return unauthorized;

  const { id } = await params;

  try {
    const data = await supabaseRest<MoradorV2[]>("moradores_v2", {
      query: { select: "*", id: `eq.${id}`, limit: "1" },
    });

    const morador = Array.isArray(data) ? data[0] : null;

    if (!morador) {
      return NextResponse.json({ error: "Morador não encontrado." }, { status: 404 });
    }

    return NextResponse.json(morador);
  } catch {
    return NextResponse.json({ error: "Não foi possível carregar este morador." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const unauthorized = ensureApiAuth(request);
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const body = await request.json().catch(() => null);

  const payload: Partial<MoradorV2> = {
    nome: body?.nome ?? undefined,
    apartamento: body?.apartamento ?? undefined,
    telefone: body?.telefone ?? undefined,
    email: body?.email ?? undefined,
    torre_id: body?.torre_id ?? undefined,
    unidade: body?.unidade ?? undefined,
  };

  try {
    const updated = await supabaseRest<MoradorV2[]>("moradores_v2", {
      method: "PATCH",
      query: { id: `eq.${id}` },
      body: payload,
    });

    return NextResponse.json(Array.isArray(updated) ? updated[0] : updated);
  } catch {
    return NextResponse.json({ error: "Não foi possível atualizar este morador." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  const unauthorized = ensureApiAuth(request);
  if (unauthorized) return unauthorized;

  const { id } = await params;

  try {
    await supabaseRest("moradores_v2", {
      method: "DELETE",
      query: { id: `eq.${id}` },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Não foi possível remover este morador." }, { status: 500 });
  }
}
