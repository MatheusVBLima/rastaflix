import Image from "next/image";
import heroImg from "../../public/hero.png";
import { PageTransition } from "@/components/layout/PageTransition";
import { NicknameMarquee } from "@/components/home/NicknameMarquee";
import { HomeSections } from "@/components/home/HomeSections";

export default function Home() {
  return (
    <PageTransition name="route-home">
      <div>
        {/* Hero */}
        <section className="relative isolate overflow-hidden border-b">
          <div className="relative overflow-hidden">
            <div className="container relative mx-auto grid grid-cols-1 items-center gap-4 px-4 pt-8 md:min-h-[24rem] md:grid-cols-12 md:gap-6 md:px-6 md:pt-0 lg:min-h-[28rem]">
              <div className="relative z-10 md:col-span-5 md:py-12 lg:py-16">
                <h1 className="font-display text-5xl font-semibold leading-[0.9] tracking-[-0.04em] sm:text-6xl md:text-6xl lg:text-[4.75rem] xl:text-[5.75rem]">
                  Rastaflix
                </h1>
                <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg md:mt-6 md:text-xl">
                  As histórias do nosso querido Gabriel Scutasu, também conhecido como
                </p>
              </div>

              <div className="relative flex items-end justify-center md:col-span-7 md:h-full md:min-h-[24rem] md:justify-end lg:min-h-[28rem]">
                <Image
                  src={heroImg}
                  alt="Gabriel Scutasu (Ovelhera)"
                  priority
                  sizes="(max-width: 768px) 100vw, 60vw"
                  className="pointer-events-none h-auto w-full max-w-[26rem] translate-y-4 select-none object-contain drop-shadow-[0_18px_32px_rgba(0,0,0,0.4)] sm:max-w-[30rem] sm:translate-y-5 md:max-w-[36rem] md:translate-y-6 lg:max-w-[43rem] lg:translate-y-7"
                />
              </div>
            </div>
          </div>

          {/* Em telas muito largas o muro acompanha o conteúdo e esmaece nas pontas */}
          <div className="relative z-10 min-[120rem]:mx-auto min-[120rem]:max-w-[112rem] min-[120rem]:[mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
            <NicknameMarquee />
          </div>
        </section>

        <div className="container mx-auto px-4 py-10 md:px-6 md:py-12">
          <HomeSections />
        </div>
      </div>
    </PageTransition>
  );
}
