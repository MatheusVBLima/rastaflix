"use client";

import React, { useState, useTransition, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { editClipe } from "@/actions/clipesActions";
import { fetchClipeById, fetchClipes } from "@/lib/queries";
import type { Clipe, ClipeActionResponse, EditClipeFormData } from "@/lib/types";
import { EditClipeSchema } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, PencilIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export function EditClipeForm() {
  const [clipeIdToEdit, setClipeIdToEdit] = useState<string>("");
  const [isLoadingClipe, setIsLoadingClipe] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const router = useRouter();
  const queryClient = useQueryClient();

  const [isEditPending, startEditTransition] = useTransition();

  const { data: clipes, isLoading } = useQuery<Clipe[]>({
    queryKey: ["clipes"],
    queryFn: fetchClipes,
    staleTime: Infinity,
  });

  const form = useForm<EditClipeFormData>({
    resolver: zodResolver(EditClipeSchema),
    defaultValues: {
      id: "",
      titulo: "",
      url: "",
      thumbnail_url: "",
      plataforma: "twitch",
    },
    mode: "onChange",
  });

  const handleLoadClipe = useCallback(
    async (idToLoad?: string) => {
      const currentId = idToLoad || clipeIdToEdit;

      if (!currentId) {
        setLoadError("Por favor, insira ou selecione um ID de clipe para carregar.");
        toast.error("Erro", {
          description: "Por favor, insira ou selecione um ID de clipe para carregar.",
        });
        form.reset({ id: "", titulo: "", url: "", thumbnail_url: "", plataforma: "twitch" });
        return;
      }

      setIsLoadingClipe(true);
      setLoadError(null);
      form.reset({ id: currentId, titulo: "", url: "", thumbnail_url: "", plataforma: "twitch" });

      startEditTransition(async () => {
        const result = await fetchClipeById(currentId);
        setIsLoadingClipe(false);
        if (result.clipe) {
          form.reset({
            id: result.clipe.id,
            titulo: result.clipe.titulo,
            url: result.clipe.url,
            thumbnail_url: result.clipe.thumbnail_url || "",
            plataforma: result.clipe.plataforma,
          });
          if (clipeIdToEdit !== result.clipe.id) {
            setClipeIdToEdit(result.clipe.id);
          }
        } else {
          const errorMsg = result.error || "Falha ao carregar clipe.";
          setLoadError(errorMsg);
          toast.error("Erro ao carregar clipe", { description: errorMsg });
        }
      });
    },
    [form, clipeIdToEdit]
  );

  const onSubmit = useCallback(
    async (values: EditClipeFormData) => {
      if (!values.id) {
        toast.error("Erro", { description: "ID do clipe está faltando." });
        return;
      }

      startEditTransition(async () => {
        const formData = new FormData();
        formData.append("id", values.id);
        formData.append("titulo", values.titulo);
        formData.append("url", values.url);
        formData.append("thumbnail_url", values.thumbnail_url || "");
        formData.append("plataforma", values.plataforma);

        const result = await editClipe(formData);
        if (result.success) {
          toast.success("Clipe atualizado com sucesso!", { description: result.message });
          router.refresh();
          queryClient.invalidateQueries({ queryKey: ["clipes"] });
        } else {
          toast.error("Erro ao editar clipe", { description: result.message });
        }
      });
    },
    [router, queryClient]
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  const filteredClipes = clipes?.filter(
    (clipe) =>
      clipe.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clipe.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentItems = filteredClipes?.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = filteredClipes ? Math.ceil(filteredClipes.length / itemsPerPage) : 0;

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const getPlatformBadgeColor = (platform: string) => {
    switch (platform) {
      case "twitch":
        return "bg-purple-500/20 text-purple-400 border-purple-500/50";
      case "kick":
        return "bg-green-500/20 text-green-400 border-green-500/50";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6 p-4 border rounded-md mt-4">
      <h2 className="text-xl font-semibold mb-4">Editar Clipe Existente</h2>

      <div className="space-y-2">
        <Label htmlFor="clipeIdToEdit">ID do Clipe para Editar</Label>
        <div className="flex gap-2">
          <Input
            id="clipeIdToEdit"
            value={clipeIdToEdit}
            onChange={(e) => setClipeIdToEdit(e.target.value)}
            placeholder="Digite o ID do clipe"
            disabled={isLoadingClipe}
            className="flex-1"
          />
          <Button type="button" onClick={() => handleLoadClipe()} disabled={isLoadingClipe}>
            {isLoadingClipe ? "Carregando..." : "Carregar Clipe"}
          </Button>
        </div>
      </div>

      {loadError && (
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}

      {form.getValues().id && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
            <FormField
              control={form.control}
              name="id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID do Clipe</FormLabel>
                  <FormControl>
                    <Input {...field} disabled />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="titulo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titulo do Clipe</FormLabel>
                  <FormControl>
                    <Input placeholder="Titulo do clipe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL do Clipe</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="plataforma"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plataforma</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a plataforma" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="twitch">Twitch</SelectItem>
                      <SelectItem value="kick">Kick</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="thumbnail_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL da Thumbnail</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.getValues("thumbnail_url") && (
              <div className="mt-2">
                <p className="text-sm text-muted-foreground">Preview:</p>
                <img
                  src={form.getValues("thumbnail_url") || ""}
                  alt="Preview do clipe"
                  className="rounded-md border max-h-40 w-auto"
                />
              </div>
            )}

            <Button type="submit" disabled={isEditPending || isLoadingClipe}>
              {isEditPending ? "Salvando..." : "Salvar Alteracoes"}
            </Button>
          </form>
        </Form>
      )}

      {isLoading ? (
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-4">Lista de Clipes</h3>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titulo</TableHead>
                  <TableHead>Plataforma</TableHead>
                  <TableHead className="text-right">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : (
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-4">Lista de Clipes</h3>

          <div className="mb-4">
            <Label htmlFor="searchTerm">Buscar clipe</Label>
            <Input
              id="searchTerm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Digite o titulo ou ID do clipe"
              className="mt-1"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titulo</TableHead>
                  <TableHead>Plataforma</TableHead>
                  <TableHead className="text-right">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentItems && currentItems.length > 0 ? (
                  currentItems.map((clipe) => (
                    <TableRow key={clipe.id}>
                      <TableCell className="font-medium">{clipe.titulo}</TableCell>
                      <TableCell>
                        <Badge className={getPlatformBadgeColor(clipe.plataforma)}>
                          {clipe.plataforma}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setClipeIdToEdit(clipe.id);
                            handleLoadClipe(clipe.id);
                          }}
                        >
                          <PencilIcon className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4">
                      Nenhum clipe encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <Pagination className="mt-4">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => paginate(Math.max(1, currentPage - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }).map((_, index) => (
                  <PaginationItem key={index}>
                    <PaginationLink
                      isActive={currentPage === index + 1}
                      onClick={() => paginate(index + 1)}
                      className="cursor-pointer"
                    >
                      {index + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      )}
    </div>
  );
}
