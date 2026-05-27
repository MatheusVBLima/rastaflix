import { Bingo } from "@/components/bingo/Bingo";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bingo Rastafari | Rastaflix",
  description: "Bingo Rastafari com os momentos mais icônicos das lives.",
};

/**
 * Page component that renders the Bingo UI.
 *
 * @returns The React element for the Bingo page.
 */
export default function BingoPage() {
  return <Bingo />;
}
