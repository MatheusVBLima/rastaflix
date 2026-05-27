import { DLE } from "@/components/dle/DLE";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata = pageMetadata(
  "Ovelhera DLE",
  "Adivinhe o personagem do universo Ovelhera.",
  "/ovelhera-dle"
);

/**
 * Renders the page layout that hosts the DLE component.
 *
 * @returns A JSX element containing a centered container with padding that wraps the `DLE` component
 */
export default function page() {
  return (
    <div className="container mx-auto py-10 min-h-screen">
      <DLE />
    </div>
  );
}
