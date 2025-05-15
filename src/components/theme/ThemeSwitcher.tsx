"use client";

import * as React from "react";
import { Bot, Coffee, Moon, Star, Sun, Sunset } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  const getThemeIcon = () => {
    switch (theme) {
      case "dark":
        return <Moon className="h-[1.2rem] w-[1.2rem]" />;
      case "vercel":
        return <Coffee className="h-[1.2rem] w-[1.2rem]" />;
      case "cosmic":
        return <Star className="h-[1.2rem] w-[1.2rem]" />;
      case "system":
        return <Bot className="h-[1.2rem] w-[1.2rem]" />;
      case "tangerine":
        return <Sunset className="h-[1.2rem] w-[1.2rem]" />;

      default:
        return <Sun className="h-[1.2rem] w-[1.2rem]" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          {getThemeIcon()}
          <span className="sr-only">Trocar tema</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("vercel")}>
          Vercel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("cosmic")}>
          Cosmic
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("tangerine")}>
          Tangerine
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
