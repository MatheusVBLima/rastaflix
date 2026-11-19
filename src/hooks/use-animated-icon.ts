"use client";

import { useMemo, useRef } from "react";

export interface AnimatedIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

/**
 * Liga um ícone do lucide-animated ao hover/foco do elemento pai.
 *
 * Sem isso o ícone só anima quando o ponteiro passa em cima dele mesmo.
 * Com o `ref` conectado, o ícone fica "controlado" e passa a animar junto
 * com o botão, link ou card que o contém.
 */
export function useAnimatedIcon<T extends AnimatedIconHandle = AnimatedIconHandle>() {
  const ref = useRef<T>(null);

  const handlers = useMemo(
    () => ({
      onMouseEnter: () => ref.current?.startAnimation(),
      onMouseLeave: () => ref.current?.stopAnimation(),
      onFocus: () => ref.current?.startAnimation(),
      onBlur: () => ref.current?.stopAnimation(),
    }),
    []
  );

  return { ref, handlers };
}
