/**
 * PRNG determinístico (Mulberry32) para manter spawns, drops, pitch e shake reproduzíveis.
 */
export interface SeededRng {
  readonly seed: number;
  next(): number;
  range(min: number, max: number): number;
  int(min: number, max: number): number;
  pick<T>(items: readonly T[]): T;
  chance(probability: number): boolean;
}

export function createSeededRandom(seedInput: number): SeededRng {
  const initialSeed = (seedInput >>> 0) || 0x9e3779b9;
  let state = initialSeed;

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    seed: initialSeed,
    next,
    range(min: number, max: number) {
      return min + next() * (max - min);
    },
    int(min: number, max: number) {
      return Math.floor(min + next() * (max - min + 1));
    },
    pick<T>(items: readonly T[]): T {
      return items[Math.floor(next() * items.length)]!;
    },
    chance(probability: number) {
      return next() < probability;
    },
  };
}

export function generateRunSeed(): number {
  return (Date.now() ^ Math.floor(performance.now() * 1000)) >>> 0;
}
