import { Badge } from "@/components/ui/badge";
import { nicknames } from "@/data/nicknames";
import Image from "next/image";

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
          <p className="text-center text-lg">Também conhecido como</p>
          <div className="flex flex-wrap gap-4 items-center justify-center">
            {nicknames.map((n) => (
              <Badge key={n} variant="outline">
                {n}
              </Badge>
            ))}
          </div>
        </div>
      </div>
      <div className="hidden bg-muted lg:flex">
        <Image
          src="/hero.png"
          alt="Foto de Gabriel 'Givaldo' Scutasu comendo açaí"
          width={900}
          height={900}
          className="max-h-[calc(100vh-4.375rem)] w-full object-cover dark:brightness-[0.4] dark:grayscale"
        />
      </div>
    </div>
  );
}
