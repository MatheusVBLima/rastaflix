"use client";

import { useSyncExternalStore, type ComponentType, type KeyboardEvent, type Ref, type RefAttributes } from "react";
import { useTheme } from "next-themes";
import { Check, Monitor } from "lucide-react";
import { SunIcon } from "@/components/icons/animated/sun";
import { MoonIcon } from "@/components/icons/animated/moon";
import { useAnimatedIcon, type AnimatedIconHandle } from "@/hooks/use-animated-icon";
import { usePalette, withViewTransition } from "@/hooks/use-palette";
import { useFont } from "@/hooks/use-font";
import { useRovingRadio } from "@/hooks/use-roving-radio";
import { PALETTES, type PaletteId } from "@/lib/palettes";
import { FONTS, type FontId } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import { PaletteMockup } from "./PaletteMockup";
import { AppearancePreview } from "./AppearancePreview";

type AnimatedIcon = ComponentType<
  { size?: number; className?: string; "aria-hidden"?: boolean } & RefAttributes<AnimatedIconHandle>
>;

const MODES = [
  { value: "light", label: "Claro", icon: SunIcon as AnimatedIcon },
  { value: "dark", label: "Escuro", icon: MoonIcon as AnimatedIcon },
  { value: "system", label: "Sistema", hint: "Segue o aparelho", icon: null },
] as const;

const subscribeNoop = () => () => {};

export function AppearanceSettings() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { palette, setPalette } = usePalette();
  const { font, setFont } = useFont();
  // Tema, paleta e fonte só existem no cliente; antes de montar nada aparece marcado.
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false);

  const paletteName = PALETTES.find((p) => p.id === palette)?.name ?? "";
  const fontName = FONTS.find((f) => f.id === font)?.name ?? "";
  const modeName = resolvedTheme === "light" ? "claro" : "escuro";

  const modeRadio = useRovingRadio({
    count: MODES.length,
    activeIndex: mounted ? MODES.findIndex((m) => m.value === theme) : 0,
    onSelect: (index) => withViewTransition(() => setTheme(MODES[index].value)),
  });

  const paletteRadio = useRovingRadio({
    count: PALETTES.length,
    activeIndex: mounted ? PALETTES.findIndex((p) => p.id === palette) : 0,
    onSelect: (index) => setPalette(PALETTES[index].id),
  });

  const fontRadio = useRovingRadio({
    count: FONTS.length,
    activeIndex: mounted ? FONTS.findIndex((f) => f.id === font) : 0,
    onSelect: (index) => setFont(FONTS[index].id),
  });

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
      <div className="space-y-10">
        {/* Modo */}
        <section aria-labelledby="modo" className="space-y-4">
          <h2 id="modo" className="font-display text-xl font-semibold tracking-tight">
            Modo
          </h2>
          <div role="radiogroup" aria-labelledby="modo" className="grid gap-3 sm:grid-cols-3">
            {MODES.map((m, i) => {
              const { ref, tabIndex, onKeyDown } = modeRadio.getItemProps(i);
              return (
                <ModeOption
                  key={m.value}
                  buttonRef={ref}
                  tabIndex={tabIndex}
                  onKeyDown={onKeyDown}
                  label={m.label}
                  hint={"hint" in m ? m.hint : undefined}
                  icon={m.icon}
                  selected={mounted && theme === m.value}
                  onSelect={() => withViewTransition(() => setTheme(m.value))}
                />
              );
            })}
          </div>
        </section>

        {/* Paleta */}
        <section aria-labelledby="paleta" className="space-y-4">
          <h2 id="paleta" className="font-display text-xl font-semibold tracking-tight">
            Paleta
          </h2>
          <div role="radiogroup" aria-labelledby="paleta" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {PALETTES.map((p, i) => {
              const { ref, tabIndex, onKeyDown } = paletteRadio.getItemProps(i);
              return (
                <PaletteOption
                  key={p.id}
                  buttonRef={ref}
                  tabIndex={tabIndex}
                  onKeyDown={onKeyDown}
                  id={p.id}
                  name={p.name}
                  description={p.description}
                  selected={mounted && palette === p.id}
                  onSelect={() => setPalette(p.id)}
                />
              );
            })}
          </div>
        </section>

        {/* Fonte */}
        <section aria-labelledby="fonte" className="space-y-4">
          <h2 id="fonte" className="font-display text-xl font-semibold tracking-tight">
            Fonte
          </h2>
          <div role="radiogroup" aria-labelledby="fonte" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {FONTS.map((f, i) => {
              const { ref, tabIndex, onKeyDown } = fontRadio.getItemProps(i);
              return (
                <FontOption
                  key={f.id}
                  buttonRef={ref}
                  tabIndex={tabIndex}
                  onKeyDown={onKeyDown}
                  id={f.id}
                  name={f.name}
                  description={f.description}
                  selected={mounted && font === f.id}
                  onSelect={() => setFont(f.id)}
                />
              );
            })}
          </div>
        </section>
      </div>

      <div className="lg:sticky lg:top-24">
        <AppearancePreview label={mounted ? `${paletteName} (${modeName}), ${fontName}` : ""} />
      </div>
    </div>
  );
}

function ModeOption({
  buttonRef,
  tabIndex,
  onKeyDown,
  label,
  hint,
  icon: Icon,
  selected,
  onSelect,
}: {
  buttonRef: Ref<HTMLButtonElement>;
  tabIndex: number;
  onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => void;
  label: string;
  hint?: string;
  icon: AnimatedIcon | null;
  selected: boolean;
  onSelect: () => void;
}) {
  const icon = useAnimatedIcon<AnimatedIconHandle>();
  return (
    <button
      ref={buttonRef}
      type="button"
      role="radio"
      aria-checked={selected}
      tabIndex={tabIndex}
      onKeyDown={onKeyDown}
      onClick={onSelect}
      {...icon.handlers}
      className={cn(
        "flex items-center gap-3 rounded-xl border bg-card p-4 text-left transition-[border-color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected ? "border-primary ring-1 ring-primary" : "hover:border-foreground/20"
      )}
    >
      <span className="shrink-0 text-primary">
        {Icon ? <Icon ref={icon.ref} size={20} aria-hidden /> : <Monitor className="size-5" aria-hidden />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{label}</span>
        {hint && <span className="block text-sm text-muted-foreground">{hint}</span>}
      </span>
      <SelectedMark visible={selected} />
    </button>
  );
}

function PaletteOption({
  buttonRef,
  tabIndex,
  onKeyDown,
  id,
  name,
  description,
  selected,
  onSelect,
}: {
  buttonRef: Ref<HTMLButtonElement>;
  tabIndex: number;
  onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => void;
  id: PaletteId;
  name: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      role="radio"
      aria-checked={selected}
      tabIndex={tabIndex}
      onKeyDown={onKeyDown}
      onClick={onSelect}
      className={cn(
        "group overflow-hidden rounded-xl border bg-card text-left transition-[border-color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected ? "border-primary ring-1 ring-primary" : "hover:border-foreground/20"
      )}
    >
      <div className="flex h-24 border-b">
        <PaletteMockup palette={id} mode="light" />
        <PaletteMockup palette={id} mode="dark" />
      </div>
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="min-w-0 flex-1">
          <span className="block font-medium">{name}</span>
          <span className="block truncate text-sm text-muted-foreground">{description}</span>
        </span>
        <SelectedMark visible={selected} />
      </div>
    </button>
  );
}

function FontOption({
  buttonRef,
  tabIndex,
  onKeyDown,
  id,
  name,
  description,
  selected,
  onSelect,
}: {
  buttonRef: Ref<HTMLButtonElement>;
  tabIndex: number;
  onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => void;
  id: FontId;
  name: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      role="radio"
      aria-checked={selected}
      tabIndex={tabIndex}
      onKeyDown={onKeyDown}
      onClick={onSelect}
      data-font={id}
      className={cn(
        "flex flex-col gap-3 rounded-xl border bg-card p-4 text-left font-sans transition-[border-color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected ? "border-primary ring-1 ring-primary" : "hover:border-foreground/20"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          aria-hidden
          className="font-display text-2xl font-semibold leading-none tracking-tight text-foreground"
        >
          Aa
        </span>
        <SelectedMark visible={selected} />
      </div>
      <span className="min-w-0 space-y-0.5">
        <span className="block font-medium leading-snug">{name}</span>
        <span className="block truncate text-sm text-muted-foreground">{description}</span>
      </span>
    </button>
  );
}

function SelectedMark({ visible }: { visible: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-[opacity,transform] duration-150",
        visible ? "scale-100 opacity-100" : "scale-75 opacity-0"
      )}
    >
      <Check className="size-3.5" aria-hidden />
    </span>
  );
}
