import Image from "next/image";
import Link from "next/link";
import { SignIn } from "@clerk/nextjs";
import { User } from "lucide-react";
import { PageTransition } from "@/components/layout/PageTransition";
import { AuthShowcase } from "@/components/auth/AuthShowcase";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * O formulário do Clerk sem a moldura própria: o card é a página.
 * Os estilos internos do Clerk não ficam em camada CSS e venceriam os
 * utilitários do Tailwind, por isso o `!` (important) aqui.
 */
const signInAppearance = {
  elements: {
    rootBox: "w-full!",
    cardBox: "w-full! shadow-none! border-0! rounded-none! bg-transparent!",
    card: "w-full! bg-transparent! shadow-none! border-0! p-0! gap-6!",
    header: "hidden!",
    footerAction: "hidden!",
    socialButtonsBlockButton:
      "h-11! rounded-lg! border! border-input! bg-background! shadow-xs! hover:bg-accent!",
    socialButtonsBlockButtonText: "text-sm! font-medium!",
    formButtonPrimary: "h-11! rounded-lg!",
  },
};

function SignInFallback() {
  return (
    <div className="w-full space-y-6" aria-busy="true" aria-label="Carregando formulário de entrada">
      <Skeleton className="h-11 w-full rounded-lg" />
      <div className="flex justify-center">
        <Skeleton className="h-4 w-36" />
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <PageTransition>
      <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center bg-muted/40 px-4 py-8">
        <div className="grid w-full max-w-6xl overflow-hidden rounded-3xl border bg-card p-2 shadow-xl lg:grid-cols-2">
          {/* Formulário */}
          <section className="flex min-h-[36rem] flex-col p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <Link href="/" className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Image src="/logo.png" alt="Rastaflix" width={36} height={36} className="rounded-full" />
              </Link>
              <Link
                href="/"
                className="rounded-md border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                Voltar ao site
              </Link>
            </div>

            <div className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-6 py-10">
              <span className="flex size-16 items-center justify-center rounded-full bg-muted/70 ring-8 ring-muted/30">
                <span className="flex size-11 items-center justify-center rounded-full border bg-background shadow-xs">
                  <User className="size-5 text-muted-foreground" aria-hidden />
                </span>
              </span>
              <div className="space-y-1.5 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">Entrar na sua conta</h1>
                <p className="text-sm text-muted-foreground">Use sua conta do Discord.</p>
              </div>
              <div className="w-full min-h-[6.25rem]">
                <SignIn appearance={signInAppearance} fallback={<SignInFallback />} />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <p>© {new Date().getFullYear()} Rastaflix</p>
              <ThemeSwitcher />
            </div>
          </section>

          {/* Marca */}
          <AuthShowcase />
        </div>
      </div>
    </PageTransition>
  );
}
