import { NextRequest, NextResponse } from "next/server";
import { ensureApiAuth } from "@/lib/api-auth";
import { supabaseRest } from "@/lib/supabase";
import type { Encomenda } from "@/lib/types";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = ensureApiAuth(request);
  if (unauthorized) return unauthorized;

  const { id } = await params;

  try {
    const [encomenda] = await supabaseRest<Encomenda[]>("encomendas", {
      query: {
        select: "*,moradores(id,nome,unidade,apto,torre,telefone)",
        id: `eq.${id}`,
      },
    });

    if (!encomenda || !encomenda.moradores?.telefone) {
      return NextResponse.json({ error: "Telefone do morador não encontrado." }, { status: 400 });
    }

    const phone = encomenda.moradores.telefone.replace(/\D/g, "");
    const unidadeLabel = encomenda.moradores.unidade ? `${encomenda.moradores.unidade} · ` : "";
    const message = `Olá ${encomenda.moradores.nome}, sua encomenda (${encomenda.descricao}) chegou na portaria. Apartamento ${unidadeLabel}${encomenda.moradores.apto}/${encomenda.moradores.torre}.`;

    return NextResponse.json({
      link: `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
      phone,
      message,
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
