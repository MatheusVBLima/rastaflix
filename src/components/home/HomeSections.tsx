"use client";

import { BookTextIcon } from "@/components/icons/animated/book-text";
import { Disc3Icon } from "@/components/icons/animated/disc-3";
import { FlameIcon } from "@/components/icons/animated/flame";
import { ClapIcon } from "@/components/icons/animated/clap";
import { SparklesIcon } from "@/components/icons/animated/sparkles";
import { SmileIcon } from "@/components/icons/animated/smile";
import { HandFistIcon } from "@/components/icons/animated/hand-fist";
import { LayoutGridIcon } from "@/components/icons/animated/layout-grid";
import { Gamepad2Icon } from "@/components/icons/animated/gamepad-2";
import { SectionTile } from "./SectionTile";

/** Grade de seções da home: o acervo primeiro, depois os jogos e a comunidade. */
export function HomeSections() {
  return (
    <div className="space-y-10">
      <section aria-labelledby="acervo" className="space-y-4">
        <h2 id="acervo" className="text-sm font-medium text-muted-foreground">
          Conta aquela
        </h2>
        <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SectionTile
            href="/historias"
            slug="historias"
            title="Histórias"
            description="Histórias que o dog tenta esconder."
            icon={BookTextIcon}
            featured
            className="sm:col-span-2 lg:row-span-2"
          />
          <SectionTile href="/musicas" slug="musicas" title="Músicas" icon={Disc3Icon} />
          <SectionTile
            href="/esculachos"
            slug="esculachos"
            title="Esculachos"
            description="Trechos da live para ouvir e baixar."
            icon={FlameIcon}
          />
          <SectionTile
            href="/clipes"
            slug="clipes"
            title="Clipes"
            description="Twitch e Kick."
            icon={ClapIcon}
            className="sm:col-span-2"
          />
        </div>
      </section>

      <section aria-labelledby="universo" className="space-y-4">
        <h2 id="universo" className="text-sm font-medium text-muted-foreground">
          Universo Ovelhera
        </h2>
        <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SectionTile
            href="/jogos"
            slug="jogos"
            title="Jogos"
            description="Ilha do Avô Romeno e os jogos do universo."
            icon={Gamepad2Icon}
            featured
            className="sm:col-span-2 lg:col-span-4"
          />
          <SectionTile
            href="/rasta-awards"
            slug="rasta-awards"
            title="Rasta Awards"
            description="Vote nos melhores momentos do ano."
            icon={SparklesIcon}
          />
          <SectionTile
            href="/ovelhera-dle"
            slug="ovelhera-dle"
            title="Ovelhera DLE"
            description="Adivinhe a história pelos emojis."
            icon={SmileIcon}
          />
          <SectionTile
            href="/inimigos"
            slug="inimigos"
            title="Mural de Inimigos"
            description="Quem já foi vingado e quem ainda deve."
            icon={HandFistIcon}
          />
          <SectionTile
            href="/bingo"
            slug="bingo"
            title="Bingo Rastafari"
            description="Marque o que acontecer na live."
            icon={LayoutGridIcon}
          />
        </div>
      </section>
    </div>
  );
}
