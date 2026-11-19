/** Paletas de cor do site (TweakCN). As cores ficam em globals.css ([data-palette="id"]). */
export const PALETTES = [
  { id: "vercel", name: "Vercel", description: "Preto e branco minimalista" },
  { id: "sage-garden", name: "Sage Garden", description: "Verde sálvia sereno" },
  { id: "violet-bloom", name: "Violet Bloom", description: "Violeta vibrante" },
  { id: "darkmatter", name: "Darkmatter", description: "Cobre e carvão" },
  { id: "claude", name: "Claude", description: "Terracota e areia" },
  { id: "supabase", name: "Supabase", description: "Verde esmeralda" },
] as const;

export type PaletteId = (typeof PALETTES)[number]["id"];

export const DEFAULT_PALETTE: PaletteId = "vercel";
export const PALETTE_STORAGE_KEY = "palette";

export function isPaletteId(value: unknown): value is PaletteId {
  return PALETTES.some((p) => p.id === value);
}

/**
 * Roda no <head>, antes da pintura: aplica a paleta salva e cai para o
 * padrão (Vercel) caso o navegador ainda tenha uma paleta antiga removida.
 */
export const paletteInitScript = `(function(){try{var d=document.documentElement,ls=localStorage,ids=${JSON.stringify(
  PALETTES.map((p) => p.id)
)},p=ls.getItem("${PALETTE_STORAGE_KEY}");if(ids.indexOf(p)<0){p="${DEFAULT_PALETTE}";ls.setItem("${PALETTE_STORAGE_KEY}",p);}d.setAttribute("data-palette",p);}catch(e){document.documentElement.setAttribute("data-palette","${DEFAULT_PALETTE}");}})();`;
