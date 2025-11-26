"use client";

import React, { useState, useTransition, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { editStory } from "@/actions/storyActions";
import { fetchStoryById, fetchHistorias } from "@/lib/queries";
import type { Story, ActionResponse } from "@/lib/types";
import { EditStorySchema as ServerEditStorySchema } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

// O EditStorySchema já inclui 'id'. Para o formulário, tags será uma string.
const FormSchema = ServerEditStorySchema.extend({
  tags: z.string().optional(),
});

type FormValues = z.infer<typeof FormSchema>;

interface EditStoryFormProps {
  // No futuro, poderíamos passar uma lista de histórias para um select
  // ou integrar com uma lista clicável.
  // Por enquanto, um input para ID para buscar a história.
}

export function EditStoryForm({}: EditStoryFormProps) {
  const [storyIdToEdit, setStoryIdToEdit] = useState<string>("");
  const [isLoadingStory, setIsLoadingStory] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const queryClient = useQueryClient();
  const router = useRouter();

  const [isEditPending, startEditTransition] = useTransition();
  const editInitialState: ActionResponse = { success: false, message: "" };
  const [editState, editFormAction] = useFormState(editStory, editInitialState);

  // Usar o useQuery que já está com o cache populado graças ao prefetch
  const { data: historias, isLoading } = useQuery<Story[]>({
    queryKey: ["historias"],
    queryFn: fetchHistorias,
    staleTime: Infinity, // Match the staleTime from the server
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      id: "", // ID será preenchido ao carregar a história
      title: "",
      description: "",
      tags: "",
      url: "",
      imageUrl: "",
    },
  });

  // Observar mudanças na URL para atualizar automaticamente a imagem
  const currentUrlValue = form.watch("url");

  const handleLoadStory = useCallback(
    async (idToLoad?: string) => {
      const idToUse = idToLoad || storyIdToEdit;

      if (!idToUse) {
        setLoadError("Por favor, insira um ID de história para carregar.");
        toast.error("Erro", {
          description: "Por favor, insira um ID de história para carregar.",
          position: "bottom-right",
        });
        form.reset(); // Limpa o formulário se o ID for removido
        return;
      }

      setIsLoadingStory(true);
      setLoadError(null);
      form.reset(); // Limpa antes de carregar novos dados

      // Se idToLoad foi fornecido, atualiza também o campo de entrada
      if (idToLoad && idToLoad !== storyIdToEdit) {
        setStoryIdToEdit(idToLoad);
      }

      startEditTransition(async () => {
        const result = await fetchStoryById(idToUse);
        setIsLoadingStory(false);

        if (result.story) {
          form.reset({
            id: result.story.id,
            title: result.story.title,
            description: result.story.description || "",
            tags: result.story.tags?.join(", ") || "", // Converter array para string
            url: result.story.url,
            imageUrl: result.story.imageUrl || "",
          });
        } else {
          const errorMsg = result.error || "Falha ao carregar história.";
          console.error("[EditStoryForm] Erro ao carregar história:", errorMsg);
          setLoadError(errorMsg);
          toast.error("Erro ao carregar história", {
            description: errorMsg,
            position: "bottom-right",
          });
        }
      });
    },
    [storyIdToEdit, form, startEditTransition]
  );

  // Adicionar efeito para carregar história quando o ID mudar
  useEffect(() => {
    // Evitar carregar com string vazia ou quando já estiver carregando
    if (storyIdToEdit && !isLoadingStory) {
      handleLoadStory(storyIdToEdit);
    }
    // A dependência em handleLoadStory (que por sua vez depende de storyIdToEdit) garante que
    // este efeito reaja a mudanças no ID. Não incluir isLoadingStory nas dependências
    // previne o loop onde o fim de um carregamento (isLoadingStory -> false) re-dispara este efeito.
  }, [storyIdToEdit, handleLoadStory]); // Alterado de [storyIdToEdit, isLoadingStory, handleLoadStory]

  // Efeito para atualizar a URL da imagem quando a URL da história mudar
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
            // Construir URL da thumbnail diretamente usando hqdefault.jpg
            const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

            // Definir a URL da thumbnail no formulário
            form.setValue("imageUrl", thumbnailUrl, { shouldValidate: true });
          }
        }
      } catch (error) {
        console.error("[EditStoryForm] Erro ao analisar URL:", error);
      }
    }
  }, [currentUrlValue, form]);

  useEffect(() => {
    if (editState.success) {
      // Mostrar toast de sucesso
      toast.success("História atualizada com sucesso!", {
        description: editState.message,
        position: "bottom-right",
      });

      // Revalidar dados
      router.refresh();
      queryClient.resetQueries({ queryKey: ["historias"] });
      queryClient.resetQueries({ queryKey: ["story", storyIdToEdit] });
    } else if (editState?.message && !editState.success) {
      // Mostrar toast de erro se houver mensagem e não for sucesso
      toast.error("Erro ao editar história", {
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
  }, [editState, router, queryClient, storyIdToEdit]);

  const onSubmit = useCallback(
    (values: FormValues) => {
      if (!values.id) {
        toast.error("Erro", {
          description: "ID da história está faltando. Recarregue a história.",
          position: "bottom-right",
        });
        return;
      }
      startEditTransition(() => {
        const formData = new FormData();
        formData.append("id", values.id);
        formData.append("title", values.title);
        if (values.description)
          formData.append("description", values.description);
        if (values.tags) formData.append("tags", values.tags); // Tags são enviadas como string separada por vírgula
        formData.append("url", values.url);
        if (values.imageUrl) formData.append("imageUrl", values.imageUrl);

        editFormAction(formData);
      });
    },
    [editFormAction]
  );

  // Lógica de paginação
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  // Filtered stories for the table
  const filteredHistorias = historias?.filter(
    (story) =>
      story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      story.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentItems = filteredHistorias?.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = filteredHistorias
    ? Math.ceil(filteredHistorias.length / itemsPerPage)
    : 0;

  // Função para mudar de página
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  console.log(
    "[EditStoryForm] Renderizando componente. storyIdToEdit:",
    storyIdToEdit,
    "isLoadingStory:",
    isLoadingStory
  );

  // Rendered UI when loading data
  const renderLoadingState = () => (
    <div className="mt-8">
      <h3 className="text-lg font-medium mb-4">Lista de Histórias</h3>

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
              <TableHead>Tags</TableHead>
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
                <TableCell>
                  <div className="flex gap-1">
                    <Skeleton className="h-5 w-12" />
                    <Skeleton className="h-5 w-16" />
                  </div>
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

  const renderHistoriasTable = () => {
    return (
      <div className="mt-8">
        <h3 className="text-lg font-medium mb-4">Lista de Histórias</h3>

        <div className="mb-4">
          <Label htmlFor="searchTerm">Buscar história</Label>
          <Input
            id="searchTerm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Digite o título ou ID da história"
            className="mt-1"
          />
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Título</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems && currentItems.length > 0 ? (
                currentItems.map((story) => (
                  <TableRow key={story.id}>
                    <TableCell className="font-medium">{story.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {story.id}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {story.tags &&
                          story.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          handleLoadStory(story.id);
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
                  <TableCell colSpan={4} className="text-center py-4">
                    Nenhuma história encontrada.
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
    );
  };

  return (
    <div className="space-y-6 p-4 border rounded-md mt-4">
      <h2 className="text-xl font-semibold mb-4">Editar História Existente</h2>

      <div className="flex gap-2 items-end">
        <div className="flex-grow">
          <Label htmlFor="storyIdInput">ID da História para Editar</Label>
          <Input
            id="storyIdInput"
            placeholder="Cole o ID da história aqui"
            value={storyIdToEdit}
            onChange={(e) => setStoryIdToEdit(e.target.value)}
            className="mt-1"
          />
        </div>
        <Button
          onClick={() => handleLoadStory(storyIdToEdit)}
          disabled={isLoadingStory || isEditPending || !storyIdToEdit}
        >
          {isLoadingStory ? "Carregando..." : "Carregar História"}
        </Button>
      </div>

      {form.getValues("id") && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 mt-6"
          >
            <FormField
              control={form.control}
              name="id"
              render={({ field }) => <Input type="hidden" {...field} />} // Campo ID oculto
            />
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Título da história" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Uma breve descrição da história"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags (Opcional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="js, react, nextjs (separadas por vírgula)"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Separe as tags por vírgula.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL da História</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://exemplo.com/historia"
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
                  alt="Preview da história"
                  className="rounded-md border max-h-40 w-auto"
                />
              </div>
            )}

            <Button type="submit" disabled={isEditPending || isLoadingStory}>
              {isEditPending ? "Salvando Alterações..." : "Salvar Alterações"}
            </Button>
          </form>
        </Form>
      )}

      {/* Tabela de histórias - mostrar skeleton durante carregamento */}
      {isLoading ? renderLoadingState() : renderHistoriasTable()}
    </div>
  );
}

// Será necessário importar Label de seus componentes UI, se não estiver global
// import { Label } from "@/components/ui/label";
