"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchInimigos } from "@/lib/queries";
import { Inimigo } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Clock, Skull } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export function Inimigos() {
  // Usar useQuery que vai se hidratar com os dados pré-buscados no server
  const {
    data: inimigos,
    isLoading,
    isError,
    error,
  } = useQuery<Inimigo[], Error>({
    queryKey: ["inimigos"],
    queryFn: fetchInimigos,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const isMobile = useMediaQuery("(max-width: 767px)");

  if (isLoading) {
    if (isMobile) {
      return (
        <div className="space-y-4 max-w-2xl mx-auto">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="p-4 flex flex-col space-y-2 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-6 w-20 mt-2 sm:mt-0" />
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }
    return (
      <div className="border rounded-md p-4 max-w-2xl mx-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[70%]">Nome do Inimigo</TableHead>
              <TableHead className="text-right">Status da Vingança</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Skeleton className="h-5 w-3/4" />
                </TableCell>
                <TableCell className="text-right">
                  <Skeleton className="h-5 w-20 inline-block" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto">
        <AlertTitle>Erro ao Carregar Inimigos</AlertTitle>
        <AlertDescription>
          Não foi possível buscar a lista de inimigos. Detalhes:{" "}
          {error?.message}
        </AlertDescription>
      </Alert>
    );
  }

  if (!inimigos || inimigos.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <EmptyState
          icon={Skull}
          title="Mural de Inimigos Vazio"
          description="Nenhum inimigo foi adicionado à lista ainda. Ou talvez todos já foram perdoados?"
        />
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto px-4 md:px-6">
        {inimigos.map((inimigo) => (
          <Card key={inimigo.id}>
            <CardContent className="p-4 flex flex-col space-y-2 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
              <div className="font-medium">{inimigo.nome}</div>
              <Badge
                variant={inimigo.status === "vingado" ? "vingado" : "pendente"}
                className="font-medium px-3 py-1 whitespace-nowrap self-start sm:self-auto min-w-[100px]"
              >
                {inimigo.status == "vingado" ? <Skull /> : <Clock />}
                {inimigo.status.charAt(0).toUpperCase() +
                  inimigo.status.slice(1)}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="border rounded-md max-w-2xl mx-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[calc(100%-150px)] sm:w-[calc(100%-200px)]">
              Nome do Inimigo
            </TableHead>
            <TableHead className="text-right w-[150px] sm:w-[200px]">
              Status da Vingança
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {inimigos.map((inimigo) => (
            <TableRow key={inimigo.id}>
              <TableCell className="font-medium py-3">{inimigo.nome}</TableCell>
              <TableCell className="text-right py-3">
                <Badge
                  variant={
                    inimigo.status === "vingado" ? "vingado" : "pendente"
                  }
                  className="font-medium px-3 py-1 whitespace-nowrap min-w-[100px]"
                >
                  {inimigo.status == "vingado" ? <Skull /> : <Clock />}

                  {inimigo.status.charAt(0).toUpperCase() +
                    inimigo.status.slice(1)}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
