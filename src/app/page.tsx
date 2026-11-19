import Image from "next/image";
import heroImg from "../../public/hero.png";
import { PageTransition } from "@/components/layout/PageTransition";
import { NicknameMarquee } from "@/components/home/NicknameMarquee";
import { HomeSections } from "@/components/home/HomeSections";

export default function Home() {
  return (
    <PageTransition>
      <div>
        {/* Hero */}
        <section className="relative isolate overflow-hidden border-b">
          {/* Glow sutil atrás do retrato para destacar cabelo e silhueta no tema escuro */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_55%_70%_at_72%_50%,color-mix(in_oklab,var(--primary)_22%,transparent),transparent_72%)]"
          />

          <div className="relative overflow-hidden">
            <div className="container relative mx-auto grid grid-cols-1 items-center gap-4 px-4 pt-10 md:min-h-[27.5rem] md:grid-cols-12 md:gap-6 md:px-6 md:pt-0 lg:min-h-[32.5rem]">
              <div className="relative z-10 md:col-span-5 md:py-16 lg:py-20">
                <h1 className="font-display text-5xl font-semibold leading-[0.9] tracking-[-0.04em] sm:text-6xl md:text-6xl lg:text-[4.75rem] xl:text-[5.75rem]">
                  Rastaflix
                </h1>
                <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg md:mt-6 md:text-xl">
                  As histórias do nosso querido Gabriel Scutasu, também conhecido como
                </p>
              </div>

              <div className="relative flex items-end justify-center md:col-span-7 md:h-full md:min-h-[27.5rem] md:justify-end lg:min-h-[32.5rem]">
                {/* Rim light suave atrás das cabeças para separar do fundo escuro */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 left-1/2 -z-10 h-64 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground/[0.08] blur-3xl md:h-80 md:w-[26rem] lg:h-96 lg:w-[32rem]"
                />
                <Image
                  src={heroImg}
                  alt="Gabriel Scutasu (Ovelhera)"
                  priority
                  sizes="(max-width: 768px) 100vw, 60vw"
                  className="pointer-events-none h-auto w-full max-w-[27.5rem] translate-y-4 select-none object-contain drop-shadow-[0_20px_36px_rgba(0,0,0,0.45)] sm:max-w-[32.5rem] sm:translate-y-5 md:max-w-[38.75rem] md:translate-y-7 lg:max-w-[46.25rem] lg:translate-y-8"
                />
              </div>
            </div>
          </div>

          {/* Em telas muito largas o muro acompanha o conteúdo e esmaece nas pontas */}
          <div className="relative z-10 min-[120rem]:mx-auto min-[120rem]:max-w-[112rem] min-[120rem]:[mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
            <NicknameMarquee />
          </div>
        </section>

        <div className="container mx-auto px-4 py-12 md:px-6">
          <HomeSections />
        </div>
      </div>
    </PageTransition>
  );
}
