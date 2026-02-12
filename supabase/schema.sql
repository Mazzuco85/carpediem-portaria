create extension if not exists "pgcrypto";

create table if not exists public.moradores (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  apartamento text not null,
  bloco text not null,
  telefone text,
  created_at timestamptz not null default now()
);

create table if not exists public.encomendas (
  id uuid primary key default gen_random_uuid(),
  morador_id uuid not null references public.moradores(id) on delete cascade,
  descricao text not null,
  codigo_rastreio text,
  observacoes text,
  status text not null default 'pendente' check (status in ('pendente', 'entregue')),
  recebido_em timestamptz not null default now(),
  entregue_em timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_encomendas_status on public.encomendas(status);
create index if not exists idx_encomendas_morador_id on public.encomendas(morador_id);
