"use client";

import { useState } from "react";
import { Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { AwardsPreviewSidebar } from "./AwardsPreviewSidebar";

export function PreviewButton() {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  return (
    <>
      {/* Botão flutuante fixo */}
      <Button
        onClick={() => setIsPreviewOpen(true)}
        size="lg"
        className="fixed bottom-8 right-8 z-40 shadow-lg hover:shadow-xl transition-shadow rounded-full h-14 w-14 p-0"
        title="Abrir Preview"
      >
        <Eye className="h-5 w-5" />
        <span className="sr-only">Abrir Preview</span>
      </Button>

      {/* Sheet lateral com preview - modal={false} permite trabalhar com ele aberto */}
      <Sheet open={isPreviewOpen} onOpenChange={setIsPreviewOpen} modal={false}>
        <SheetContent
          side="right"
          className="sm:max-w-2xl lg:w-1/2 lg:max-w-4xl overflow-y-auto p-0"
          onInteractOutside={(e) => {
            // Previne fechar ao clicar fora
            e.preventDefault();
          }}
        >
          <SheetHeader className="p-6 pb-4 border-b sticky top-0 bg-background z-10">
            <div className="flex items-center justify-between">
              <SheetTitle>Preview do Rasta Awards</SheetTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPreviewOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Fechar Preview</span>
              </Button>
            </div>
          </SheetHeader>
          <div className="p-6">
            <AwardsPreviewSidebar />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
