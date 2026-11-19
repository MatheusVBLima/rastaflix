import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageTransition } from "@/components/layout/PageTransition";
import { AppearanceSettings } from "@/components/appearance/AppearanceSettings";

// O layout já acrescenta " | Rastaflix" ao título.
export const metadata: Metadata = {
  title: "Aparência",
  robots: { index: false },
};

export default function AparenciaPage() {
  return (
    <PageTransition>
      <div className="container mx-auto space-y-8 px-4 py-10 md:px-6">
        <PageHeader
          title="Aparência"
          description="Escolha o modo e a paleta. Muda na hora e fica salvo neste navegador."
        />
        <AppearanceSettings />
      </div>
    </PageTransition>
  );
}
