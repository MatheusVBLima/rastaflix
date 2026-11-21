import Image from "next/image";
import { SignIn } from "@clerk/nextjs";
import { PageTransition } from "@/components/layout/PageTransition";
import { AuthShowcase } from "@/components/auth/AuthShowcase";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * O formulário do Clerk sem a moldura própria: o card é a página.
 * Os estilos internos do Clerk não ficam em camada CSS e venceriam os
 * utilitários do Tailwind, por isso o `!` (important) aqui.
 */
const signInAppearance = {
  layout: {
    unsafe_disableDevelopmentModeWarnings: true,
  },
  elements: {
    rootBox: "w-full!",
    cardBox: "w-full! shadow-none! border-0! rounded-none! bg-transparent!",
    card: "w-full! bg-transparent! shadow-none! border-0! p-0! gap-6!",
    header: "hidden!",
    footer: "hidden!",
    footerAction: "hidden!",
    socialButtonsBlockButton:
      "h-11! rounded-lg! border! border-input! bg-background! shadow-xs! hover:bg-accent!",
    socialButtonsBlockButtonText: "text-sm! font-medium!",
    formButtonPrimary: "h-11! rounded-lg!",
  },
};

function SignInFallback() {
  return (
    <div className="w-full" aria-busy="true" aria-label="Carregando formulário de entrada">
      <Skeleton className="h-11 w-full rounded-lg" />
    </div>
  );
}

export default function SignInPage() {
  return (
    <PageTransition name="route-sign-in">
      <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center bg-muted/40 px-4 py-8">
        <div className="grid w-full max-w-6xl overflow-hidden rounded-3xl border bg-card p-2 shadow-xl lg:grid-cols-2">
          {/* Formulário */}
          <section className="flex min-h-[36rem] flex-col items-center justify-center p-6 sm:p-8">
            <div className="mx-auto flex w-full max-w-sm flex-col items-center justify-center gap-6 py-10">
              <Image
                src="/logo.png"
                alt="Rastaflix"
                width={56}
                height={56}
                className="rounded-full ring-1 ring-border"
                priority
              />
              <div className="space-y-1.5 text-center">
                <h1 className="font-display text-2xl font-semibold tracking-tight">
                  Entrar na sua conta
                </h1>
                <p className="text-sm text-muted-foreground">Use sua conta do Discord.</p>
              </div>
              <div className="w-full min-h-11">
                <SignIn appearance={signInAppearance} fallback={<SignInFallback />} />
              </div>
            </div>
          </section>

          {/* Marca */}
          <AuthShowcase />
        </div>
      </div>
    </PageTransition>
  );
}
