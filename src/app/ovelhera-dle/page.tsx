import { DLE } from "@/components/dle/DLE";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageTransition } from "@/components/layout/PageTransition";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata = pageMetadata(
  "Ovelhera DLE",
  "Adivinhe o personagem do universo Ovelhera.",
  "/ovelhera-dle"
);

export default function OvelheraDlePage() {
  return (
    <PageTransition name="route-ovelhera-dle">
      <div className="container mx-auto space-y-8 px-4 py-10 md:px-6">
        <PageHeader slug="ovelhera-dle" title="Ovelhera DLE" />
        <DLE />
      </div>
    </PageTransition>
  );
}
