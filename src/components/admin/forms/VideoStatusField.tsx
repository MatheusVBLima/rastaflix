"use client";

import { Archive, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRovingRadio } from "@/hooks/use-roving-radio";
import { cn } from "@/lib/utils";

export const VIDEO_STATUS_OPTIONS = [
  { value: "ativo", label: "Ativo" },
  { value: "arquivado", label: "Arquivado" },
] as const;

export function VideoStatusBadge({ archived }: { archived?: boolean }) {
  return (
    <Badge variant={archived ? "arquivado" : "ativo"} className="gap-1.5 px-2 py-0.5">
      {archived ? <Archive aria-hidden /> : <Eye aria-hidden />}
      {archived ? "Arquivado" : "Ativo"}
    </Badge>
  );
}

const RADIO_OPTIONS = [
  { archived: false, label: "Ativo" },
  { archived: true, label: "Arquivado" },
] as const;

export function VideoStatusRadioGroup({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (archived: boolean) => void;
}) {
  const radio = useRovingRadio({
    count: RADIO_OPTIONS.length,
    activeIndex: value ? 1 : 0,
    onSelect: (index) => onChange(RADIO_OPTIONS[index].archived),
  });

  return (
    <div role="radiogroup" aria-label="Status de exibição" className="grid grid-cols-2 gap-2">
      {RADIO_OPTIONS.map((opt, index) => {
        const selected = value === opt.archived;
        return (
          <button
            key={opt.label}
            type="button"
            role="radio"
            aria-checked={selected}
            {...radio.getItemProps(index)}
            onClick={() => onChange(opt.archived)}
            className={cn(
              "flex h-12 items-center justify-center rounded-lg border transition-[border-color,background-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selected ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-accent/40"
            )}
          >
            <VideoStatusBadge archived={opt.archived} />
          </button>
        );
      })}
    </div>
  );
}
