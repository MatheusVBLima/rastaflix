"use client";

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Balões subindo pela tela (acertos, conquistas). Carregado sob demanda. */
export async function celebrate() {
  if (prefersReducedMotion()) return;
  const { balloons } = await import("balloons-js");
  await balloons();
}

/** Balões em formato de texto, para momentos grandes (fim de jogo). */
export async function celebrateText(text: string, color = "#22c55e") {
  if (prefersReducedMotion()) return;
  const { textBalloons } = await import("balloons-js");
  await textBalloons([{ text, fontSize: 120, color }]);
}
