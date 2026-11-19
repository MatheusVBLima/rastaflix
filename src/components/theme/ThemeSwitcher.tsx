"use client";

import * as React from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SunIcon } from "@/components/icons/animated/sun";
import { MoonIcon } from "@/components/icons/animated/moon";
import { SparklesIcon } from "@/components/icons/animated/sparkles";
import { useAnimatedIcon, type AnimatedIconHandle } from "@/hooks/use-animated-icon";
import { usePalette, withViewTransition } from "@/hooks/use-palette";
import { isPaletteId, PALETTES } from "@/lib/palettes";

const subscribe = () => () => {};

/**
 * Atalho do header: modo e paleta. A página /aparencia tem a versão completa.
 */
export function ThemeSwitcher() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { palette, setPalette } = usePalette();
  // Tema e paleta só são conhecidos no cliente (evita erro de hidratação).
  const mounted = React.useSyncExternalStore(subscribe, () => true, () => false);
  const icon = useAnimatedIcon<AnimatedIconHandle>();

  const Icon = !mounted || theme === "system" ? SparklesIcon : theme === "light" ? SunIcon : MoonIcon;
  const swatchMode = resolvedTheme === "light" ? "light" : "dark";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Aparência" {...icon.handlers}>
          <Icon ref={icon.ref} size={18} aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Modo</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={mounted ? theme : undefined}
          onValueChange={(v) => withViewTransition(() => setTheme(v))}
        >
          <DropdownMenuRadioItem value="light">Claro</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">Escuro</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">Sistema</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Paleta</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={mounted ? palette : undefined}
          onValueChange={(v) => isPaletteId(v) && setPalette(v)}
        >
          {PALETTES.map((p) => (
            <DropdownMenuRadioItem key={p.id} value={p.id} className="gap-2">
              <span
                aria-hidden
                data-palette={p.id}
                data-mode={swatchMode}
                className="size-3.5 shrink-0 rounded-full ring-1 ring-border"
                style={{ background: "var(--primary)" }}
              />
              {p.name}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/aparencia" className="cursor-pointer">
            <Palette className="size-4" aria-hidden />
            Personalizar aparência
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
