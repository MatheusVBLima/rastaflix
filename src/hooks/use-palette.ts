"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  DEFAULT_PALETTE,
  isPaletteId,
  PALETTE_STORAGE_KEY,
  type PaletteId,
} from "@/lib/palettes";

const EVENT = "rastaflix:palette";

function read(): PaletteId {
  const value = document.documentElement.getAttribute("data-palette");
  return isPaletteId(value) ? value : DEFAULT_PALETTE;
}

function subscribe(onChange: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === PALETTE_STORAGE_KEY && isPaletteId(e.newValue)) {
      document.documentElement.setAttribute("data-palette", e.newValue);
      onChange();
    }
  };
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

/** Troca com cross-fade (View Transitions) quando o navegador suporta. */
export function withViewTransition(update: () => void) {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (doc.startViewTransition && !reduce) doc.startViewTransition(update);
  else update();
}

/** Paleta atual (atributo data-palette do <html>) e como trocá-la. */
export function usePalette() {
  const palette = useSyncExternalStore(subscribe, read, () => DEFAULT_PALETTE);

  const setPalette = useCallback((next: PaletteId) => {
    withViewTransition(() => {
      document.documentElement.setAttribute("data-palette", next);
      try {
        localStorage.setItem(PALETTE_STORAGE_KEY, next);
      } catch {
        /* sem storage: vale só nesta visita */
      }
      window.dispatchEvent(new Event(EVENT));
    });
  }, []);

  return { palette, setPalette };
}
