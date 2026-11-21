/** Fontes do site. As variáveis ficam em globals.css ([data-font="id"]). */
export const FONTS = [
  { id: "geist", name: "Padrão", description: "Geist e Unbounded" },
  { id: "jakarta", name: "Plus Jakarta", description: "Geométrica e suave" },
  { id: "space", name: "Space Grotesk", description: "Editorial e marcante" },
  { id: "lora", name: "Lora", description: "Serifa para leitura" },
  { id: "mono", name: "JetBrains Mono", description: "Monoespaçada estilo terminal" },
] as const;

export type FontId = (typeof FONTS)[number]["id"];

export const DEFAULT_FONT: FontId = "geist";
export const FONT_STORAGE_KEY = "font";

export function isFontId(value: unknown): value is FontId {
  return FONTS.some((f) => f.id === value);
}

/**
 * Roda no <head>, antes da pintura: aplica a fonte salva e cai para o
 * padrão caso o navegador tenha um valor inválido.
 */
export const fontInitScript = `(function(){try{var d=document.documentElement,ls=localStorage,ids=${JSON.stringify(
  FONTS.map((f) => f.id)
)},f=ls.getItem("${FONT_STORAGE_KEY}");if(ids.indexOf(f)<0){f="${DEFAULT_FONT}";ls.setItem("${FONT_STORAGE_KEY}",f);}d.setAttribute("data-font",f);}catch(e){document.documentElement.setAttribute("data-font","${DEFAULT_FONT}");}})();`;
