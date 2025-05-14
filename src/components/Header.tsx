"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { UserButton, SignedIn, SignedOut } from "@clerk/nextjs";
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
import { 
  MenuIcon, 
  BookOpen, 
  Music, 
  Zap, 
  Award, 
  Users, 
  Gamepad
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
    description: "Leia e crie contos e narrativas.",
    icon: <BookOpen className="h-6 w-6 text-green-600 mb-2" />,
  },
  {
    title: "Músicas",
    href: "/musicas",
    description: "Descubra e compartilhe novas músicas.",
    icon: <Music className="h-6 w-6 text-yellow-500 mb-2" />,
  },
  {
    title: "Esculachos",
    href: "/esculachos",
    description: "Momentos épicos e reviravoltas.",
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
    description: "Explore o universo expandido de Ovelhera.",
    icon: <Gamepad className="h-6 w-6 text-green-600 mb-2" />,
  },
  {
    title: "Inimigos",
    href: "/inimigos",
    description: "Conheça os antagonistas e desafios.",
    icon: <Users className="h-6 w-6 text-red-600 mb-2" />,
  },
  {
    title: "Awards",
    href: "/awards",
    description: "Celebrações e reconhecimentos da comunidade.",
    icon: <Award className="h-6 w-6 text-yellow-500 mb-2" />,
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
]

  


export function Header() {
  return (
    <header className="py-4 px-6 border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo à esquerda */}
        <div>
          <Link href="/" className="text-2xl font-bold">
            SeuLogo
          </Link>
        </div>

        {/* Navegação no centro com NavigationMenu */}
        <div className="hidden md:flex">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Conta Aquela</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] relative">
          
                    <li className="row-span-3">
                      <NavigationMenuLink asChild> 
                        <Link
                          className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-br from-green-700/80 via-yellow-600/80 to-red-700/80 p-6 no-underline outline-none focus:shadow-md transition-all duration-200 hover:shadow-xl hover:scale-[1.02] relative overflow-hidden"
                          href="/"
                        >
                       
                          <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-10 -translate-y-10 bg-yellow-400 opacity-15 rounded-full"></div>
                          <div className="absolute bottom-0 left-0 w-24 h-24 transform -translate-x-8 translate-y-8 bg-green-500 opacity-15 rounded-full"></div>
                          
                          <div className="mb-2 mt-4 text-xl font-bold text-white">
                            Rastaflix
                          </div>
                          <p className="text-sm leading-tight text-white/90">
                            Sua plataforma de entretenimento e comunidade.
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    {criarDescobrirComponents.map((component) => (
                      <ListItem
                        key={component.title}
                        title={component.title}
                        href={component.href}
                        icon={component.icon}
                      >
                        {component.description}
                      </ListItem>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Universo Ovelhera</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] relative">
                    
    
                    {universoOvelheraComponents.map((component) => (
                      <ListItem
                        key={component.title}
                        title={component.title}
                        href={component.href}
                        icon={component.icon}
                      >
                        {component.description}
                      </ListItem>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Admin</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] relative">
                      {adminComponents.map((component) => (
                        <ListItem
                          key={component.title}
                          title={component.title}
                          href={component.href}
                          icon={component.icon}
                      >
                        {component.description}
                      </ListItem>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* UserButton à direita */}
        <div className="flex items-center gap-4">
          <ThemeSwitcher />
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <SignedOut>
            <Button variant="outline" asChild>
              <Link href="/sign-in">Login</Link>
            </Button>

            <Button variant="outline" asChild>
              <Link href="/sign-up">Sign Up</Link>
            </Button>
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
                <nav className="flex flex-col gap-2">
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
                  <SheetClose asChild>
                    <Link
                      href="/admin"
                      className="py-2 px-3 mx-2 rounded-md hover:bg-accent"
                    >
                      Admin
                    </Link>
                  </SheetClose>
                  <Separator />
                  <h4 className="py-1 px-3 text-sm font-semibold text-muted-foreground tracking-wider uppercase">
                    Gerenciamento
                  </h4>
                  <SheetClose asChild>
                    <Link
                      href="/admin/historias"
                      className="block py-2 px-3 mx-2 rounded-md hover:bg-accent"
                    >
                      Gerenciar Histórias
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      href="/admin/musicas"
                      className="block py-2 px-3 mx-2 rounded-md hover:bg-accent"
                    >
                      Gerenciar Músicas
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      href="/admin/esculachos"
                      className="block py-2 px-3 mx-2 rounded-md hover:bg-accent"
                    >
                      Gerenciar Esculachos
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      href="/admin/inimigos"
                      className="block py-2 px-3 mx-2 rounded-md hover:bg-accent"
                    >
                      Gerenciar Inimigos
                    </Link>
                  </SheetClose>
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
  }
>(({ className, title, children, href, icon, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          href={href}
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          {icon}
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";
