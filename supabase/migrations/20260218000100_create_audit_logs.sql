create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  action text not null,
  encomenda_id uuid,
  details jsonb
);
