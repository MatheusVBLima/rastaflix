"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { AwardsPreviewSidebar } from "./AwardsPreviewSidebar";

export function PreviewButton() {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsPreviewOpen(true)}
        size="lg"
        className="fixed bottom-6 right-6 z-40 gap-2 rounded-full px-5 shadow-lg transition-shadow hover:shadow-xl"
        aria-label="Abrir Preview"
      >
        <Eye className="size-4" aria-hidden />
        <span className="hidden sm:inline">Preview</span>
      </Button>

      {/* Sheet lateral com preview - modal={false} permite editar com ele aberto */}
      <Sheet open={isPreviewOpen} onOpenChange={setIsPreviewOpen} modal={false}>
        <SheetContent
          side="right"
          className="w-full gap-0 overflow-y-auto p-0 sm:max-w-2xl lg:w-1/2 lg:max-w-3xl"
          onInteractOutside={(e) => {
            e.preventDefault();
          }}
        >
          <SheetHeader className="sticky top-0 z-10 border-b bg-background/95 px-6 py-5 pr-12 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <SheetTitle className="font-display text-lg font-semibold tracking-tight">
              Preview do Rasta Awards
            </SheetTitle>
            <SheetDescription>
              Visualização em tempo real de como a votação aparece no site.
            </SheetDescription>
          </SheetHeader>
          <div className="p-6">
            <AwardsPreviewSidebar />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
