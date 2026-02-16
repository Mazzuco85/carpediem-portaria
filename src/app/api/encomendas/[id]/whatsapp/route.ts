import { NextRequest, NextResponse } from "next/server";
import { ensureApiAuth } from "@/lib/api-auth";
import { supabaseRest } from "@/lib/supabase";
import type { Encomenda } from "@/lib/types";

function normalizePhone(rawPhone: string) {
  const onlyDigits = rawPhone.replace(/\D/g, "");

  if (!onlyDigits) {
    return "";
  }

  if (onlyDigits.startsWith("55")) {
    return onlyDigits;
  }

  return `55${onlyDigits}`;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = ensureApiAuth(request);
  if (unauthorized) return unauthorized;

  const { id } = await params;

  try {
    const [encomenda] = await supabaseRest<Encomenda[]>("encomendas_v2", {
      query: {
        select: "*,moradores_v2(id,nome,apartamento,telefone,email,torre_id)",
        id: `eq.${id}`,
      },
    });

    const morador = encomenda?.moradores_v2;

    if (!morador?.telefone) {
      return NextResponse.json({ error: "Telefone do morador não encontrado." }, { status: 400 });
    }

    const phone = normalizePhone(morador.telefone);
    const descricao = encomenda.descricao ?? encomenda.tipo ?? "encomenda";
    const message = `Olá ${morador.nome}, sua encomenda (${descricao}) chegou na portaria. Apartamento ${morador.apartamento}.`;

    return NextResponse.json({
      link: `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
      phone,
      message,
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
