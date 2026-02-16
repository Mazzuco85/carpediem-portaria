export type Morador = {
  id: string;
  nome: string;
  unidade: string | null;
  apto: string;
  torre: string;
  telefone: string | null;
  created_at: string;
};

export type MoradorV2 = {
  id: string;
  nome: string;
  apartamento: string;
  telefone: string | null;
  email: string | null;
  torre_id: string | null;
  display?: string;
  unidade?: string;
  created_at?: string;
  torres?: {
    codigo: string;
  } | null;
};

export type EncomendaStatus = "pendente" | "entregue";

export type Encomenda = {
  id: string;
  morador_id: string;
  unidade?: string | null;
  descricao: string;
  codigo_rastreio: string | null;
  codigo_barras?: string | null;
  tipo?: string | null;
  codigo_retirada?: string | null;
  observacoes: string | null;
  status: EncomendaStatus;
  recebido_em: string;
  entregue_em: string | null;
  created_at: string;
  moradores?: Pick<Morador, "id" | "nome" | "unidade" | "apto" | "torre" | "telefone">;
  moradores_v2?: Pick<MoradorV2, "id" | "nome" | "apartamento" | "telefone" | "email" | "torre_id">;
};
