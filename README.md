# Rastaflix

Site da comunidade do Ovelhera: histórias, músicas, esculachos, lista de inimigos, clipes, bingo, Ovelhera DLE e o Rasta Awards.

Produção: https://rastaflix.vercel.app

## Stack

- [Next.js](https://nextjs.org) (App Router) + React 19 + TypeScript
- [Supabase](https://supabase.com) (Postgres) para os dados
- [Clerk](https://clerk.com) para login
- Tailwind CSS v4, shadcn/ui, Motion
- TanStack Query, React Hook Form + Zod

## Rodando localmente

Pré-requisitos: Node 20+, npm e [Docker](https://www.docker.com/) (para o Supabase local).

```bash
git clone https://github.com/<seu-usuario>/rastaflix.git
cd rastaflix
npm install
cp .env.example .env.local
```

### 1. Banco (Supabase local)

```bash
npx supabase start
```

O comando imprime `API URL`, `anon key` e `service_role key`. Coloque esses valores em `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` no `.env.local`.

> **Limitação conhecida:** as tabelas mais antigas (`historias`, `musicas`, `esculachos`, `inimigos`, `award_*`) foram criadas antes de o projeto usar migrations, então `supabase/migrations/` ainda não recria o banco do zero. Enquanto isso não for resolvido, abra uma issue se precisar mexer nessas tabelas.

### 2. Login (Clerk)

Crie uma aplicação grátis em https://dashboard.clerk.com e copie `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` e `CLERK_SECRET_KEY` (da instância de desenvolvimento) para o `.env.local`.

Para acessar o `/admin` localmente, faça login uma vez e, no dashboard do Clerk, edite o seu usuário e coloque em **Private metadata**:

```json
{ "is_admin": true }
```

### 3. Subir o app

```bash
npm run dev
```

Abra http://localhost:3000.

As variáveis opcionais (Twitch, Kick, PostHog, Google AI) só ligam o indicador de live, o analytics e o text-to-speech. O resto do site funciona sem elas.

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run typecheck` | Checagem de tipos |
| `npm run db:new <nome>` | Cria uma nova migration |

Os scripts `db:link`, `db:status` e `db:push` apontam para o banco de produção e só funcionam para o mantenedor.

## Estrutura

```
src/
  app/          rotas (páginas públicas e /admin)
  actions/      Server Actions (toda escrita no banco passa por aqui)
  components/   componentes React
  lib/          queries, tipos/schemas Zod, auth, helpers
supabase/
  migrations/   migrations SQL
```

Mais detalhes de arquitetura e convenções em [CLAUDE.md](CLAUDE.md).

## Contribuindo

Leia o [CONTRIBUTING.md](CONTRIBUTING.md). Resumo: faça um fork, crie um branch, abra um PR para `master`.
