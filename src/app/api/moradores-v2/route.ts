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

export async function GET(request: NextRequest) {
  // ✅ Auth desativado no localhost (se quiser reativar depois, descomente as 2 linhas abaixo)
  // const unauthorized = ensureApiAuth(request);
  // if (unauthorized) return unauthorized;

  try {
    const data = await supabaseRest<MoradorV2[]>("moradores_v2", {
      query: { select: "*", order: "created_at.desc" },
    });

    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch (err) {
    return NextResponse.json(
      { error: "Não foi possível carregar moradores agora. Tente novamente." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  // ✅ Auth desativado no localhost
  // const unauthorized = ensureApiAuth(request);
  // if (unauthorized) return unauthorized;

  const body = await request.json().catch(() => null);

  const nome = body?.nome != null ? String(body.nome) : null;
  const apartamento = body?.apartamento != null ? String(body.apartamento) : null;
  const torre_id = body?.torre_id != null ? String(body.torre_id) : null;

  const telefone = body?.telefone != null ? String(body.telefone) : null;
  const email = body?.email != null ? String(body.email) : null;

  // unidade pode ser opcional (ou você pode calcular no front)
  const unidade = body?.unidade != null ? String(body.unidade) : null;

  if (!nome) {
    return NextResponse.json({ error: "nome é obrigatório." }, { status: 400 });
  }

  try {
    const created = await supabaseRest<MoradorV2[]>("moradores_v2", {
      method: "POST",
      body: {
        nome,
        apartamento,
        torre_id,
        telefone,
        email,
        unidade,
      },
    });

    return NextResponse.json(created?.[0] ?? null, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "Não foi possível cadastrar este morador." },
      { status: 500 },
    );
  }
}
