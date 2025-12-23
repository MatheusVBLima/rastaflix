"use client";

import React from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Calendar, Shield, Clock } from "lucide-react";

interface UserProfileProps {
  isAdmin: boolean;
}

export function UserProfile({ isAdmin: initialIsAdmin }: UserProfileProps) {
  const { user, isLoaded } = useUser();

  // Usar useQuery para manter reatividade e consistência com o prefetch
  const { data: isAdmin } = useQuery({
    queryKey: ["userAdminStatus"],
    queryFn: async () => {
      const response = await fetch("/api/check-admin");
      const data = await response.json();
      return data.isAdmin;
    },
    initialData: initialIsAdmin,
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  if (!isLoaded) {
    return (
      <div className="container mx-auto py-12 px-4 max-w-4xl">
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-12 px-4 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>Você precisa estar logado para ver esta página.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const formatDate = (date: Date | number | null) => {
    if (!date) return "Não disponível";
    const dateObj = typeof date === "number" ? new Date(date) : date;
    return dateObj.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

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
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meu Perfil</h1>
          <p className="text-muted-foreground mt-2">
            Visualize suas informações e atividades na Rastaflix
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.imageUrl} alt={user.fullName || "Usuário"} />
                <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="text-2xl">{user.fullName || "Usuário"}</CardTitle>
                <CardDescription className="mt-1">
                  {user.primaryEmailAddress?.emailAddress}
                </CardDescription>
                <div className="flex gap-2 mt-2">
                  {isAdmin && (
                    <Badge variant="default">
                      <Shield className="h-3 w-3 mr-1" />
                      Administrador
                    </Badge>
                  )}
                  <Badge variant="outline">
                    {user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.verification.status === "verified" ? "Email Verificado" : "Email Não Verificado"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações da Conta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Email Principal</p>
                <p className="text-sm text-muted-foreground">
                  {user.primaryEmailAddress?.emailAddress}
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Nome de Usuário</p>
                <p className="text-sm text-muted-foreground">
                  {user.username || "Não definido"}
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Membro desde</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(user.createdAt)}
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Último acesso</p>
                <p className="text-sm text-muted-foreground">
                  {user.lastSignInAt ? formatDate(user.lastSignInAt) : "Nunca"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estatísticas</CardTitle>
            <CardDescription>
              Em breve você poderá ver suas atividades e contribuições na plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Histórias Favoritas</p>
                <p className="text-2xl font-bold mt-1">Em breve</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Votos em Awards</p>
                <p className="text-2xl font-bold mt-1">Em breve</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Conquistas</p>
                <p className="text-2xl font-bold mt-1">Em breve</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
