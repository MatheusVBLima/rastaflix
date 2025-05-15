"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  UserButton,
  SignedIn,
  SignedOut,
  useUser,
  ClerkLoading,
  ClerkLoaded,
} from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "./ui/separator";
import { Skeleton } from "./ui/skeleton";
import {
  MenuIcon,
  BookOpen,
  Music,
  Zap,
  Award,
  Users,
  Gamepad,
  Lock,
} from "lucide-react";

const criarDescobrirComponents: {
  title: string;
  href: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    title: "Histórias",
    href: "/historias",
    description: "Histórias que o dog tenta esconder",
    icon: <BookOpen className="h-6 w-6 text-green-600 mb-2" />,
  },
  {
    title: "Músicas",
    href: "/musicas",
    description: "Descubra e compartilhe novas músicas",
    icon: <Music className="h-6 w-6 text-yellow-500 mb-2" />,
  },
  {
    title: "Esculachos",
    href: "/esculachos",
    description: "Momentos épicos da live",
    icon: <Zap className="h-6 w-6 text-red-600 mb-2" />,
  },
];

const universoOvelheraComponents: {
  title: string;
  href: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    title: "Ovelhera DLE",
    href: "/ovelhera-dle",
    description: "Diga qual a história de acordo com os emojis",
    icon: <Gamepad className="h-6 w-6 text-green-600 mb-2" />,
  },
  {
    title: "Inimigos",
    href: "/inimigos",
    description: "Conheça os antagonistas dessa jornada rastafari",
    icon: <Users className="h-6 w-6 text-red-600 mb-2" />,
  },
];

const adminComponents: {
  title: string;
  href: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    title: "Gerenciar Histórias",
    href: "/admin/historias",
    description: "Gerencie as histórias existentes.",
    icon: <BookOpen className="h-6 w-6 text-green-600 mb-2" />,
  },
  {
    title: "Gerenciar Músicas",
    href: "/admin/musicas",
    description: "Gerencie as músicas existentes.",
    icon: <Music className="h-6 w-6 text-yellow-500 mb-2" />,
  },
  {
    title: "Gerenciar Esculachos",
    href: "/admin/esculachos",
    description: "Gerencie os esculachos existentes.",
    icon: <Zap className="h-6 w-6 text-red-600 mb-2" />,
  },
  {
    title: "Gerenciar Inimigos",
    href: "/admin/inimigos",
    description: "Gerencie os inimigos existentes.",
    icon: <Users className="h-6 w-6 text-red-600 mb-2" />,
  },
];

/**
 * Renders the main navigation header with responsive menus, authentication-aware UI, and dynamic admin controls.
 *
 * Displays categorized navigation menus, a logo, theme switcher, and user authentication controls. Admin-specific menu items are shown only for authenticated users with admin privileges, determined asynchronously. The header adapts for mobile devices with a collapsible menu.
 *
 * @remark Admin menu visibility is determined by fetching `/api/check-admin` whenever the user changes. If the check fails or the user is not authenticated, admin controls are hidden.
 */
export function Header() {
  const { user } = useUser();
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = React.useState(false);

  React.useEffect(() => {
    if (user) {
      setIsCheckingAdmin(true);
      const checkAdminStatus = async () => {
        try {
          const response = await fetch("/api/check-admin");
          if (response.ok) {
            const data = await response.json();
            setIsAdmin(data.isAdmin);
          } else {
            setIsAdmin(false);
          }
          setIsCheckingAdmin(false);
        } catch (error) {
          console.error("Erro ao verificar status de admin:", error);
          setIsAdmin(false);
          setIsCheckingAdmin(false);
        }
      };
      checkAdminStatus();
    } else {
      setIsAdmin(false);
      setIsCheckingAdmin(false);
    }
  }, [user]);

  return (
    <header className="py-4 px-6 border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo à esquerda */}
        <div>
          <Link href="/" className="text-2xl font-bold">
            <Image
              src="/logo.png"
              alt="Logotipo Rastaflix"
              width={50}
              height={50}
              className="rounded-full"
            />
          </Link>
        </div>

        {/* Navegação no centro com NavigationMenu */}
        <div className="hidden md:flex items-center">
          <NavigationMenu className="mr-4">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Conta Aquela</NavigationMenuTrigger>
                <NavigationMenuContent className="bg-background/40">
                  <ul className="grid w-[400px] gap-2 p-1 md:w-[500px] md:grid-cols-2 lg:w-[600px] relative">
                    <li className="row-span-3">
                      <NavigationMenuLink asChild>
                        <Link
                          className="flex h-full w-full select-none flex-col justify-end rounded-md p-6 no-underline outline-none focus:shadow-md transition-all duration-200 hover:shadow-xl hover:scale-[1.02] relative overflow-hidden"
                          href="/"
                          style={{
                            backgroundImage:
                              "url('/Glowing Star Abstract.jpeg')",
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }}
                        >
                          <div className="absolute inset-0 bg-black/25 rounded-md"></div>
                          <div className="relative z-10">
                            <div className="mb-2 mt-4 text-xl font-bold text-white">
                              Rastaflix
                            </div>
                            <p className="text-sm leading-tight text-white/90">
                              Sua plataforma de entretenimento e comunidade.
                            </p>
                          </div>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    {criarDescobrirComponents.map((component) => (
                      <ListItem
                        key={component.title}
                        title={component.title}
                        href={component.href}
                        icon={component.icon}
                        backgroundImage="/Sweeping Light Arc.jpeg"
                        className="bg-cover bg-center"
                      >
                        {component.description}
                      </ListItem>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Universo Ovelhera</NavigationMenuTrigger>
                <NavigationMenuContent className="bg-background/40">
                  <ul className="grid w-[400px] gap-2 p-1 md:w-[500px] md:grid-cols-2 lg:w-[600px] relative">
                    {universoOvelheraComponents.map((component) => (
                      <ListItem
                        key={component.title}
                        title={component.title}
                        href={component.href}
                        icon={component.icon}
                        backgroundImage="/Glowing Star Abstract.jpeg"
                      >
                        {component.description}
                      </ListItem>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
          <ClerkLoading>
            <Skeleton className="h-8 w-20" />
          </ClerkLoading>

          <SignedIn>
            {isCheckingAdmin ? (
              <Skeleton className="h-8 w-20" />
            ) : isAdmin ? (
              <ClerkLoaded>
                <NavigationMenu>
                  <NavigationMenuList>
                    <NavigationMenuItem>
                      <NavigationMenuTrigger>Admin</NavigationMenuTrigger>
                      <NavigationMenuContent className="bg-background/40">
                        <ul className="grid w-[400px] gap-2 p-1 md:w-[500px] md:grid-cols-2 lg:w-[600px] relative">
                          {adminComponents.map((component) => (
                            <ListItem
                              key={component.title}
                              title={component.title}
                              href={component.href}
                              icon={component.icon}
                              backgroundImage="/Glowing Star Abstract.jpeg"
                            >
                              {component.description}
                            </ListItem>
                          ))}
                        </ul>
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                  </NavigationMenuList>
                </NavigationMenu>
              </ClerkLoaded>
            ) : null}
          </SignedIn>
        </div>

        {/* UserButton e Tema à direita */}
        <div className="flex items-center gap-4">
          <ThemeSwitcher />
          <ClerkLoading>
            <Skeleton className="h-8 w-8 rounded-full" />
          </ClerkLoading>

          <SignedIn>
            <ClerkLoaded>
              <UserButton afterSignOutUrl="/" />
            </ClerkLoaded>
          </SignedIn>
          <SignedOut>
            <ClerkLoaded>
              <Button variant="outline" asChild size="sm">
                <Link href="/sign-in">
                  <Lock /> Admin Login
                </Link>
              </Button>
            </ClerkLoaded>
          </SignedOut>

          {/* Menu Mobile */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <MenuIcon />
                  <span className="sr-only">Abrir menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle className="text-left">Navegação</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-2 py-4">
                  <Separator />
                  <h4 className="py-1 px-3 text-sm font-semibold text-muted-foreground tracking-wider uppercase">
                    Conta Aquela
                  </h4>
                  {criarDescobrirComponents.map((item) => (
                    <SheetClose asChild key={item.href}>
                      <Link
                        href={item.href}
                        className="block py-2 px-3 mx-2 rounded-md hover:bg-accent"
                      >
                        {item.title}
                      </Link>
                    </SheetClose>
                  ))}
                  <Separator />
                  <h4 className="py-1 px-3 text-sm font-semibold text-muted-foreground tracking-wider uppercase">
                    Universo Ovelhera
                  </h4>
                  {universoOvelheraComponents.map((item) => (
                    <SheetClose asChild key={item.href}>
                      <Link
                        href={item.href}
                        className="block py-2 px-3 mx-2 rounded-md hover:bg-accent"
                      >
                        {item.title}
                      </Link>
                    </SheetClose>
                  ))}
                  <Separator />
                  <ClerkLoaded>
                    <SignedIn>
                      {isAdmin && (
                        <>
                          <SheetClose asChild>
                            <Link
                              href="/admin"
                              className="block py-2 px-3 mx-2 rounded-md hover:bg-accent text-sm font-medium"
                            >
                              Painel Admin
                            </Link>
                          </SheetClose>
                          {adminComponents.map((item) => (
                            <SheetClose asChild key={item.href}>
                              <Link
                                href={item.href}
                                className="block py-2 px-3 mx-2 rounded-md hover:bg-accent text-sm"
                              >
                                {item.title}
                              </Link>
                            </SheetClose>
                          ))}
                          <Separator />
                        </>
                      )}
                    </SignedIn>
                  </ClerkLoaded>
                  <ClerkLoaded>
                    <SignedIn>
                      <SheetClose asChild>
                        <Link
                          href="/user-profile"
                          className="block py-2 px-3 mx-2 rounded-md hover:bg-accent text-sm font-medium"
                        >
                          Meu Perfil
                        </Link>
                      </SheetClose>
                    </SignedIn>
                    <SignedOut>
                      <SheetClose asChild>
                        <Link
                          href="/sign-in"
                          className="block py-2 px-3 mx-2 rounded-md hover:bg-accent text-sm font-medium"
                        >
                          <Lock className="mr-2 h-4 w-4 inline-block" /> Admin
                          Login
                        </Link>
                      </SheetClose>
                    </SignedOut>
                  </ClerkLoaded>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  Omit<React.ComponentPropsWithoutRef<typeof Link>, "href"> & {
    href: string;
    title: string;
    icon?: React.ReactNode;
    backgroundImage?: string;
  }
>(
  (
    { className, title, children, href, icon, backgroundImage, ...props },
    ref
  ) => {
    return (
      <li>
        <NavigationMenuLink asChild>
          <Link
            href={href}
            ref={ref}
            className={cn(
              "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:shadow-lg hover:scale-[1.02] bg-card",
              className
            )}
            style={{
              ...(props as { style?: React.CSSProperties }).style,
              ...(backgroundImage
                ? {
                    backgroundImage: `url(${backgroundImage})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    position: "relative",
                  }
                : {}),
            }}
            {...props}
          >
            {backgroundImage && (
              <div className="absolute inset-0" style={{ zIndex: 0 }}></div>
            )}
            <div className="relative z-10">
              {icon}
              <div className="text-sm font-medium leading-none mb-1">
                {title}
              </div>
              <p className="line-clamp-2 text-sm leading-snug">{children}</p>
            </div>
          </Link>
        </NavigationMenuLink>
      </li>
    );
  }
);
ListItem.displayName = "ListItem";
