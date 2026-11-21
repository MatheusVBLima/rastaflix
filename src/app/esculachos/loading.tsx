import { PageLoading } from "@/components/layout/PageLoading";

export default function Loading() {
  return (
    <PageLoading
      slug="esculachos"
      title="Esculachos"
      description="Trechos da live para ouvir e baixar."
      variant="quote"
      count={4}
    />
  );
}
