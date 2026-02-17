import { NextRequest, NextResponse } from "next/server";
import { ensureApiAuth } from "@/lib/api-auth";
import { supabaseRest } from "@/lib/supabase";
import type { MoradorV2 } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, ctx: Ctx) {
  const unauthorized = ensureApiAuth(request);
  if (unauthorized) return unauthorized;

  const { id } = await ctx.params;

  try {
    const data = await supabaseRest<MoradorV2[]>("moradores_v2", {
      query: { select: "*", id: `eq.${id}` },
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

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const unauthorized = ensureApiAuth(request);
  if (unauthorized) return unauthorized;

  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  // Atualize apenas campos permitidos:
  const update: Partial<MoradorV2> = {
    nome: body.nome ?? undefined,
    apartamento: body.apartamento ?? undefined,
    telefone: body.telefone ?? undefined,
    email: body.email ?? undefined,
    torre_id: body.torre_id ?? undefined,
    unidade: body.unidade ?? undefined,
  };

  // remove undefined pra não sobrescrever sem querer
  Object.keys(update).forEach((k) => {
    const key = k as keyof typeof update;
    if (update[key] === undefined) delete update[key];
  });

  try {
    const data = await supabaseRest<MoradorV2[]>("moradores_v2", {
      method: "PATCH",
      query: { id: `eq.${id}`, select: "*" },
      body: update,
    });

    const morador = Array.isArray(data) ? data[0] : null;
    if (!morador) {
      return NextResponse.json({ error: "Morador não encontrado." }, { status: 404 });
    }

    return NextResponse.json(morador);
  } catch {
    return NextResponse.json({ error: "Não foi possível salvar este morador." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  const unauthorized = ensureApiAuth(request);
  if (unauthorized) return unauthorized;

  const { id } = await ctx.params;

  try {
    await supabaseRest("moradores_v2", {
      method: "DELETE",
      query: { id: `eq.${id}` },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Não foi possível excluir este morador." }, { status: 500 });
  }
}
