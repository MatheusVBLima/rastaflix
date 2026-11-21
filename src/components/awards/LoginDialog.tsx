"use client";

import Link from "next/link";
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
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-semibold tracking-tight">
            Entre na sua conta
          </DialogTitle>
          <DialogDescription>
            Use sua conta do Discord para registrar seus votos no Rasta Awards e liberar conquistas no perfil.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-2 gap-2">
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
