"use client";

import React, { useState, useTransition, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { editMusic, getMusicById, getMusicas } from "@/actions/musicActions";
import type { Music, ActionResponse } from "@/lib/types";
import { EditMusicSchema } from "@/lib/types";
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
import { useFormState } from "react-dom";
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

// Zod schema para o formulário
const FormSchema = EditMusicSchema;

type FormValues = z.infer<typeof FormSchema>;

interface EditMusicFormProps {}

export function EditMusicForm({}: EditMusicFormProps) {
  const [musicIdToEdit, setMusicIdToEdit] = useState<string>("");
  const [isLoadingMusic, setIsLoadingMusic] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const router = useRouter();
  const queryClient = useQueryClient();

  // Para edição
  const [isEditPending, startEditTransition] = useTransition();

  // Estado inicial da action
  const initialEditState: ActionResponse = {
    success: false,
    message: "",
  };

  // Criar formAction para useFormState
  const editFormAction = async (
    prevState: ActionResponse,
    formData: FormData
  ) => {
    return await editMusic(formData);
  };

  // Estado do formulário e formAction vinculada para gerenciar submissões
  const [editState, editFormAction2] = useFormState(
    editFormAction,
    initialEditState
  );

  // Usar o useQuery que já está com o cache populado graças ao prefetch
  const { data: musicas, isLoading } = useQuery<Music[]>({
    queryKey: ["musicas"],
    queryFn: getMusicas,
    staleTime: Infinity, // Match the staleTime from the server
  });

  // Formulário para edição
  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      id: "",
      title: "",
      url: "",
      imageUrl: "",
    },
    mode: "onChange",
  });

  // Observar mudanças na URL para atualizar automaticamente a imagem
  const currentUrlValue = form.watch("url");

  // Efeito para atualizar a URL da imagem quando a URL da música mudar
  useEffect(() => {
    if (currentUrlValue && currentUrlValue.startsWith("http")) {
      try {
        const urlObj = new URL(currentUrlValue);

        // Verificar se é uma URL do YouTube
        if (
          urlObj.hostname.includes("youtube.com") ||
          urlObj.hostname.includes("youtu.be")
        ) {
          // Extrair videoId para URLs padrão do YouTube
          let videoId = urlObj.searchParams.get("v");

          // Formato youtu.be/ID
          if (!videoId && urlObj.hostname.includes("youtu.be")) {
            videoId = urlObj.pathname.substring(1);
          }

          if (videoId) {
            // Construir URL da thumbnail diretamente
            const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

            // Definir a URL da thumbnail no formulário
            form.setValue("imageUrl", thumbnailUrl, { shouldValidate: true });
          }
        }
      } catch (error) {
        console.error("[EditMusicForm] Erro ao analisar URL:", error);
      }
    }
  }, [currentUrlValue, form]);

  const handleLoadMusic = useCallback(
    async (idToLoad?: string) => {
      const currentId = idToLoad || musicIdToEdit; // Usa o ID passado ou o do estado

      if (!currentId) {
        setLoadError(
          "Por favor, insira ou selecione um ID de música para carregar."
        );
        toast.error("Erro", {
          description:
            "Por favor, insira ou selecione um ID de música para carregar.",
          position: "bottom-right",
        });
        form.reset({ id: "", title: "", url: "", imageUrl: "" }); // Limpa o formulário completamente
        return;
      }
      setIsLoadingMusic(true);
      setLoadError(null);
      // Limpa o formulário antes de carregar novos dados, exceto o ID se ele já estiver lá
      form.reset({ id: currentId, title: "", url: "", imageUrl: "" });

      startEditTransition(async () => {
        const result = await getMusicById(currentId);
        setIsLoadingMusic(false);
        if (result.music) {
          form.reset({
            id: result.music.id,
            title: result.music.title,
            url: result.music.url,
            imageUrl: result.music.imageUrl || "",
          });
          // Se o ID carregado for diferente do que está no input de ID, atualiza o input também
          if (musicIdToEdit !== result.music.id) {
            setMusicIdToEdit(result.music.id);
          }
        } else {
          const errorMsg = result.error || "Falha ao carregar música.";
          setLoadError(errorMsg);
          toast.error("Erro ao carregar música", {
            description: errorMsg,
            position: "bottom-right",
          });
        }
      });
    },
    [form, musicIdToEdit]
  ); // musicIdToEdit permanece aqui para o caso de uso do botão "Carregar Música"

  useEffect(() => {
    if (editState.success) {
      // Mostrar toast de sucesso
      toast.success("Música atualizada com sucesso!", {
        description: editState.message,
        position: "bottom-right",
      });

      // Revalidar dados
      router.refresh();
      queryClient.resetQueries({ queryKey: ["musicas"] });
      queryClient.resetQueries({ queryKey: ["music", musicIdToEdit] });
    } else if (editState?.message && !editState.success) {
      // Mostrar toast de erro se houver mensagem e não for sucesso
      toast.error("Erro ao editar música", {
        description: editState.message,
        position: "bottom-right",
      });

      // Se houver erros de validação, mostrar cada erro em um toast separado
      if (editState?.errors) {
        editState.errors.forEach((err) => {
          toast.error(`${err.field}: ${err.message}`, {
            position: "bottom-right",
          });
        });
      }
    }
  }, [editState, router, queryClient, musicIdToEdit]);

  const onSubmit = useCallback(
    (values: FormValues) => {
      if (!values.id) {
        // Idealmente, isso não deve acontecer se a música foi carregada
        toast.error("Erro", {
          description: "ID da música está faltando. Recarregue a música.",
          position: "bottom-right",
        });
        return;
      }
      startEditTransition(() => {
        const formData = new FormData();
        formData.append("id", values.id);
        formData.append("title", values.title);
        formData.append("url", values.url);
        if (values.imageUrl) formData.append("imageUrl", values.imageUrl);

        editFormAction2(formData);
      });
    },
    [editFormAction2]
  );

  // Lógica de paginação
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  // Filtered musics for the table
  const filteredMusicas = musicas?.filter(
    (music) =>
      music.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      music.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentItems = filteredMusicas?.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = filteredMusicas
    ? Math.ceil(filteredMusicas.length / itemsPerPage)
    : 0;

  // Função para mudar de página
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Rendered UI when loading data
  const renderLoadingState = () => (
    <div className="mt-8">
      <h3 className="text-lg font-medium mb-4">Lista de Músicas</h3>

      <div className="mb-4">
        <Skeleton className="h-5 w-32 mb-1" />
        <Skeleton className="h-10 w-full" />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Título</TableHead>
              <TableHead>ID</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Skeleton className="h-5 w-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-28" />
                </TableCell>
                <TableCell className="text-right">
                  <Skeleton className="h-8 w-24 ml-auto" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 p-4 border rounded-md mt-4">
      <h2 className="text-xl font-semibold mb-4">Editar Música Existente</h2>

      <div className="space-y-2">
        <Label htmlFor="musicIdToEdit">ID da Música para Editar</Label>
        <div className="flex gap-2">
          <Input
            id="musicIdToEdit"
            value={musicIdToEdit}
            onChange={(e) => setMusicIdToEdit(e.target.value)}
            placeholder="Digite o ID da música"
            disabled={isLoadingMusic}
            className="flex-1"
          />
          <Button
            type="button"
            onClick={() => handleLoadMusic()}
            disabled={isLoadingMusic}
          >
            {isLoadingMusic ? "Carregando..." : "Carregar Música"}
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
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 mt-6"
          >
            <FormField
              control={form.control}
              name="id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID da Música</FormLabel>
                  <FormControl>
                    <Input {...field} disabled />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Música</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome da música" {...field} />
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
                  <FormLabel>URL da Música</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://exemplo.com/musica"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campo da URL da Imagem - Agora oculto para o usuário */}
            <input
              type="hidden"
              {...form.register("imageUrl")}
              value={form.getValues("imageUrl") || ""}
            />

            {form.getValues("imageUrl") && (
              <div className="mt-2">
                <p className="text-sm text-muted-foreground">
                  Preview da Imagem:
                </p>
                <img
                  src={form.getValues("imageUrl") || ""}
                  alt="Preview da música"
                  className="rounded-md border max-h-40 w-auto"
                />
              </div>
            )}

            <Button type="submit" disabled={isEditPending || isLoadingMusic}>
              {isEditPending ? "Salvando Alterações..." : "Salvar Alterações"}
            </Button>
          </form>
        </Form>
      )}

      {/* Tabela de músicas - mostrar skeleton durante carregamento */}
      {isLoading ? (
        renderLoadingState()
      ) : (
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-4">Lista de Músicas</h3>

          <div className="mb-4">
            <Label htmlFor="searchTerm">Buscar música</Label>
            <Input
              id="searchTerm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Digite o título ou ID da música"
              className="mt-1"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Título</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentItems && currentItems.length > 0 ? (
                  currentItems.map((music) => (
                    <TableRow key={music.id}>
                      <TableCell className="font-medium">
                        {music.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          {music.id}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Define o ID no estado (para o input)
                            setMusicIdToEdit(music.id);
                            // Chama handleLoadMusic com o ID da música da linha clicada
                            handleLoadMusic(music.id);
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
                      Nenhuma música encontrada.
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
      )}
    </div>
  );
}
