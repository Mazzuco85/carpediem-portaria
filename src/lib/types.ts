export type Morador = {
  id: string;
  nome: string;
  apartamento: string;
  bloco: string;
  telefone: string | null;
  created_at: string;
};

export type EncomendaStatus = "pendente" | "entregue";

export type Encomenda = {
  id: string;
  morador_id: string;
  descricao: string;
  codigo_rastreio: string | null;
  observacoes: string | null;
  status: EncomendaStatus;
  recebido_em: string;
  entregue_em: string | null;
  created_at: string;
  moradores?: Pick<Morador, "id" | "nome" | "apartamento" | "bloco" | "telefone">;
};
