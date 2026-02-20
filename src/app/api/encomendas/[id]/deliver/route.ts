import { NextRequest, NextResponse } from "next/server";
import { ensureApiAuth } from "@/lib/api-auth";
import { supabaseRest } from "@/lib/supabase";

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

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const unauthorized = ensureApiAuth(request);
  if (unauthorized) return unauthorized;

  const { id: routeId } = await context.params;
  const id = routeId.trim();

  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(id)) {
    return NextResponse.json({ error: "ID da encomenda inválido. Informe um UUID válido." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);

  const entregue_por = body?.entregue_por ? String(body.entregue_por).trim() : "";
  const observacoes_entrega = body?.observacoes_entrega ? String(body.observacoes_entrega).trim() : null;

  if (!entregue_por) {
    return NextResponse.json({ error: "Informe quem retirou (entregue_por)." }, { status: 400 });
  }

  try {
    const [updated] = await supabaseRest<unknown[]>("encomendas_v2", {
      method: "PATCH",
      query: { id: `eq.${id}` },
      body: {
        status: "entregue",
        entregue_em: new Date().toISOString(),
        entregue_por,
        observacoes_entrega: observacoes_entrega || null,
      },
    });

    await insertAuditLog("encomenda_entregue", id, {
      entregue_por,
      observacoes_entrega: observacoes_entrega || null,
    });

    return NextResponse.json(updated ?? { ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível confirmar entrega.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
