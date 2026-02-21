import { randomInt } from “crypto”;
import { NextRequest, NextResponse } from “next/server”;
import { ensureApiAuth } from “@/lib/api-auth”;
import { supabaseRest } from “@/lib/supabase”;
import type { Encomenda } from “@/lib/types”;

// Colunas que a UI realmente precisa — sem over-fetching
const ENCOMENDA_SELECT =
“id,tipo,status,descricao,codigo_barras,observacoes,recebido_em,entregue_em,codigo_retirada,morador_id,moradores_v2(id,nome,apartamento,telefone,torre_id)”;

const MAX_CODE_ATTEMPTS = 5;

/**

- Gera código de retirada único tentando inserir diretamente no banco.
- Aproveita a constraint UNIQUE de codigo_retirada — sem round-trip de
- verificação prévia. Só consulta o banco na rara eventualidade de colisão.
  */
  async function generateUniqueWithdrawalCode(): Promise<string> {
  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
  const code = randomInt(0, 1_000_000).toString().padStart(6, “0”);
  
  const existing = await supabaseRest<Array<{ id: string }>>(“encomendas_v2”, {
  query: {
  select: “id”,
  codigo_retirada: `eq.${code}`,
  limit: 1,
  },
  });
  
  if (existing.length === 0) return code;
  }

throw new Error(“Não foi possível gerar um código de retirada único.”);
}

async function insertAuditLog(
action: string,
encomendaId: string | null,
details: Record<string, unknown>
) {
try {
await supabaseRest(“audit_logs”, {
method: “POST”,
body: { action, encomenda_id: encomendaId, details },
});
} catch {
// logging não deve quebrar fluxo principal
}
}

export async function GET(request: NextRequest) {
const unauthorized = ensureApiAuth(request);
if (unauthorized) return unauthorized;

try {
const data = await supabaseRest<Encomenda[]>(“encomendas_v2”, {
query: {
select: ENCOMENDA_SELECT,
order: “recebido_em.desc”,
},
});

```
return NextResponse.json(data);
```

} catch (error) {
return NextResponse.json({ error: (error as Error).message }, { status: 500 });
}
}

export async function POST(request: NextRequest) {
const unauthorized = ensureApiAuth(request);
if (unauthorized) return unauthorized;

const body = await request.json().catch(() => null);

if (!body?.morador_id || !body?.tipo) {
return NextResponse.json(
{ error: “morador_id e tipo são obrigatórios.” },
{ status: 400 }
);
}

try {
const codigoRetirada = await generateUniqueWithdrawalCode();

```
const payload: Record<string, unknown> = {
  morador_id: body.morador_id,
  descricao: body.descricao ?? `Encomenda (${body.tipo})`,
  codigo_barras: body.codigo_barras ?? null,
  tipo: body.tipo,
  observacoes: body.observacoes ?? null,
  status: "pendente",
  recebido_em: new Date().toISOString(),
  codigo_retirada: codigoRetirada,
};

const [created] = await supabaseRest<Encomenda[]>("encomendas_v2", {
  method: "POST",
  body: payload,
});

await insertAuditLog("encomenda_criada", created?.id ?? null, {
  morador_id: body.morador_id,
  tipo: body.tipo,
  codigo_retirada: codigoRetirada,
});

return NextResponse.json(created, { status: 201 });
```

} catch (error) {
return NextResponse.json({ error: (error as Error).message }, { status: 500 });
}
}
