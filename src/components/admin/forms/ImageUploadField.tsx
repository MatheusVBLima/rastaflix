"use client";

import { useRef, useState } from "react";
import { ImageUp, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ButtonLoader } from "@/components/ui/loader";
import { cn } from "@/lib/utils";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = "image/png,image/jpeg,image/webp,image/gif";
const ALLOWED_MIMES = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"]);

export type ImageUploadFolder = "awards" | "clipes" | "historias" | "musicas";

interface ImageUploadFieldProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  name?: string;
  id?: string;
  folder: ImageUploadFolder;
  placeholder?: string;
  disabled?: boolean;
  onUploadingChange?: (uploading: boolean) => void;
}

/**
 * Campo híbrido de imagem: permite enviar arquivo direto para o Supabase Storage
 * (clique ou arraste) ou colar uma URL manualmente.
 */
export function ImageUploadField({
  value,
  onChange,
  onBlur,
  name,
  id,
  folder,
  placeholder = "https://… ou envie uma imagem",
  disabled,
  onUploadingChange,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

  function setBusy(busy: boolean) {
    setUploading(busy);
    onUploadingChange?.(busy);
  }

  async function uploadFile(file: File) {
    if (!ALLOWED_MIMES.has(file.type.toLowerCase())) {
      toast.error("Formato não suportado", {
        description: "Envie uma imagem PNG, JPG, WebP ou GIF.",
      });
      return;
    }

    if (file.size > MAX_BYTES) {
      toast.error("Imagem muito grande", {
        description: "O tamanho máximo permitido é 5 MB.",
      });
      return;
    }

    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", folder);

      const response = await fetch("/api/admin/upload-image", {
        method: "POST",
        body: fd,
      });

      const data = (await response.json().catch(() => ({}))) as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        toast.error("Não foi possível enviar a imagem", {
          description: data.error || "Tente novamente em instantes.",
        });
        return;
      }

      onChange(data.url);
      toast.success("Imagem enviada");
    } catch {
      toast.error("Não foi possível enviar a imagem", {
        description: "Verifique sua conexão e tente novamente.",
      });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    if (disabled || uploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) void uploadFile(file);
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled && !uploading) setDragging(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setDragging(false);
        }
      }}
      onDrop={handleDrop}
      className={cn(
        "space-y-2 rounded-lg transition-colors",
        dragging && "bg-primary/5 ring-2 ring-primary/40 ring-offset-2 ring-offset-background"
      )}
    >
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            id={id}
            name={name}
            inputMode="url"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            disabled={disabled || uploading}
            className={value ? "pr-8" : undefined}
          />
          {value && !disabled && !uploading && (
            <button
              type="button"
              onClick={() => onChange("")}
              aria-label="Limpar link da imagem"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void uploadFile(file);
          }}
        />

        <Button
          type="button"
          variant="outline"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
          className="shrink-0 gap-1.5"
        >
          {uploading ? <ButtonLoader label="Enviando" /> : <ImageUp className="size-4" aria-hidden />}
          <span>{uploading ? "Enviando" : "Enviar"}</span>
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Cole um link ou arraste/envie PNG, JPG, WebP ou GIF (até 5 MB).
      </p>
    </div>
  );
}
