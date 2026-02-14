alter table if exists public.encomendas_v2 enable row level security;
alter table if exists public.moradores_v2 enable row level security;
alter table if exists public.torres enable row level security;

alter table if exists public.encomendas_v2
  add column if not exists codigo_retirada text;

create unique index if not exists encomendas_v2_codigo_retirada_key
  on public.encomendas_v2 (codigo_retirada)
  where codigo_retirada is not null;

drop policy if exists encomendas_v2_authenticated_select on public.encomendas_v2;
drop policy if exists encomendas_v2_authenticated_insert on public.encomendas_v2;
drop policy if exists encomendas_v2_authenticated_update on public.encomendas_v2;
drop policy if exists encomendas_v2_authenticated_delete on public.encomendas_v2;

create policy encomendas_v2_authenticated_select
  on public.encomendas_v2
  for select
  to authenticated
  using (true);

create policy encomendas_v2_authenticated_insert
  on public.encomendas_v2
  for insert
  to authenticated
  with check (true);

create policy encomendas_v2_authenticated_update
  on public.encomendas_v2
  for update
  to authenticated
  using (true)
  with check (true);

create policy encomendas_v2_authenticated_delete
  on public.encomendas_v2
  for delete
  to authenticated
  using (true);

drop policy if exists moradores_v2_authenticated_select on public.moradores_v2;
drop policy if exists moradores_v2_authenticated_insert on public.moradores_v2;
drop policy if exists moradores_v2_authenticated_update on public.moradores_v2;
drop policy if exists moradores_v2_authenticated_delete on public.moradores_v2;

create policy moradores_v2_authenticated_select
  on public.moradores_v2
  for select
  to authenticated
  using (true);

create policy moradores_v2_authenticated_insert
  on public.moradores_v2
  for insert
  to authenticated
  with check (true);

create policy moradores_v2_authenticated_update
  on public.moradores_v2
  for update
  to authenticated
  using (true)
  with check (true);

create policy moradores_v2_authenticated_delete
  on public.moradores_v2
  for delete
  to authenticated
  using (true);

drop policy if exists torres_authenticated_select on public.torres;
drop policy if exists torres_authenticated_insert on public.torres;
drop policy if exists torres_authenticated_update on public.torres;
drop policy if exists torres_authenticated_delete on public.torres;

create policy torres_authenticated_select
  on public.torres
  for select
  to authenticated
  using (true);

create policy torres_authenticated_insert
  on public.torres
  for insert
  to authenticated
  with check (true);

create policy torres_authenticated_update
  on public.torres
  for update
  to authenticated
  using (true)
  with check (true);

create policy torres_authenticated_delete
  on public.torres
  for delete
  to authenticated
  using (true);
