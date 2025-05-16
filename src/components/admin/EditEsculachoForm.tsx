"use client";

import React, { useState, useTransition, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  editEsculacho,
  getEsculachoById,
  getEsculachos,
} from "@/actions/esculachoActions"; // Atualizado
import type { Esculacho, ActionResponse, EsculachoFormData } from "@/lib/types"; // Atualizado
import { EditEsculachoSchema } from "@/lib/types"; // Atualizado
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
import { Textarea } from "@/components/ui/textarea"; // Adicionado
import { useFormState } from "react-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, PencilIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton"; // Adicionado para loading da tabela
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// Zod schema para o formulário de edição
const FormSchema = EditEsculachoSchema;
type FormValues = z.infer<typeof FormSchema>;

export function EditEsculachoForm() {
  const [esculachoIdToEdit, setEsculachoIdToEdit] = useState<string>("");
  const [isLoadingEsculacho, setIsLoadingEsculacho] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const router = useRouter();
  const queryClient = useQueryClient();

  const [isEditPending, startEditTransition] = useTransition();

  const initialEditState: ActionResponse = { success: false, message: "" };

  const editFormAction = async (
    prevState: ActionResponse,
    formData: FormData
  ): Promise<ActionResponse> => {
    return await editEsculacho(formData);
  };

  const [editState, dispatchEditFormAction] = useFormState(
    editFormAction,
    initialEditState
  );

  const {
    data: esculachos,
    isLoading: isLoadingList,
    error: listError,
  } = useQuery<Esculacho[]>({
    queryKey: ["esculachos"],
    queryFn: getEsculachos,
    // staleTime: Infinity, // Removido ou ajustado conforme necessidade de refetch
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      id: "",
      titulo: "",
      descricao: "",
      conteudo: "",
      autor: "",
    },
    mode: "onChange",
  });

  const handleLoadEsculacho = useCallback(
    async (idToLoad?: string) => {
      const currentId = idToLoad || esculachoIdToEdit;
      if (!currentId) {
        setLoadError(
          "Por favor, insira ou selecione um ID de esculacho para carregar."
        );
        toast.error("Erro", { description: "ID do esculacho não fornecido." });
        form.reset({
          id: "",
          titulo: "",
          descricao: "",
          conteudo: "",
          autor: "",
        });
        return;
      }
      setIsLoadingEsculacho(true);
      setLoadError(null);
      form.reset({
        id: currentId,
        titulo: "",
        descricao: "",
        conteudo: "",
        autor: "",
      });

      startEditTransition(async () => {
        const result = await getEsculachoById(currentId);
        setIsLoadingEsculacho(false);
        if (result.esculacho) {
          form.reset({
            id: result.esculacho.id,
            titulo: result.esculacho.titulo,
            descricao: result.esculacho.descricao || "",
            conteudo: result.esculacho.conteudo,
            autor: result.esculacho.autor || "",
          });
          if (esculachoIdToEdit !== result.esculacho.id) {
            setEsculachoIdToEdit(result.esculacho.id);
          }
        } else {
          const errorMsg = result.error || "Falha ao carregar esculacho.";
          setLoadError(errorMsg);
          toast.error("Erro ao carregar esculacho", { description: errorMsg });
        }
      });
    },
    [form, esculachoIdToEdit]
  );

  useEffect(() => {
    if (editState.success) {
      toast.success(editState.message || "Esculacho atualizado com sucesso!");
      router.refresh();
      queryClient.invalidateQueries({ queryKey: ["esculachos"] });
      // queryClient.invalidateQueries({ queryKey: ['esculacho', esculachoIdToEdit] }); // Se houver query para single item
      // form.reset(); // Opcional: limpar formulário após edição bem-sucedida
      // setEsculachoIdToEdit(""); // Opcional: limpar ID do input
    } else if (editState?.message && !editState.success) {
      toast.error(editState.message || "Erro ao editar esculacho.", {
        description: editState.errors
          ?.map((err) => `${err.field}: ${err.message}`)
          .join("\n"),
      });
    }
  }, [editState, router, queryClient]);

  const onSubmit = useCallback(
    (values: FormValues) => {
      if (!values.id) {
        toast.error("Erro", { description: "ID do esculacho está faltando." });
        return;
      }
      startEditTransition(() => {
        const formData = new FormData();
        formData.append("id", values.id);
        formData.append("titulo", values.titulo);
        formData.append("conteudo", values.conteudo);
        formData.append("descricao", values.descricao);
        formData.append("autor", values.autor);
        dispatchEditFormAction(formData);
      });
    },
    [dispatchEditFormAction]
  );

  // Lógica de paginação
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  const filteredEsculachos = esculachos?.filter(
    (item) =>
      item.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.autor &&
        item.autor.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const currentItems = filteredEsculachos?.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = filteredEsculachos
    ? Math.ceil(filteredEsculachos.length / itemsPerPage)
    : 0;

  // Função para mudar de página
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="space-y-6 p-4 border rounded-md mt-4">
      <h2 className="text-xl font-semibold mb-4">Editar Esculacho Existente</h2>
      <div className="space-y-2">
        <Label htmlFor="esculachoIdToEdit">ID do Esculacho para Editar</Label>
        <div className="flex gap-2">
          <Input
            id="esculachoIdToEdit"
            value={esculachoIdToEdit}
            onChange={(e) => setEsculachoIdToEdit(e.target.value)}
            placeholder="Digite o ID do esculacho"
            disabled={isLoadingEsculacho}
            className="flex-1"
          />
          <Button
            type="button"
            onClick={() => handleLoadEsculacho()}
            disabled={isLoadingEsculacho}
          >
            {isLoadingEsculacho ? "Carregando..." : "Carregar Esculacho"}
          </Button>
        </div>
      </div>

      {loadError && (
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" /> <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}

      {form.getValues().id && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 mt-6"
          >
            <FormField
              control={form.control}
              name="id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID do Esculacho</FormLabel>
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
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Título do esculacho" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="conteudo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conteúdo</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Conteúdo do esculacho"
                      {...field}
                      rows={5}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Descrição <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Descrição breve" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="autor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Autor <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do autor" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={isEditPending || isLoadingEsculacho}
            >
              {isEditPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </form>
        </Form>
      )}

      <div className="mt-8">
        <h3 className="text-lg font-medium mb-4">Lista de Esculachos</h3>
        <div className="mb-4">
          <Label htmlFor="searchTermEsculacho">Buscar Esculacho</Label>
          <Input
            id="searchTermEsculacho"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Digite título, ID ou autor"
            className="mt-1"
          />
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Título</TableHead>
                <TableHead className="w-[150px]">Autor</TableHead>
                <TableHead>ID</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingList ? (
                [...Array(3)].map((_, i) => (
                  <TableRow key={`skeleton-row-${i}`}>
                    <TableCell>
                      <Skeleton className="h-5 w-4/5" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-3/5" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-8 w-20 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : listError ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-destructive py-8"
                  >
                    Erro ao carregar esculachos: {(listError as Error).message}
                  </TableCell>
                </TableRow>
              ) : currentItems && currentItems.length > 0 ? (
                currentItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.titulo}</TableCell>
                    <TableCell>{item.autor || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {item.id}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEsculachoIdToEdit(item.id);
                          handleLoadEsculacho(item.id);
                        }}
                      >
                        <PencilIcon className="h-4 w-4 mr-2" /> Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-4 text-muted-foreground"
                  >
                    Nenhum esculacho encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => paginate(Math.max(1, currentPage - 1))}
                  className={
                    currentPage === 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
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
                  onClick={() =>
                    paginate(Math.min(totalPages, currentPage + 1))
                  }
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </div>
  );
}
