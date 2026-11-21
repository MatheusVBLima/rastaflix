"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  DEFAULT_FONT,
  FONT_STORAGE_KEY,
  isFontId,
  type FontId,
} from "@/lib/fonts";
import { withViewTransition } from "@/hooks/use-palette";

const EVENT = "rastaflix:font";

function read(): FontId {
  const value = document.documentElement.getAttribute("data-font");
  return isFontId(value) ? value : DEFAULT_FONT;
}

function subscribe(onChange: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === FONT_STORAGE_KEY && isFontId(e.newValue)) {
      document.documentElement.setAttribute("data-font", e.newValue);
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

/** Fonte atual (atributo data-font do <html>) e como trocá-la. */
export function useFont() {
  const font = useSyncExternalStore(subscribe, read, () => DEFAULT_FONT);

  const setFont = useCallback((next: FontId) => {
    withViewTransition(() => {
      document.documentElement.setAttribute("data-font", next);
      try {
        localStorage.setItem(FONT_STORAGE_KEY, next);
      } catch {
        /* sem storage: vale só nesta visita */
      }
      window.dispatchEvent(new Event(EVENT));
    });
  }, []);

  return { font, setFont };
}
