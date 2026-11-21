/** Paletas de cor do site. As cores ficam em globals.css ([data-palette="id"]). */
export const PALETTES = [
  { id: "rastaflix", name: "Rastaflix", description: "Carvão e ouro quente" },
  { id: "vercel", name: "Monocromo", description: "Preto e branco" },
  { id: "sage-garden", name: "Folha", description: "Verde sálvia e papel" },
  { id: "violet-bloom", name: "Roxo Live", description: "Violeta e grafite" },
  { id: "darkmatter", name: "Cobre", description: "Cobre e cinza escuro" },
  { id: "claude", name: "Tijolo", description: "Terracota e areia" },
  { id: "supabase", name: "Esmeralda", description: "Verde escuro e neutro" },
] as const;

export type PaletteId = (typeof PALETTES)[number]["id"];

export const DEFAULT_PALETTE: PaletteId = "rastaflix";
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
