import { useState, useEffect } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Certifique-se de que window está definido (para SSR/SSG)
    if (typeof window === "undefined") {
      return;
    }

    const mediaQueryList = window.matchMedia(query);
    const listener = () => setMatches(mediaQueryList.matches);

    // Definir o estado inicial
    listener();

    // Adicionar listener para mudanças
    // mediaQueryList.addListener(listener) é depreciado, usar addEventListener
    mediaQueryList.addEventListener("change", listener);

    // Limpar o listener ao desmontar
    return () => mediaQueryList.removeEventListener("change", listener);
  }, [query]);

  return matches;
}
