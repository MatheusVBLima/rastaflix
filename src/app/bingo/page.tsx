import { Bingo } from "@/components/bingo/Bingo";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata = pageMetadata(
  "Bingo Rastafari",
  "Bingo Rastafari com os momentos mais icônicos das lives."
);

/**
 * Page component that renders the Bingo UI.
 *
 * @returns The React element for the Bingo page.
 */
export default function BingoPage() {
  return <Bingo />;
}
