"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CopyIcon } from "@/components/icons/animated/copy";
import { CheckIcon } from "@/components/icons/animated/check";
import { useAnimatedIcon, type AnimatedIconHandle } from "@/hooks/use-animated-icon";
import { cn } from "@/lib/utils";

interface CopyLinkButtonProps {
  url: string;
  label?: string;
  className?: string;
}

export function CopyLinkButton({
  url,
  label = "Copiar link",
  className,
}: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);
  const icon = useAnimatedIcon<AnimatedIconHandle>();

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copiado");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Não foi possível copiar o link");
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Link copiado" : label}
      title={label}
      {...icon.handlers}
      className={cn(
        "relative z-10 flex size-9 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm ring-1 ring-border backdrop-blur transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
    >
      {copied ? (
        <CheckIcon size={16} aria-hidden className="text-success" />
      ) : (
        <CopyIcon ref={icon.ref} size={16} aria-hidden />
      )}
    </button>
  );
}
