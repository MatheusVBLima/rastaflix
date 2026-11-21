"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, Palette, Shield } from "lucide-react";
import Link from "next/link";
import type { HeaderUser } from "@/lib/types";

interface UserMenuProps {
  isAdmin?: boolean;
  initialUser?: HeaderUser | null;
}

export function UserMenu({ isAdmin = false, initialUser = null }: UserMenuProps) {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  const resolvedUser = isLoaded
    ? user
      ? {
          fullName: user.fullName,
          email: user.primaryEmailAddress?.emailAddress ?? null,
          imageUrl: user.imageUrl,
        }
      : null
    : initialUser
      ? {
          fullName: initialUser.fullName,
          email: initialUser.email,
          imageUrl: initialUser.imageUrl,
        }
      : null;

  if (!resolvedUser) return null;

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          aria-label="Menu da conta"
          className="relative h-9 w-9 rounded-full"
        >
          <Avatar className="h-9 w-9">
            <AvatarImage src={resolvedUser.imageUrl} alt={resolvedUser.fullName || "Usuário"} />
            <AvatarFallback>{getInitials(resolvedUser.fullName)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{resolvedUser.fullName || "Usuário"}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {resolvedUser.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/perfil" className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            Meu perfil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/aparencia" className="cursor-pointer">
            <Palette className="mr-2 h-4 w-4" />
            Aparência
          </Link>
        </DropdownMenuItem>
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin" className="cursor-pointer">
                <Shield className="mr-2 h-4 w-4" />
                Admin
              </Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => signOut({ redirectUrl: "/" })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
