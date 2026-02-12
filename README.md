# Portaria CarpeDiem (Next.js + Supabase)

Sistema de portaria com autenticação administrativa, cadastro de moradores e controle completo de encomendas.

## Stack

- Next.js App Router (em `src/app`)
- APIs internas em Route Handlers (`src/app/api/...`)
- Supabase Postgres via REST (`/rest/v1`)
- Proteção de rotas com `middleware.ts`

## Funcionalidades

- Login via `ADMIN_USER` e `ADMIN_PASS`
- Dashboard protegido
- CRUD de moradores
- CRUD de encomendas
- Fluxo de entrega de encomenda
- Geração de link de WhatsApp para avisar morador

## Configuração

1. Instale dependências:

```bash
npm install
```

2. Crie o `.env.local`:

```bash
cp .env.example .env.local
```

3. Preencha as variáveis (`ADMIN_USER`, `ADMIN_PASS`, `AUTH_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`).

4. Crie as tabelas no Supabase executando o SQL abaixo (`supabase/schema.sql`).

5. Execute o projeto:

```bash
npm run dev
```

## Estrutura principal

- `/login`
- `/dashboard` (protegido)
- `/dashboard/moradores`
- `/dashboard/encomendas`
- `/dashboard/encomendas/new`
- `/dashboard/encomendas/[id]/deliver`
- `/dashboard/encomendas/[id]/whatsapp`

## APIs

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET, POST /api/moradores`
- `PATCH, DELETE /api/moradores/[id]`
- `GET, POST /api/encomendas`
- `GET, PATCH, DELETE /api/encomendas/[id]`
- `POST /api/encomendas/[id]/deliver`
- `POST /api/encomendas/[id]/whatsapp`

## Produção

- Configure variáveis de ambiente na plataforma de deploy.
- Use HTTPS para garantir cookie `secure` em produção.
- Restrinja acesso da `SUPABASE_SERVICE_ROLE_KEY` somente no backend (já aplicado neste projeto).
