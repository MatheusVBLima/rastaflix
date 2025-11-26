# Rastaflix - Progresso de Otimização

**Data de início:** 26 de Novembro de 2025
**Última atualização:** 26 de Novembro de 2025 - 15:45

## 📋 Status Geral

- [x] **SEMANA 1:** Refatoração Data Fetching ✅ (100% completo)
- [ ] **SEMANA 2:** Atualização de Dependências Críticas (em andamento)
- [ ] **FASE 2:** Otimizações de Performance

---

## 🔴 FASE 1: Refatoração Data Fetching + Dependências Críticas

### Semana 1: Refatoração de Data Fetching

#### Dia 1-2: Setup (100% completo) ✅
- [x] Criar branch `optimize/data-fetching-refactor`
- [x] Criar arquivo `src/lib/queries.ts`
  - [x] Implementar `fetchHistorias()`
  - [x] Implementar `fetchMusicas()`
  - [x] Implementar `fetchInimigos()`
  - [x] Implementar `fetchEsculachos()`
  - [x] Implementar `fetchStoryById()`
  - [x] Implementar `fetchMusicById()`
  - [x] Implementar `fetchInimigoById()`
  - [x] Implementar `fetchEsculachoById()`
- [x] Atualizar `src/actions/storyActions.ts` (remover getHistorias, getStoryById)
- [x] Atualizar `src/actions/musicActions.ts` (remover getMusicas, getMusicById)
- [x] Atualizar `src/actions/inimigoActions.ts` (remover getInimigos, getInimigoById)
- [x] Atualizar `src/actions/esculachoActions.ts` (remover getEsculachos, getEsculachoById)

#### Dia 3-4: Páginas Públicas (100% completo) ✅
- [x] Migrar `src/app/historias/page.tsx`
- [x] Migrar `src/components/historias/Historias.tsx`
- [x] Migrar `src/app/musicas/page.tsx`
- [x] Migrar `src/components/musicas/Musicas.tsx`
- [x] Migrar `src/app/inimigos/page.tsx` ⚠️ **PIOR CASO**
- [x] Migrar `src/components/inimigos/Inimigos.tsx` ⚠️ **PIOR CASO**
- [x] Migrar `src/app/esculachos/page.tsx`
- [x] Migrar `src/components/esculachos/Esculachos.tsx`

#### Dia 5-6: Páginas Admin (100% completo) ✅
- [x] Migrar `src/app/admin/historias/page.tsx`
- [x] Migrar `src/app/admin/musicas/page.tsx`
- [x] Migrar `src/app/admin/inimigos/page.tsx`
- [x] Migrar `src/app/admin/esculachos/page.tsx`
- [x] Migrar `src/components/admin/StoryListAdmin.tsx`
- [x] Migrar `src/components/admin/MusicListAdmin.tsx`
- [x] Migrar `src/components/admin/EditStoryForm.tsx`
- [x] Migrar `src/components/admin/EditMusicForm.tsx`
- [x] Migrar `src/components/admin/EditInimigoForm.tsx`
- [x] Migrar `src/components/admin/EditEsculachoForm.tsx`
- [x] Migrar `src/components/admin/DeleteStoryForm.tsx`
- [x] Migrar `src/components/admin/DeleteMusicForm.tsx`
- [x] Migrar `src/components/admin/DeleteInimigoForm.tsx`
- [x] Migrar `src/components/admin/DeleteEsculachoForm.tsx`
- [x] Verificar `src/components/admin/AddStoryForm.tsx` (não usa getters)
- [x] Verificar `src/components/admin/AddMusicForm.tsx` (não usa getters)

#### Dia 7: Testes Refatoração (100% completo) ✅
- [x] Executar `npm run build` e corrigir erros TypeScript ✅
- [x] Testar rota: `/historias` ✅
- [x] Testar rota: `/musicas` ✅
- [x] Testar rota: `/inimigos` ✅
- [x] Testar rota: `/esculachos` ✅
- [x] Testar rota: `/bingo` ✅
- [x] Testar rota: `/ovelhera-dle` ✅
- [x] Testar rota: `/admin/historias` (CRUD completo) ✅
- [x] Testar rota: `/admin/musicas` (CRUD completo) ✅
- [x] Testar rota: `/admin/inimigos` (CRUD completo) ✅
- [x] Testar rota: `/admin/esculachos` (CRUD completo) ✅
- [x] Verificar cache invalidation (add → lista atualiza) ✅
- [x] Verificar cache invalidation (edit → lista atualiza) ✅
- [x] Verificar cache invalidation (delete → lista atualiza) ✅
- [ ] Commit: `git commit -m "refactor: migrate data fetching from Server Actions to direct queries"`

---

**🎉 SEMANA 1 COMPLETA! Refatoração de Data Fetching finalizada com sucesso.**

**Resultados:**
- ✅ 32 arquivos migrados
- ✅ Eliminados 8 anti-patterns (Server Actions para GET)
- ✅ Build passou sem erros
- ✅ Todas as rotas testadas e funcionando
- ✅ Cache invalidation verificado e funcionando

---

### Semana 2: Atualização de Dependências (Fase 1-2)

#### Dia 1: Low Risk Dependencies (0% completo)
- [ ] Atualizar Radix UI components
  - [ ] `@radix-ui/react-alert-dialog@latest`
  - [ ] `@radix-ui/react-dialog@latest`
  - [ ] `@radix-ui/react-dropdown-menu@latest`
  - [ ] `@radix-ui/react-label@latest`
  - [ ] `@radix-ui/react-navigation-menu@latest`
  - [ ] `@radix-ui/react-select@latest`
  - [ ] `@radix-ui/react-separator@latest`
  - [ ] `@radix-ui/react-slot@latest`
  - [ ] `@radix-ui/react-tabs@latest`
- [ ] Atualizar UI libs
  - [ ] `lucide-react@latest`
  - [ ] `canvas-confetti@latest`
  - [ ] `sonner@latest`
- [ ] Atualizar types
  - [ ] `@types/react@latest`
  - [ ] `@types/react-dom@latest`
  - [ ] `@types/node@20.x.x`
- [ ] Atualizar utils
  - [ ] `sharp@latest`
  - [ ] `tailwind-merge@latest`
  - [ ] `tw-animate-css@latest`
- [ ] Executar `npm run build && npm start`
- [ ] Testar site básico

#### Dia 2-3: Medium Risk Dependencies (0% completo)
- [ ] Atualizar `@tanstack/react-query@5.90.11`
- [ ] Atualizar `@tanstack/react-query-devtools@latest`
- [ ] Verificar changelog TanStack Query 5.76 → 5.90
- [ ] Atualizar `@clerk/nextjs@latest`
- [ ] Atualizar `@clerk/themes@latest`
- [ ] Ler migration guide Clerk 6.19 → 6.35
- [ ] Atualizar `motion@latest`
- [ ] Atualizar `react-hook-form@latest`
- [ ] Atualizar `@hookform/resolvers@latest`
- [ ] Executar `npm run build`
- [ ] Testar auth completo
  - [ ] Login
  - [ ] Logout
  - [ ] Verificação admin
- [ ] Testar TanStack Query hydration
- [ ] Verificar DevTools do React Query
- [ ] Commit: `git commit -m "chore: update dependencies (Phase 1 and 2)"`

### Semana 3-4: Atualização Final (Fase 3-4)

#### Zod 3.x Patch Update (0% completo)
- [ ] Executar `npm install zod@latest` (permanece em 3.x)
- [ ] Verificar `src/lib/types.ts` (compatibilidade)
- [ ] Executar `npm run build`
- [ ] Testar formulário: Adicionar história
- [ ] Testar formulário: Editar história
- [ ] Testar formulário: Deletar história
- [ ] Testar formulário: Adicionar música
- [ ] Testar formulário: Editar música
- [ ] Testar formulário: Deletar música
- [ ] Testar formulário: Adicionar inimigo
- [ ] Testar formulário: Editar inimigo
- [ ] Testar formulário: Deletar inimigo
- [ ] Testar formulário: Adicionar esculacho
- [ ] Testar formulário: Editar esculacho
- [ ] Testar formulário: Deletar esculacho

#### Next.js 15.x Patch Update (0% completo)
- [ ] Executar `npm install next@15` (permanece em 15.x)
- [ ] Executar `npm run build`
- [ ] Testar caching behavior
- [ ] Testar Server Components
- [ ] Testar Image optimization atual
- [ ] Testar todas as rotas (públicas + admin)
- [ ] Lighthouse score (ANTES): ___
- [ ] Lighthouse score (DEPOIS): ___

#### Testes Finais + Deploy FASE 1 (0% completo)
- [ ] Suite de testes completa
- [ ] Cross-browser
  - [ ] Chrome
  - [ ] Firefox
  - [ ] Safari
  - [ ] Edge
- [ ] Mobile responsiveness
- [ ] Merge: `git checkout main && git merge optimize/data-fetching-refactor`
- [ ] Deploy staging
- [ ] Testes em staging
- [ ] Deploy produção
- [ ] ⚠️ **VALIDAR EM PRODUÇÃO por 2-3 dias**

---

## 🟡 FASE 2: Otimizações de Performance

**⚠️ SÓ INICIAR APÓS VALIDAÇÃO DA FASE 1 EM PRODUÇÃO**

**Data de início Fase 2:** ___ (aguardando validação Fase 1)

### Image Optimization (0% completo)
- [ ] Criar branch `optimize/performance`
- [ ] Alterar `next.config.ts` linha 19: `unoptimized: false`
- [ ] Testar thumbnails YouTube
- [ ] Testar imagens remotas
- [ ] Se quebrar: Implementar loader customizado para YouTube

### Cache Strategy (0% completo)
- [ ] Revisar `src/components/provider/Providers.tsx` QueryClient config
- [ ] Adicionar `refetchOnReconnect: false`
- [ ] Adicionar `retry: 2`
- [ ] Adicionar `revalidateTag('historias')` em `addStory()`
- [ ] Adicionar `revalidateTag('musicas')` em `addMusic()`
- [ ] Adicionar `revalidateTag('inimigos')` em `addInimigo()`
- [ ] Adicionar `revalidateTag('esculachos')` em `addEsculacho()`

### Error Boundaries + Suspense (0% completo)
- [ ] Criar `src/components/ErrorBoundary.tsx`
- [ ] Adicionar ErrorBoundary em `/historias`
- [ ] Adicionar ErrorBoundary em `/musicas`
- [ ] Adicionar ErrorBoundary em `/inimigos`
- [ ] Adicionar ErrorBoundary em `/esculachos`
- [ ] Adicionar Suspense em `/historias`
- [ ] Adicionar Suspense em `/musicas`
- [ ] Adicionar Suspense em `/inimigos`
- [ ] Adicionar Suspense em `/esculachos`
- [ ] Commit: `git commit -m "perf: add image optimization, error boundaries and suspense"`

### Testes Finais + Deploy FASE 2 (0% completo)
- [ ] Executar `npm run build`
- [ ] Testar todas as funcionalidades
- [ ] Lighthouse score (ANTES): ___
- [ ] Lighthouse score (DEPOIS): ___
- [ ] Cross-browser
- [ ] Mobile
- [ ] Merge para main
- [ ] Deploy staging → produção

---

## 📊 Métricas de Sucesso

### ANTES (baseline)
- ❌ Server Actions usadas para GET
- ❌ 13 componentes com anti-patterns
- ❌ Dependências 14-16 versões atrás
- ❌ Image optimization desabilitado
- ❌ Sem error boundaries
- Lighthouse Score: ___

### DEPOIS DA FASE 1
- [ ] ✅ Server Actions APENAS para mutações
- [ ] ✅ Padrão consistente de data fetching
- [ ] ✅ Dependências críticas atualizadas
- [ ] ✅ Next.js 15.x latest
- [ ] ✅ Zod 3.x latest
- Lighthouse Score: ___

### DEPOIS DA FASE 2
- [ ] ✅ Image optimization habilitado
- [ ] ✅ Error boundaries implementados
- [ ] ✅ Suspense implementado
- Lighthouse Score: ___

---

## 🐛 Issues Encontrados

### Durante Refatoração
_Documentar problemas encontrados durante implementação_

### Durante Atualização de Deps
_Documentar breaking changes ou problemas_

### Durante Otimizações
_Documentar problemas de performance ou bugs_

---

## 📝 Notas e Observações

_Adicionar notas importantes durante o desenvolvimento_

---

## 🔮 Próximos Passos (Futuro)

Considerar após Fase 2 estável:
- [ ] Migração Next.js 15 → 16 (quando estabilizar)
- [ ] Migração Zod 3 → 4 (quando necessário)
- [ ] Bundle analysis com `@next/bundle-analyzer`
- [ ] Code splitting adicional
- [ ] SEO optimization (metadata dinâmica, sitemap, robots.txt)
- [ ] Web Vitals tracking
