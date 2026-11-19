import Image from "next/image";

const NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

/**
 * Painel da marca no login: cor da paleta ativa, granulado e peças de
 * "vidro" (um vinil e dois cards) que lembram o conteúdo do site.
 */
export function AuthShowcase() {
  return (
    <aside
      className="relative isolate flex min-h-[28rem] flex-col justify-between overflow-hidden rounded-2xl p-8 text-white sm:p-10"
      style={{
        background:
          "radial-gradient(110% 75% at 85% 15%, color-mix(in oklch, var(--primary) 42%, oklch(0.18 0 0)), transparent 62%), linear-gradient(160deg, color-mix(in oklch, var(--primary) 34%, oklch(0.14 0 0)), color-mix(in oklch, var(--primary) 16%, oklch(0.09 0 0)))",
      }}
    >
      {/* granulado */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.18] mix-blend-overlay"
        style={{ backgroundImage: NOISE }}
      />

      <header className="space-y-4">
        <Image src="/logo.png" alt="" width={48} height={48} className="rounded-xl ring-1 ring-white/30" />
        <div className="space-y-1">
          <p className="font-display text-2xl font-semibold tracking-tight">RASTAFLIX</p>
          <p className="text-lg">
            Histórias <span className="text-white/75">que o dog</span> tenta esconder.
          </p>
        </div>
      </header>

      {/* Peças de vidro */}
      <div aria-hidden className="pointer-events-none absolute -right-10 bottom-24 h-80 w-96 [perspective:900px] sm:bottom-28">
        {/* vinil */}
        <div
          className="absolute right-6 top-0 size-60 rounded-full border border-white/30 backdrop-blur-md [transform:rotateX(18deg)_rotateY(-24deg)]"
          style={{
            background:
              "radial-gradient(circle, rgb(255 255 255 / 0.55) 0 7%, transparent 7.5% 15%, rgb(255 255 255 / 0.12) 15.5% 17%, transparent 17.5%), repeating-radial-gradient(circle, rgb(255 255 255 / 0.10) 0 1px, transparent 1px 6px), linear-gradient(135deg, rgb(255 255 255 / 0.28), rgb(255 255 255 / 0.04))",
            boxShadow: "inset 0 1px 0 rgb(255 255 255 / 0.5), 0 30px 60px -20px rgb(0 0 0 / 0.5)",
          }}
        />
        {/* card de trás */}
        <div
          className="absolute bottom-6 left-10 h-36 w-52 rounded-2xl border border-white/25 backdrop-blur-md [transform:rotateZ(-14deg)_rotateY(18deg)]"
          style={{
            background: "linear-gradient(135deg, rgb(255 255 255 / 0.26), rgb(255 255 255 / 0.05))",
            boxShadow: "inset 0 1px 0 rgb(255 255 255 / 0.45), 0 24px 50px -20px rgb(0 0 0 / 0.55)",
          }}
        >
          <div className="m-4 h-2 w-24 rounded-full bg-white/50" />
          <div className="mx-4 h-2 w-16 rounded-full bg-white/30" />
        </div>
        {/* card da frente, com play */}
        <div
          className="absolute bottom-0 left-36 flex h-32 w-44 items-center justify-center rounded-2xl border border-white/30 backdrop-blur-lg [transform:rotateZ(8deg)_rotateY(-12deg)]"
          style={{
            background: "linear-gradient(135deg, rgb(255 255 255 / 0.32), rgb(255 255 255 / 0.06))",
            boxShadow: "inset 0 1px 0 rgb(255 255 255 / 0.55), 0 24px 50px -16px rgb(0 0 0 / 0.55)",
          }}
        >
          <span className="flex size-12 items-center justify-center rounded-full bg-white/85 text-black/80">
            <svg viewBox="0 0 24 24" className="ml-0.5 size-5" fill="currentColor">
              <path d="M8 5.14v13.72a1 1 0 0 0 1.52.85l10.7-6.86a1 1 0 0 0 0-1.7L9.52 4.29A1 1 0 0 0 8 5.14Z" />
            </svg>
          </span>
        </div>
      </div>

      <footer className="grid gap-6 border-white/20 pt-6 text-sm sm:grid-cols-2 sm:divide-x sm:divide-white/20">
        <div className="space-y-1">
          <p className="font-medium">Primeiro acesso</p>
          <p className="text-white/80">Entrar com o Discord já cria sua conta.</p>
        </div>
        <div className="space-y-1 sm:pl-6">
          <p className="font-medium">Lives</p>
          <p className="text-white/80">
            <a href="https://twitch.tv/ovelhera" target="_blank" rel="noopener noreferrer" className="text-white underline-offset-4 hover:underline">
              Twitch
            </a>{" "}
            e{" "}
            <a href="https://kick.com/ovelheram" target="_blank" rel="noopener noreferrer" className="text-white underline-offset-4 hover:underline">
              Kick
            </a>
          </p>
        </div>
      </footer>
    </aside>
  );
}
