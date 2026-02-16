alter table if exists public.encomendas_v2
  add column if not exists descricao text,
  add column if not exists observacoes text;
