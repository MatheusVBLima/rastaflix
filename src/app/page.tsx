import { Badge } from "@/components/ui/badge";
import { nicknames } from "@/data/nicknames";
import Image from "next/image";

/**
 * Homepage component that renders a responsive two-column landing layout for Rastaflix.
 *
 * Left column centers the title, descriptive text, and a list of nickname badges; the right column
 * displays a themed hero image that is visible only on large screens.
 *
 * @returns The homepage JSX element
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
          height={600}
          priority
          placeholder="blur"
          blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mM8c+ZMPQAHPgLI8aPJrAAAAABJRU5ErkJggg=="
          className="max-h-[calc(100vh-5.2rem)] w-full object-cover brightness-[0.4] grayscale"
        />
      </div>
    </div>
  );
}
