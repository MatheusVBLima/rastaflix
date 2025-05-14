import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";
import { nicknames } from "@/data/nicknames";

export default function Home() {
  return (
    <main className="flex-1 bg-background min-h-screen flex flex-col">
      {/* Em telas md e maiores, o grid ocupa a tela. Em menores, o conteúdo flui. */}
      <section className="container mx-auto grid md:grid-cols-2 gap-8 flex-grow items-center md:py-0 py-12">
        {/* Lado Esquerdo: Conteúdo de Texto */}
        {/* Centralizado em telas pequenas, alinhado à esquerda em telas médias e maiores */}
        <div className="flex flex-col gap-6 items-center md:items-start text-center md:text-left">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter">
            Rastaflix
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-md">
            Acompanhe a saga do nosso rastafari mineiro.
          </p>
          <Button asChild size="lg">
            <Link href="/sign-in">Login (Admins)</Link>
          </Button>

          <div className="mt-6 w-full max-w-md">
            <h2 className="text-2xl font-semibold mb-4">
              Apelidos Carinhosos:
            </h2>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              {nicknames.map((nickname) => (
                <Badge key={nickname} variant="secondary" className="text-sm">
                  {nickname}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Lado Direito: Imagem Hero */}
        {/* Oculto em telas pequenas (abaixo de md), ocupa altura total em telas maiores */}
        <div className="hidden md:flex md:h-screen md:sticky md:top-0 items-center justify-center">
          <div className="relative w-full h-full">
            <Image 
              src="/hero.png" 
              alt="Rastafari Mineiro Hero Image"
              layout="fill" // Ocupa todo o espaço do contêiner pai relativo
              objectFit="cover" // Similar ao background-size: cover
              className="grayscale"
              priority
            />
          </div>
        </div>
      </section>
    </main>
  );
}
