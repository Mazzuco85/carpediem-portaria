import { NextRequest, NextResponse } from "next/server";
import { ensureApiAuth } from "@/lib/api-auth";
import { supabaseRest } from "@/lib/supabase";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }, // <- importante p/ Vercel/Next types
) {
  const unauthorized = ensureApiAuth(request);
  if (unauthorized) return unauthorized;

  const { id } = await context.params; // <- importante

  const body = await request.json().catch(() => null);

  const entregue_por = body?.entregue_por ? String(body.entregue_por).trim() : "";
  const observacoes_entrega = body?.observacoes_entrega ? String(body.observacoes_entrega).trim() : null;

  if (!entregue_por) {
    return NextResponse.json({ error: "Informe quem retirou (entregue_por)." }, { status: 400 });
  }

  try {
    const [updated] = await supabaseRest<any[]>("encomendas_v2", {
      method: "PATCH",
      query: { id: `eq.${id}` },
      body: {
        status: "entregue",
        entregue_em: new Date().toISOString(),
        entregue_por,
        observacoes_entrega: observacoes_entrega || null,
      },
    });

    return NextResponse.json(updated ?? { ok: true });
  } catch {
    return NextResponse.json({ error: "Não foi possível confirmar entrega." }, { status: 500 });
  }
}
