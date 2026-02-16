import { NextRequest, NextResponse } from "next/server";
import { ensureApiAuth } from "@/lib/api-auth";
import { supabaseRest } from "@/lib/supabase";
import type { MoradorV2 } from "@/lib/types";

export async function GET(request: NextRequest) {
  const unauthorized = ensureApiAuth(request);
  if (unauthorized) return unauthorized;

  try {
    const data = await supabaseRest<MoradorV2[]>("moradores_v2", {
      query: { select: "id,nome,apartamento,telefone,email,torre_id,created_at", order: "created_at.desc" },
    });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Não foi possível carregar moradores agora. Tente novamente." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const unauthorized = ensureApiAuth(request);
  if (unauthorized) return unauthorized;

  const body = await request.json().catch(() => null);
  const nome = body?.nome ? String(body.nome).trim() : "";
  const apartamento = body?.apartamento ? String(body.apartamento).trim() : "";
  const telefone = body?.telefone ? String(body.telefone).trim() : null;
  const email = body?.email ? String(body.email).trim() : null;
  const torreId = body?.torre_id ? String(body.torre_id).trim() : null;

  if (!nome || !apartamento) {
    return NextResponse.json({ error: "nome e apartamento são obrigatórios." }, { status: 400 });
  }

  try {
    const [created] = await supabaseRest<MoradorV2[]>("moradores_v2", {
      method: "POST",
      body: {
        nome,
        apartamento,
        telefone,
        email,
        torre_id: torreId,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Não foi possível cadastrar este morador." }, { status: 500 });
  }
}
