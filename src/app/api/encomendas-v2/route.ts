import { randomInt } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { ensureApiAuth } from "@/lib/api-auth";
import { supabaseRest } from "@/lib/supabase";
import type { Encomenda } from "@/lib/types";

const MAX_CODE_ATTEMPTS = 10;

async function generateUniqueWithdrawalCode(): Promise<string> {
  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt += 1) {
    const codigoRetirada = randomInt(0, 1_000_000).toString().padStart(6, "0");

    const existing = await supabaseRest<Array<{ id: string }>>("encomendas_v2", {
      query: {
        select: "id",
        codigo_retirada: `eq.${codigoRetirada}`,
        limit: 1,
      },
    });

    if (existing.length === 0) {
      return codigoRetirada;
    }
  }

  throw new Error("Não foi possível gerar um código de retirada único.");
}

export async function GET(request: NextRequest) {
  const unauthorized = ensureApiAuth(request);
  if (unauthorized) return unauthorized;

  try {
    const data = await supabaseRest<Encomenda[]>("encomendas_v2", {
      query: {
        select: "*,moradores_v2(id,nome,unidade,apto,torre,telefone)",
        order: "recebido_em.desc",
      },
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const unauthorized = ensureApiAuth(request);
  if (unauthorized) return unauthorized;

  const body = await request.json().catch(() => null);

  if (!body?.descricao || (!body?.morador_id && !body?.unidade)) {
    return NextResponse.json({ error: "descricao e morador_id (ou unidade) são obrigatórios." }, { status: 400 });
  }

  try {
    const codigoRetirada = await generateUniqueWithdrawalCode();

    const payload: Record<string, unknown> = {
      descricao: body.descricao,
      codigo_rastreio: body.codigo_rastreio ?? null,
      observacoes: body.observacoes ?? null,
      status: "pendente",
      recebido_em: new Date().toISOString(),
      codigo_retirada: codigoRetirada,
    };

    if (body.morador_id) {
      payload.morador_id = body.morador_id;
    }

    if (body.unidade) {
      payload.unidade = body.unidade;
    }

    const [created] = await supabaseRest<Encomenda[]>("encomendas_v2", {
      method: "POST",
      body: payload,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
