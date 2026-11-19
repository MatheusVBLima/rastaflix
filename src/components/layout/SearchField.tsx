"use client";

import { useId } from "react";
import { SearchIcon } from "@/components/icons/animated/search";
import { XIcon } from "@/components/icons/animated/x";
import { useAnimatedIcon, type AnimatedIconHandle } from "@/hooks/use-animated-icon";
import { cn } from "@/lib/utils";

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  /** Nome acessível do campo, ex.: "Buscar histórias". */
  label: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Campo de busca com ícone animado e botão de limpar.
 * O rótulo fica só para leitores de tela: a lupa e o placeholder já
 * identificam o campo visualmente.
 */
export function SearchField({
  value,
  onChange,
  label,
  placeholder,
  className,
  disabled,
}: SearchFieldProps) {
  const id = useId();
  const search = useAnimatedIcon<AnimatedIconHandle>();
  const clear = useAnimatedIcon<AnimatedIconHandle>();

  return (
    <div
      className={cn("group relative w-full sm:max-w-sm", className)}
      onMouseEnter={search.handlers.onMouseEnter}
      onMouseLeave={search.handlers.onMouseLeave}
    >
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <SearchIcon
        ref={search.ref}
        size={16}
        aria-hidden
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-foreground"
      />
      <input
        id={id}
        type="search"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onFocus={search.handlers.onFocus}
        onBlur={search.handlers.onBlur}
        placeholder={placeholder ?? label}
        autoComplete="off"
        className="h-10 w-full rounded-lg border border-input bg-background/60 pl-9 pr-9 text-sm shadow-xs outline-none transition-[color,box-shadow,border-color] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:opacity-50 dark:bg-input/30 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Limpar busca"
          {...clear.handlers}
          className="absolute right-1.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <XIcon ref={clear.ref} size={14} aria-hidden />
        </button>
      )}
    </div>
  );
}
