import { nicknames } from "@/data/nicknames";

const PATCH_SHAPES = [
  "cement-patch-0",
  "cement-patch-1",
  "cement-patch-2",
  "cement-patch-3",
  "cement-patch-4",
] as const;

const PATCH_OFFSETS = [
  "-rotate-[2.4deg] -translate-y-4 sm:-translate-y-6",
  "rotate-[1.9deg] translate-y-4 sm:translate-y-5",
  "-rotate-[1.1deg] -translate-y-1 sm:-translate-y-2",
  "rotate-[2.6deg] -translate-y-5 sm:-translate-y-7",
  "-rotate-[1.8deg] translate-y-5 sm:translate-y-6",
  "rotate-[1.2deg] translate-y-1 sm:translate-y-2",
  "-rotate-[2.1deg] -translate-y-3 sm:-translate-y-5",
] as const;

const CEMENT_BG_POSITIONS = [
  "0 0, 0 0, 0 0, 12% 18%",
  "0 0, 0 0, 0 0, 68% 42%",
  "0 0, 0 0, 0 0, 34% 78%",
  "0 0, 0 0, 0 0, 82% 24%",
  "0 0, 0 0, 0 0, 48% 58%",
] as const;

/**
 * Muro de tijolo realista rolando com os apelidos gravados em "remendos" de cimento.
 * O muro acompanha cada bloco do letreiro para os remendos parecerem chumbados nos tijolos.
 * Pausa no hover; parado com reduced motion.
 */
export function NicknameMarquee() {
  const renderItems = (prefix: string) =>
    nicknames.map((n, index) => {
      const shape = PATCH_SHAPES[index % PATCH_SHAPES.length];
      const offset = PATCH_OFFSETS[index % PATCH_OFFSETS.length];
      const bgPos = CEMENT_BG_POSITIONS[index % CEMENT_BG_POSITIONS.length];

      return (
        <li
          key={`${prefix}-${n}`}
          className="flex shrink-0 items-center px-5 sm:px-7 md:px-8"
        >
          <span className={`cement-patch-wrap inline-block ${offset}`}>
            <span
              className={`cement-patch ${shape}`}
              style={{ backgroundPosition: bgPos }}
            >
              <span className="cement-text font-cement text-2xl leading-none font-bold tracking-tight sm:text-3xl md:text-[2rem]">
                {n}
              </span>
            </span>
          </span>
        </li>
      );
    });

  return (
    <div className="marquee brick-wall-band relative overflow-hidden">
      {/* Pingadeira / topo de concreto do muro */}
      <div aria-hidden className="brick-wall-cap relative z-20 w-full" />

      {/* Vinheta suave nas bordas laterais */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-background/85 to-transparent sm:w-20"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-background/85 to-transparent sm:w-20"
      />

      <div
        className="marquee-track flex w-max"
        style={{ ["--marquee-duration" as string]: `${nicknames.length * 3.8}s` }}
      >
        <ul
          className="brick-wall-surface flex min-h-[150px] items-center py-10 sm:min-h-[190px] sm:py-14 md:min-h-[220px] md:py-16"
          aria-label="Apelidos"
        >
          {renderItems("a")}
        </ul>
        <ul
          className="brick-wall-surface flex min-h-[150px] items-center py-10 sm:min-h-[190px] sm:py-14 md:min-h-[220px] md:py-16"
          aria-hidden
        >
          {renderItems("b")}
        </ul>
      </div>
    </div>
  );
}
