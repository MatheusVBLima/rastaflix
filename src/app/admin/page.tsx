import React from 'react';
import { redirect } from 'next/navigation';
import { auth, clerkClient } from '@clerk/nextjs/server';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Music, Zap, Users } from "lucide-react";

async function verificarAdminServerPage(): Promise<boolean> {
  const authState = await auth();
  if (!authState.userId) return false;
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(authState.userId);
    return user.privateMetadata?.is_admin === true;
  } catch { return false; }
}

export default async function AdminPage() {
  const isAdmin = await verificarAdminServerPage();
  if (!isAdmin) {
    redirect('/'); // Ou para uma página de "acesso negado"
  }
  
  const adminModules = [
    {
      title: "Gerenciar Histórias",
      description: "Adicionar, editar e excluir histórias do site.",
      icon: <BookOpen className="h-8 w-8 text-green-600" />,
      href: "/admin/historias",
    },
    {
      title: "Gerenciar Músicas",
      description: "Adicionar, editar e excluir músicas do site.",
      icon: <Music className="h-8 w-8 text-yellow-500" />,
      href: "/admin/musicas",
    },
    {
      title: "Gerenciar Esculachos",
      description: "Adicionar, editar e excluir esculachos do site.",
      icon: <Zap className="h-8 w-8 text-red-600" />,
      href: "/admin/esculachos",
    },
    {
      title: "Gerenciar Inimigos",
      description: "Adicionar, editar e excluir inimigos do site.",
      icon: <Users className="h-8 w-8 text-blue-600" />,
      href: "/admin/inimigos",
    },
  ];
  
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Painel de Administração</h1>
      <p className="text-muted-foreground mb-8">
        Bem-vindo ao painel de administração. Selecione um módulo para gerenciar:
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {adminModules.map((module) => (
          <Card key={module.title} className="flex flex-col h-full">
            <CardHeader>
              <div className="mb-4">{module.icon}</div>
              <CardTitle>{module.title}</CardTitle>
              <CardDescription>{module.description}</CardDescription>
            </CardHeader>
            <CardFooter className="mt-auto pt-0">
              <Button asChild className="w-full">
                <Link href={module.href}>Acessar</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
