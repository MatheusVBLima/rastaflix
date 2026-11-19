"use client";

import Link from "next/link";
import { User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center text-center sm:text-center">
          <span className="mb-2 flex size-14 items-center justify-center rounded-full bg-muted/70 ring-8 ring-muted/30">
            <span className="flex size-10 items-center justify-center rounded-full border bg-background shadow-xs">
              <User className="size-4 text-muted-foreground" aria-hidden />
            </span>
          </span>
          <DialogTitle className="font-display text-xl font-semibold tracking-tight">
            Entre na sua conta
          </DialogTitle>
          <DialogDescription>
            Use sua conta do Discord para registrar seus votos no Rasta Awards e liberar conquistas no perfil.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-2 gap-2 sm:justify-center">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Agora não
          </Button>
          <Button asChild>
            <Link href="/sign-in">Entrar com Discord</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
