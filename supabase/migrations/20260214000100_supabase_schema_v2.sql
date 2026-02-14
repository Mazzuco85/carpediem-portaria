-- Schema v2: torres, moradores_v2, encomendas_v2, logs_encomendas

-- 1) Tabela public.torres
create table if not exists public.torres (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nome text,
  created_at timestamptz default now()
);

-- 2) Enum public.status_encomenda
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'status_encomenda'
      AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.status_encomenda AS ENUM ('pendente', 'entregue');
  END IF;
END
$$;

-- 3) Tabela public.moradores_v2
create table if not exists public.moradores_v2 (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  apartamento text not null,
  torre_id uuid references public.torres(id),
  telefone text,
  email text,
  created_at timestamptz default now()
);

-- 4) Tabela public.encomendas_v2
create table if not exists public.encomendas_v2 (
  id uuid primary key default gen_random_uuid(),
  codigo_barras text,
  codigo_retirada char(6) not null,
  tipo text,
  status public.status_encomenda default 'pendente',
  morador_id uuid references public.moradores_v2(id),
  torre_id uuid references public.torres(id),
  recebido_por uuid references auth.users(id),
  entregue_por uuid references auth.users(id),
  recebido_em timestamptz default now(),
  entregue_em timestamptz,
  created_at timestamptz default now()
);

-- 5) Tabela public.logs_encomendas
create table if not exists public.logs_encomendas (
  id uuid primary key default gen_random_uuid(),
  encomenda_id uuid references public.encomendas_v2(id) on delete cascade,
  acao text not null,
  usuario_id uuid references auth.users(id),
  created_at timestamptz default now()
);

-- Índices
create index if not exists idx_encomendas_v2_status on public.encomendas_v2(status);
create index if not exists idx_encomendas_v2_torre_id on public.encomendas_v2(torre_id);
create index if not exists idx_encomendas_v2_morador_id on public.encomendas_v2(morador_id);
create index if not exists idx_logs_encomendas_usuario_id on public.logs_encomendas(usuario_id);
create index if not exists idx_logs_encomendas_created_at on public.logs_encomendas(created_at);
