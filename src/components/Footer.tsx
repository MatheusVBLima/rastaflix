import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t py-8 text-sm text-muted-foreground">
      <div className="container mx-auto flex flex-col items-start justify-between gap-4 px-4 sm:flex-row sm:items-center md:px-6">
        <p>Rastaflix</p>
        <nav aria-label="Rodapé" className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <a
            href="https://twitch.tv/ovelhera"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground"
          >
            Twitch
          </a>
          <a
            href="https://kick.com/ovelheram"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground"
          >
            Kick
          </a>
          <Link
            href="/aparencia"
            className="transition-colors hover:text-foreground"
          >
            Aparência
          </Link>
        </nav>
      </div>
    </footer>
  );
}
