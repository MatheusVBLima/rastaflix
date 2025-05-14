"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getInimigos } from "@/actions/inimigoActions";
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

export function Inimigos() {
  const {
    data: inimigos,
    isLoading,
    isError,
    error,
  } = useQuery<Inimigo[], Error>({
    queryKey: ["inimigos"],
    queryFn: getInimigos,
  });

  if (isLoading) {
    return (
      <div className="border rounded-md p-4">
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
      <Alert variant="destructive">
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
      <Alert>
        <AlertTitle>Mural de Inimigos Vazio</AlertTitle>
        <AlertDescription>
          Nenhum inimigo foi adicionado à lista ainda. Ou talvez todos já foram
          perdoados?
        </AlertDescription>
      </Alert>
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
                    inimigo.status === "vingado" ? "default" : "destructive"
                  }
                  className="text-xs font-medium px-2.5 py-1 whitespace-nowrap"
                >
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
