import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";
import { nicknames } from "@/data/nicknames";

/**
 * Renders the homepage with a centered introduction and a list of nicknames for Gabriel Scutasu, alongside a hero image on large screens.
 *
 * Displays a two-column layout on large screens: the left column features the title, descriptive text, and a static set of nickname badges; the right column shows a themed image, visible only on large screens.
 */
export default function Home() {
  return (
    <div className="lg:grid lg:grid-cols-2">
    <div className="flex items-center justify-center py-12">
      <div className="mx-auto grid w-[350px] gap-6">
        <h1 className="text-center text-3xl font-bold">Rastaflix</h1>
        <p className="text-center text-lg">
          Acompanhe as histórias do nosso querido Gabriel Scutasu
        </p>
        <p className="text-center text-lg">
          Também conhecido como
        </p>
        <div className="flex flex-wrap gap-4 items-center justify-center">
          <Badge variant="outline">PK</Badge>
          <Badge variant="outline">Charles Manson</Badge>
          <Badge variant="outline">Givaldo</Badge>
          <Badge variant="outline">Rasta</Badge>
          <Badge variant="outline">Ovelha</Badge>
          <Badge variant="outline">Tempero</Badge>
          <Badge variant="outline">Truman</Badge>
          <Badge variant="outline">Barão Vermelho</Badge>
          <Badge variant="outline">Rainhu</Badge>
          <Badge variant="outline">Arame liso</Badge>
          <Badge variant="outline">Professor maconha</Badge>
          <Badge variant="outline">Sazon</Badge>
          <Badge variant="outline">MVP</Badge>
          <Badge variant="outline">Lázaro</Badge>
          <Badge variant="outline">Geladeira de pobre</Badge>
          <Badge variant="outline">Chapeiro</Badge>
          <Badge variant="outline">Gonorasta</Badge>
          <Badge variant="outline">Voyeur</Badge>
          <Badge variant="outline">Tio Paulo</Badge>
          <Badge variant="outline">Tributera</Badge>
          <Badge variant="outline">Kiko</Badge>
          <Badge variant="outline">Branco</Badge>
          <Badge variant="outline">Múmia triste</Badge>
          <Badge variant="outline">Dono da bola</Badge>
          <Badge variant="outline">Noiado</Badge>  
        </div>
      </div>
    </div>
    <div className="hidden bg-muted lg:flex">
      <Image
        src="/hero.png"
        alt="Givaldo"
        width="900"
        height="900"
        className="max-h-[calc(100vh-4.375rem)] w-full object-cover dark:brightness-[0.4] dark:grayscale"
      />
    </div>
  </div>
  );
}
