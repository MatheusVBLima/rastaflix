import { Bingo } from "@/components/bingo/Bingo";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageTransition } from "@/components/layout/PageTransition";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata = pageMetadata(
  "Bingo Rastafari",
  "Marque na cartela 4x4 o que acontecer na live.",
  "/bingo"
);

export default function BingoPage() {
  return (
    <PageTransition name="route-bingo">
      <div className="container mx-auto max-w-3xl space-y-8 px-4 py-10 md:px-6">
        <PageHeader
          slug="bingo"
          title="Bingo Rastafari"
          description="Marque o que acontecer na live. Linha, coluna ou diagonal completa é bingo."
        />
        <Bingo />
      </div>
    </PageTransition>
  );
}
