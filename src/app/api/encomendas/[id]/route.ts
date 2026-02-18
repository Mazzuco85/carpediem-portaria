import { NextRequest, NextResponse } from "next/server";
import { ensureApiAuth } from "@/lib/api-auth";
import { supabaseRest } from "@/lib/supabase";
import type { Encomenda } from "@/lib/types";

async function insertAuditLog(action: string, encomendaId: string | null, details: Record<string, unknown>) {
  try {
    await supabaseRest("audit_logs", {
      method: "POST",
      body: {
        action,
        encomenda_id: encomendaId,
        details,
      },
    });
  } catch {
    // logging não deve quebrar fluxo principal
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = ensureApiAuth(request);
  if (unauthorized) return unauthorized;

  const { id } = await params;

  try {
    const [data] = await supabaseRest<Encomenda[]>("encomendas_v2", {
      query: {
        select: "*,moradores_v2(id,nome,apartamento,telefone,email,torre_id)",
        id: `eq.${id}`,
      },
    });

    if (!data) {
      return NextResponse.json({ error: "Encomenda não encontrada." }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = ensureApiAuth(request);
  if (unauthorized) return unauthorized;

  const body = await request.json().catch(() => null);
  const { id } = await params;

  try {
    const [updated] = await supabaseRest<Encomenda[]>("encomendas_v2", {
      method: "PATCH",
      query: { id: `eq.${id}` },
      body,
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
    await supabaseRest<null>("encomendas_v2", {
      method: "DELETE",
      query: { id: `eq.${id}` },
      prefer: "return=minimal",
    });

    await insertAuditLog("encomenda_excluida", id, { deleted: true });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
