# Plano: Rasta Hero - Jogo Estilo Guitar Hero

## Resumo

Criar um jogo de ritmo estilo Guitar Hero chamado "Rasta Hero" integrado com as músicas do `/musicas`. O jogo terá notas caindo de cima para baixo em 4 lanes (teclas D, F, J, K), com pontuação online via Supabase e charts auto-gerados.

---

## Decisões Técnicas

| Aspecto | Decisão |
|---------|---------|
| Lanes | 4 (D, F, J, K) |
| Charts | Auto-geração baseada em BPM |
| Plataforma | Desktop only (teclado) |
| Pontuação | Online (Supabase) |
| Áudio | YouTube IFrame API (iframe oculto) |
| Animações | Motion (já no projeto) |

---

## Estrutura de Arquivos

```
src/
├── app/
│   ├── rasta-hero/
│   │   ├── page.tsx              # Seleção de músicas
│   │   └── play/[songId]/
│   │       └── page.tsx          # Página do jogo
│   └── admin/rasta-hero/
│       └── page.tsx              # Gerenciamento de songs
├── components/rasta-hero/
│   ├── RastaHero.tsx             # Container principal
│   ├── GameCanvas.tsx            # Renderização das notas
│   ├── NoteTrack.tsx             # Lane individual
│   ├── HitZone.tsx               # Zona de acerto
│   ├── ScoreDisplay.tsx          # Pontuação/combo
│   ├── GameHUD.tsx               # Progresso/multiplicador
│   ├── SongSelect.tsx            # Lista de músicas
│   ├── DifficultySelect.tsx      # Seletor de dificuldade
│   ├── ResultsScreen.tsx         # Tela de resultados
│   ├── Leaderboard.tsx           # Ranking
│   └── YouTubePlayer.tsx         # Player oculto
├── actions/
│   └── rastaHeroActions.ts       # Server actions
├── lib/rasta-hero/
│   ├── types.ts                  # Tipos/interfaces
│   ├── gameEngine.ts             # Lógica do jogo
│   ├── noteGenerator.ts          # Auto-geração de charts
│   └── scoring.ts                # Cálculo de pontuação
└── hooks/
    └── useRastaHero.ts           # Hook customizado
```

---

## Schema do Banco de Dados

### Tabela: `rhythm_songs`
```sql
CREATE TABLE rhythm_songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  music_id UUID REFERENCES musicas(id) ON DELETE CASCADE,
  bpm INTEGER NOT NULL DEFAULT 120,
  duration_ms INTEGER NOT NULL,
  offset_ms INTEGER DEFAULT 0,
  difficulty_available TEXT[] DEFAULT ARRAY['easy'],
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Tabela: `rhythm_note_charts`
```sql
CREATE TABLE rhythm_note_charts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id UUID REFERENCES rhythm_songs(id) ON DELETE CASCADE,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  notes JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(song_id, difficulty)
);
```

### Tabela: `rhythm_high_scores`
```sql
CREATE TABLE rhythm_high_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  song_id UUID REFERENCES rhythm_songs(id) ON DELETE CASCADE,
  difficulty TEXT NOT NULL,
  score INTEGER NOT NULL,
  max_combo INTEGER NOT NULL,
  perfect_count INTEGER DEFAULT 0,
  good_count INTEGER DEFAULT 0,
  miss_count INTEGER DEFAULT 0,
  accuracy DECIMAL(5,2) NOT NULL,
  grade TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, song_id, difficulty)
);
```

---

## Fases de Implementação

### Fase 1: Fundação
1. Criar migrações do banco de dados
2. Definir tipos em `src/lib/rasta-hero/types.ts`
3. Criar server actions básicas
4. Página de seleção de músicas

**Arquivos:**
- `src/lib/rasta-hero/types.ts`
- `src/actions/rastaHeroActions.ts`
- `src/app/rasta-hero/page.tsx`
- `src/components/rasta-hero/SongSelect.tsx`

### Fase 2: Motor do Jogo
1. Integração YouTube IFrame API
2. Sistema de renderização de notas com Motion
3. Handling de input (teclado)
4. Detecção de timing/acertos

**Arquivos:**
- `src/components/rasta-hero/YouTubePlayer.tsx`
- `src/components/rasta-hero/GameCanvas.tsx`
- `src/components/rasta-hero/NoteTrack.tsx`
- `src/components/rasta-hero/HitZone.tsx`
- `src/lib/rasta-hero/gameEngine.ts`

### Fase 3: Auto-Geração de Charts
1. Algoritmo de geração baseado em BPM
2. Diferentes densidades por dificuldade
3. Padrões variados (single, double, chord)

**Arquivos:**
- `src/lib/rasta-hero/noteGenerator.ts`

### Fase 4: Pontuação e Feedback
1. Sistema de scoring (Perfect/Good/Miss)
2. Combos e multiplicadores
3. Efeitos visuais de acerto
4. HUD com progresso

**Arquivos:**
- `src/lib/rasta-hero/scoring.ts`
- `src/components/rasta-hero/ScoreDisplay.tsx`
- `src/components/rasta-hero/GameHUD.tsx`

### Fase 5: Persistência e Ranking
1. Salvar high scores no Supabase
2. Tela de resultados com grade
3. Leaderboard global

**Arquivos:**
- `src/components/rasta-hero/ResultsScreen.tsx`
- `src/components/rasta-hero/Leaderboard.tsx`

### Fase 6: Admin e Polish
1. Página admin para gerenciar songs
2. Ativar/desativar músicas no jogo
3. Ajustar BPM/offset por música

**Arquivos:**
- `src/app/admin/rasta-hero/page.tsx`

---

## Mecânicas do Jogo

### Timing Windows
| Resultado | Janela | Pontos | Combo |
|-----------|--------|--------|-------|
| Perfect | ±50ms | 100 × mult | +1 |
| Good | ±100ms | 50 × mult | +1 |
| Miss | >150ms | 0 | reset |

### Multiplicador
- 10 combo = 2x
- 25 combo = 3x
- 50 combo = 4x

### Grades
| Grade | Accuracy |
|-------|----------|
| S | ≥95% |
| A | ≥90% |
| B | ≥80% |
| C | ≥70% |
| D | ≥60% |
| F | <60% |

---

## Arquivos de Referência

| Arquivo | Uso |
|---------|-----|
| [Bingo.tsx](src/components/bingo/Bingo.tsx) | Padrão de animações Motion |
| [DLE.tsx](src/components/dle/DLE.tsx) | State management complexo |
| [types.ts](src/lib/types.ts) | Adicionar novos schemas Zod |
| [musicActions.ts](src/actions/musicActions.ts) | Padrão de server actions |
| [queries.ts](src/lib/queries.ts) | Padrão de queries |

---

## Dependências

Nenhuma nova dependência necessária. Usar:
- `motion` (já instalado) - animações
- `canvas-confetti` (já instalado) - celebração
- YouTube IFrame API (CDN) - áudio
