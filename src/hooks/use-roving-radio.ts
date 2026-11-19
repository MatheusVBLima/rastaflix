"use client";

import { useCallback, useRef, type KeyboardEvent } from "react";

interface UseRovingRadioOptions {
  count: number;
  activeIndex: number;
  /** Chamado ao mover com as setas/Home/End. Omita para apenas mover o foco (ex.: mutação remota). */
  onSelect?: (index: number) => void;
  disabled?: boolean;
}

/**
 * Roving tabindex + navegação por setas (←/→/↑/↓, Home, End) para grupos `role="radiogroup"`.
 * Apenas o item ativo (ou o primeiro, se nenhum estiver marcado) recebe `tabIndex={0}`.
 */
export function useRovingRadio({
  count,
  activeIndex,
  onSelect,
  disabled = false,
}: UseRovingRadioOptions) {
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const focusableIndex = activeIndex >= 0 && activeIndex < count ? activeIndex : 0;

  const moveTo = useCallback(
    (nextIndex: number) => {
      if (count <= 0 || disabled) return;
      const wrapped = ((nextIndex % count) + count) % count;
      itemRefs.current[wrapped]?.focus();
      onSelect?.(wrapped);
    },
    [count, disabled, onSelect]
  );

  const getItemProps = useCallback(
    (index: number) => ({
      ref: (el: HTMLButtonElement | null) => {
        itemRefs.current[index] = el;
      },
      tabIndex: disabled ? -1 : index === focusableIndex ? 0 : -1,
      onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => {
        if (disabled || count <= 1) return;
        switch (e.key) {
          case "ArrowRight":
          case "ArrowDown":
            e.preventDefault();
            moveTo(index + 1);
            break;
          case "ArrowLeft":
          case "ArrowUp":
            e.preventDefault();
            moveTo(index - 1);
            break;
          case "Home":
            e.preventDefault();
            moveTo(0);
            break;
          case "End":
            e.preventDefault();
            moveTo(count - 1);
            break;
        }
      },
    }),
    [count, disabled, focusableIndex, moveTo]
  );

  return { getItemProps };
}
