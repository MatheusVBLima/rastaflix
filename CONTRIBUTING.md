# Contribuindo com o Rastaflix

Valeu por querer ajudar! O fluxo é o padrão do GitHub: **fork → branch → pull request**. Você não precisa ser colaborador do repositório.

## Passo a passo

1. Faça um **fork** do repositório (botão "Fork" no GitHub).
2. Clone o seu fork e configure o ambiente seguindo o [README](README.md#rodando-localmente).
3. Crie um branch a partir do `master`:
   ```bash
   git checkout -b feat/minha-feature
   ```
4. Faça as mudanças e confira se está tudo ok:
   ```bash
   npm run typecheck
   npm run build
   ```
5. Commit seguindo [Conventional Commits](https://www.conventionalcommits.org/):
   `feat: ...`, `fix: ...`, `chore: ...`, `refactor: ...`, `docs: ...`
6. Abra um **pull request** do seu branch para o `master` deste repositório e descreva o que mudou (prints ajudam muito em mudanças visuais).

Só o mantenedor faz merge e pode pedir ajustes antes.

## Antes de começar algo grande

Abra uma **issue** primeiro para combinar a ideia. Assim ninguém perde tempo com algo que não vai entrar.

## Regras do projeto

- **Nunca commite segredos.** Chaves vão no `.env.local`, que é ignorado pelo git. Se adicionar uma variável nova, coloque ela (sem valor) no [.env.example](.env.example).
- **Toda escrita no banco passa por Server Action** (`src/actions/`) e precisa autorizar antes: `ensureAdmin()` para conteúdo, `auth()` do Clerk para dados do próprio usuário. O RLS do Supabase só libera leitura pública.
- **Mudança de schema = nova migration** em `supabase/migrations/` (`npm run db:new <nome>`). Não edite migrations antigas.
- Valide formulários com Zod (`src/lib/types.ts`).
- Server Components por padrão; `"use client"` só quando precisar.

As convenções completas estão em [CLAUDE.md](CLAUDE.md).

## Achou uma falha de segurança?

Não abra issue pública. Veja o [SECURITY.md](SECURITY.md).
