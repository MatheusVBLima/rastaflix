"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Show, ClerkLoading, ClerkLoaded } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "./ui/skeleton";
import { LiveIndicator } from "./LiveIndicator";
import { UserMenu } from "./UserMenu";
import { prefetchRouteData } from "@/lib/prefetch";
import { useAnimatedIcon, type AnimatedIconHandle } from "@/hooks/use-animated-icon";
import { BookTextIcon } from "@/components/icons/animated/book-text";
import { Disc3Icon } from "@/components/icons/animated/disc-3";
import { FlameIcon } from "@/components/icons/animated/flame";
import { ClapIcon } from "@/components/icons/animated/clap";
import { SparklesIcon } from "@/components/icons/animated/sparkles";
import { SmileIcon } from "@/components/icons/animated/smile";
import { HandFistIcon } from "@/components/icons/animated/hand-fist";
import { LayoutGridIcon } from "@/components/icons/animated/layout-grid";
import { Gamepad2Icon } from "@/components/icons/animated/gamepad-2";
import { MenuIcon } from "@/components/icons/animated/menu";

type AnimatedIcon = React.ComponentType<
  { size?: number; className?: string; "aria-hidden"?: boolean } & React.RefAttributes<AnimatedIconHandle>
>;

interface NavItem {
  title: string;
  href: string;
  description?: string;
  icon: AnimatedIcon;
}

const contaAquela: NavItem[] = [
  { title: "Histórias", href: "/historias", description: "O acervo de histórias", icon: BookTextIcon },
  { title: "Músicas", href: "/musicas", icon: Disc3Icon },
  { title: "Esculachos", href: "/esculachos", description: "Áudios para ouvir e baixar", icon: FlameIcon },
  { title: "Clipes", href: "/clipes", description: "Twitch e Kick", icon: ClapIcon },
];

const universoOvelhera: NavItem[] = [
  { title: "Jogos", href: "/jogos", description: "Roguelike 3D e mais", icon: Gamepad2Icon },
  { title: "Rasta Awards", href: "/rasta-awards", description: "Votação anual", icon: SparklesIcon },
  { title: "Ovelhera DLE", href: "/ovelhera-dle", description: "Adivinhe pelos emojis", icon: SmileIcon },
  { title: "Inimigos", href: "/inimigos", description: "O mural da vingança", icon: HandFistIcon },
  { title: "Bingo Rastafari", href: "/bingo", description: "Cartela da live", icon: LayoutGridIcon },
];

interface HeaderProps {
  isAdmin: boolean;
}

const subscribeNoop = () => () => {};

export function Header({ isAdmin }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const timeout = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const runPrefetch = React.useCallback(
    (href: string) => {
      router.prefetch(href);
      void prefetchRouteData(href);
    },
    [router]
  );

  const prefetch = React.useCallback(
    (href: string) => {
      clearTimeout(timeout.current);
      timeout.current = setTimeout(() => runPrefetch(href), 300);
    },
    [runPrefetch]
  );

  const prefetchNow = React.useCallback(
    (href: string) => {
      clearTimeout(timeout.current);
      runPrefetch(href);
    },
    [runPrefetch]
  );

  const mounted = React.useSyncExternalStore(subscribeNoop, () => true, () => false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const groupActive = (items: NavItem[]) => items.some((i) => isActive(i.href));

  return (
    <header
      className="glass-bar sticky top-0 z-50"
      style={{ viewTransitionName: "site-header" }}
    >
      <div className="container mx-auto flex h-16 items-center gap-4 px-4 md:px-6">
        <Link
          href="/"
          transitionTypes={pathname === "/" ? undefined : ["nav-back"]}
          className="flex items-center gap-2.5 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Image
            src="/logo.png"
            alt=""
            width={36}
            height={36}
            className="rounded-full"
            priority
          />
          <span className="font-display text-lg font-semibold tracking-tight">Rastaflix</span>
        </Link>

        {/* Desktop */}
        <nav aria-label="Principal" className="hidden flex-1 items-center md:flex">
          <NavigationMenu viewport={false} className="ml-4">
            <NavigationMenuList>
              <NavGroup
                label="Conta aquela"
                items={contaAquela}
                active={groupActive(contaAquela)}
                isActive={isActive}
                onPrefetch={prefetch}
                onPrefetchNow={prefetchNow}
              />
              <NavGroup
                label="Universo Ovelhera"
                items={universoOvelhera}
                active={groupActive(universoOvelhera)}
                isActive={isActive}
                onPrefetch={prefetch}
                onPrefetchNow={prefetchNow}
              />
            </NavigationMenuList>
          </NavigationMenu>
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <LiveIndicator />
          {/* O estado do Clerk só existe no cliente: até montar, mostra o skeleton
              (o servidor renderiza o mesmo, então não há erro de hidratação). */}
          {!mounted ? (
            <Skeleton className="size-9 rounded-full" />
          ) : (
            <>
              <ClerkLoading>
                <Skeleton className="size-9 rounded-full" />
              </ClerkLoading>
              <ClerkLoaded>
                <Show when="signed-in">
                  <UserMenu isAdmin={isAdmin} />
                </Show>
                <Show when="signed-out">
                  <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex">
                    <Link href="/sign-in">Entrar</Link>
                  </Button>
                </Show>
              </ClerkLoaded>
            </>
          )}
          <MobileMenu
            isActive={isActive}
            onPrefetch={prefetch}
            onPrefetchNow={prefetchNow}
          />
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */

function NavGroup({
  label,
  items,
  active,
  isActive,
  onPrefetch,
  onPrefetchNow,
}: {
  label: string;
  items: NavItem[];
  active: boolean;
  isActive: (href: string) => boolean;
  onPrefetch: (href: string) => void;
  onPrefetchNow: (href: string) => void;
}) {
  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger
        className={cn("relative border-0 bg-transparent shadow-none dark:bg-transparent", active && "text-foreground after:absolute after:inset-x-3 after:-bottom-[13px] after:h-0.5 after:rounded-full after:bg-primary")}
      >
        {label}
      </NavigationMenuTrigger>
      <NavigationMenuContent>
        <ul className="grid w-[30rem] grid-cols-2 gap-1 p-1">
          {items.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={isActive(item.href)}
              onPrefetch={onPrefetch}
              onPrefetchNow={onPrefetchNow}
            />
          ))}
        </ul>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
}

function NavLink({
  item,
  active,
  onPrefetch,
  onPrefetchNow,
}: {
  item: NavItem;
  active: boolean;
  onPrefetch: (href: string) => void;
  onPrefetchNow: (href: string) => void;
}) {
  const icon = useAnimatedIcon<AnimatedIconHandle>();
  const Icon = item.icon;

  return (
    <li>
      <NavigationMenuLink asChild active={active}>
        <Link
          href={item.href}
          aria-current={active ? "page" : undefined}
          onMouseEnter={() => {
            icon.handlers.onMouseEnter();
            onPrefetch(item.href);
          }}
          onMouseLeave={icon.handlers.onMouseLeave}
          onFocus={() => {
            icon.handlers.onFocus();
            onPrefetchNow(item.href);
          }}
          onBlur={icon.handlers.onBlur}
          className="flex flex-row items-start gap-3 rounded-md p-3 transition-colors hover:bg-accent focus:bg-accent data-[active=true]:bg-accent/60"
        >
          <Icon ref={icon.ref} size={18} aria-hidden className="mt-0.5 shrink-0 text-primary" />
          <span className="space-y-1">
            <span className="block text-sm font-medium leading-none">{item.title}</span>
            {item.description && (
              <span className="block text-sm leading-snug text-muted-foreground">
                {item.description}
              </span>
            )}
          </span>
        </Link>
      </NavigationMenuLink>
    </li>
  );
}

/* ------------------------------------------------------------------ */

function MobileMenu({
  isActive,
  onPrefetch,
  onPrefetchNow,
}: {
  isActive: (href: string) => boolean;
  onPrefetch: (href: string) => void;
  onPrefetchNow: (href: string) => void;
}) {
  const menu = useAnimatedIcon<AnimatedIconHandle>();

  const group = (title: string, items: NavItem[]) => (
    <div className="space-y-1">
      <p className="px-3 text-xs font-medium text-muted-foreground">{title}</p>
      {items.map((item) => (
        <SheetClose asChild key={item.href}>
          <Link
            href={item.href}
            aria-current={isActive(item.href) ? "page" : undefined}
            onMouseEnter={() => onPrefetch(item.href)}
            onFocus={() => onPrefetchNow(item.href)}
            className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent aria-[current=page]:bg-accent aria-[current=page]:text-foreground"
          >
            <item.icon size={18} aria-hidden className="text-primary" />
            {item.title}
          </Link>
        </SheetClose>
      ))}
    </div>
  );

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menu" {...menu.handlers}>
          <MenuIcon ref={menu.ref} size={20} aria-hidden />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] overflow-y-auto sm:w-[360px]">
        <SheetHeader>
          <SheetTitle className="text-left font-display">Rastaflix</SheetTitle>
        </SheetHeader>
        <nav aria-label="Principal" className="flex flex-col gap-6 px-2 pb-6">
          {group("Conta aquela", contaAquela)}
          {group("Universo Ovelhera", universoOvelhera)}
          <ClerkLoaded>
            <Show when="signed-out">
              <SheetClose asChild>
                <Button asChild variant="outline" className="mx-3">
                  <Link href="/sign-in">Entrar</Link>
                </Button>
              </SheetClose>
            </Show>
          </ClerkLoaded>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
