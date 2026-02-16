import { NextRequest, NextResponse } from "next/server";
// import { ensureApiAuth } from "@/lib/api-auth"; // desativado local
import { supabaseRest } from "@/lib/supabase";

type MoradorV2 = {
  id: string;
  nome: string | null;
  apartamento: string | null;
  torre_id: string | null;
  telefone: string | null;
  email: string | null;
  unidade: string | null;
  created_at?: string;
};

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: NextRequest, ctx: { params: { id: string } }) {
  // const unauthorized = ensureApiAuth(request);
  // if (unauthorized) return unauthorized;

  const id = ctx.params.id;

  try {
    const data = await supabaseRest<MoradorV2[]>("moradores_v2", {
      query: { select: "*", id: `eq.${id}` },
    });

    const found = Array.isArray(data) ? data[0] : null;
    if (!found) return jsonError("Morador não encontrado.", 404);

    return NextResponse.json(found);
  } catch {
    return jsonError("Não foi possível carregar este morador.", 500);
  }
}

export async function PATCH(request: NextRequest, ctx: { params: { id: string } }) {
  // const unauthorized = ensureApiAuth(request);
  // if (unauthorized) return unauthorized;

  const id = ctx.params.id;
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return jsonError("Body inválido.");
  }

  // ✅ somente campos permitidos
  const update: Partial<MoradorV2> = {};
  if ("nome" in body) update.nome = body.nome != null ? String(body.nome) : null;
  if ("apartamento" in body) update.apartamento = body.apartamento != null ? String(body.apartamento) : null;
  if ("torre_id" in body) update.torre_id = body.torre_id != null ? String(body.torre_id) : null;
  if ("telefone" in body) update.telefone = body.telefone != null ? String(body.telefone) : null;
  if ("email" in body) update.email = body.email != null ? String(body.email) : null;
  if ("unidade" in body) update.unidade = body.unidade != null ? String(body.unidade) : null;

  if (Object.keys(update).length === 0) {
    return jsonError("Nenhum campo para atualizar.");
  }

  try {
    const updated = await supabaseRest<MoradorV2[]>("moradores_v2", {
      method: "PATCH",
      id: `eq.${id}`,
      body: update,
    });

    const row = Array.isArray(updated) ? updated[0] : null;
    if (!row) return jsonError("Morador não encontrado.", 404);

    return NextResponse.json(row);
  } catch (err) {
    return jsonError("Não foi possível atualizar este morador.", 500);
  }
}

// ✅ Compat: alguns fronts usam PUT para atualizar tudo
export async function PUT(request: NextRequest, ctx: { params: { id: string } }) {
  // const unauthorized = ensureApiAuth(request);
  // if (unauthorized) return unauthorized;

  const id = ctx.params.id;
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return jsonError("Body inválido.");
  }

  const nome = body?.nome != null ? String(body.nome) : null;
  if (!nome) return jsonError("nome é obrigatório.");

  const payload: Partial<MoradorV2> = {
    nome,
    apartamento: body?.apartamento != null ? String(body.apartamento) : null,
    torre_id: body?.torre_id != null ? String(body.torre_id) : null,
    telefone: body?.telefone != null ? String(body.telefone) : null,
    email: body?.email != null ? String(body.email) : null,
    unidade: body?.unidade != null ? String(body.unidade) : null,
  };

  try {
    const updated = await supabaseRest<MoradorV2[]>("moradores_v2", {
      method: "PATCH",
      id: `eq.${id}`,
      body: payload,
    });

    const row = Array.isArray(updated) ? updated[0] : null;
    if (!row) return jsonError("Morador não encontrado.", 404);

    return NextResponse.json(row);
  } catch {
    return jsonError("Não foi possível atualizar este morador.", 500);
  }
}

export async function DELETE(request: NextRequest, ctx: { params: { id: string } }) {
  // const unauthorized = ensureApiAuth(request);
  // if (unauthorized) return unauthorized;

  const id = ctx.params.id;

  try {
    await supabaseRest<unknown>("moradores_v2", {
      method: "DELETE",
      id: `eq.${id}`,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return jsonError("Não foi possível remover este morador.", 500);
  }
}
