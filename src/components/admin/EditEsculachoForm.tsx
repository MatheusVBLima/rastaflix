"use client";

import React, { useState, useTransition, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { editEsculacho } from "@/actions/esculachoActions";
import { fetchEsculachoById, fetchEsculachos } from "@/lib/queries";
import type { Esculacho, ActionResponse } from "@/lib/types";
import { EditEsculachoSchema } from "@/lib/types";
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
import { Textarea } from "@/components/ui/textarea";
import { useFormState } from "react-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, PencilIcon, Loader2, Volume2, RotateCcw } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { AudioPlayer } from "@/components/ui/audio-player";

const FormSchema = EditEsculachoSchema;
type FormValues = z.infer<typeof FormSchema>;

export function EditEsculachoForm() {
  const [esculachoIdToEdit, setEsculachoIdToEdit] = useState<string>("");
  const [isLoadingEsculacho, setIsLoadingEsculacho] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Estados para áudio
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const [originalConteudo, setOriginalConteudo] = useState<string>("");

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
    queryFn: fetchEsculachos,
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

  const conteudo = form.watch("conteudo");
  const conteudoChanged = conteudo !== originalConteudo && originalConteudo !== "";

  const handleGenerateAudio = async () => {
    const conteudoValue = form.getValues("conteudo");
    if (!conteudoValue || conteudoValue.trim().length === 0) {
      toast.error("Preencha o conteúdo antes de gerar o áudio.");
      return;
    }

    setIsGeneratingAudio(true);
    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: conteudoValue }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao gerar áudio");
      }

      setAudioUrl(data.audioUrl);
      toast.success("Áudio gerado com sucesso! Ouça o preview abaixo.");
    } catch (error) {
      console.error("Erro ao gerar áudio:", error);
      toast.error(
        error instanceof Error ? error.message : "Erro ao gerar áudio"
      );
    } finally {
      setIsGeneratingAudio(false);
    }
  };

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
      setAudioUrl(null);
      setCurrentAudioUrl(null);
      setOriginalConteudo("");
      form.reset({
        id: currentId,
        titulo: "",
        descricao: "",
        conteudo: "",
        autor: "",
      });

      startEditTransition(async () => {
        const result = await fetchEsculachoById(currentId);
        setIsLoadingEsculacho(false);
        if (result.esculacho) {
          form.reset({
            id: result.esculacho.id,
            titulo: result.esculacho.titulo,
            descricao: result.esculacho.descricao || "",
            conteudo: result.esculacho.conteudo,
            autor: result.esculacho.autor || "",
          });
          setOriginalConteudo(result.esculacho.conteudo);
          setCurrentAudioUrl(result.esculacho.audio_url || null);
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
      setAudioUrl(null);
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

      // Se o conteúdo mudou e não tem novo áudio gerado
      if (conteudoChanged && !audioUrl) {
        toast.error("O conteúdo foi alterado. Gere um novo áudio antes de salvar.");
        return;
      }

      startEditTransition(() => {
        const formData = new FormData();
        formData.append("id", values.id);
        formData.append("titulo", values.titulo);
        formData.append("conteudo", values.conteudo);
        formData.append("descricao", values.descricao);
        formData.append("autor", values.autor);

        // Adicionar áudio se foi gerado um novo
        if (audioUrl) {
          formData.append("audioUrl", audioUrl);
        }

        dispatchEditFormAction(formData);
      });
    },
    [dispatchEditFormAction, conteudoChanged, audioUrl]
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

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Determinar qual áudio mostrar (novo gerado ou existente do banco)
  const audioSrc = audioUrl || currentAudioUrl;

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
                  {conteudoChanged && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      O conteúdo foi alterado. Gere um novo áudio antes de salvar.
                    </p>
                  )}
                </FormItem>
              )}
            />

            {/* Seção de Áudio */}
            <div className="space-y-3 p-4 border rounded-md bg-muted/30">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Áudio do Esculacho</h3>
                <Button
                  type="button"
                  variant={conteudoChanged ? "default" : "outline"}
                  size="sm"
                  onClick={handleGenerateAudio}
                  disabled={isGeneratingAudio || !conteudo || conteudo.trim().length === 0}
                >
                  {isGeneratingAudio ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      {audioUrl ? "Regenerar Áudio" : "Gerar Novo Áudio"}
                    </>
                  )}
                </Button>
              </div>

              {audioSrc ? (
                <div className="space-y-2">
                  {audioUrl ? (
                    <p className="text-xs text-muted-foreground">
                      Preview do novo áudio gerado.
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Áudio atual do esculacho.
                    </p>
                  )}
                  <AudioPlayer src={audioSrc} />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Este esculacho ainda não possui áudio. Clique em &quot;Gerar Novo Áudio&quot; para criar.
                </p>
              )}
            </div>

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
              disabled={isEditPending || isLoadingEsculacho || (conteudoChanged && !audioUrl)}
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
                <TableHead className="w-[80px]">Áudio</TableHead>
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
                      <Skeleton className="h-5 w-12" />
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
                    colSpan={5}
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
                      {item.audio_url ? (
                        <Badge variant="default" className="text-xs">
                          <Volume2 className="h-3 w-3 mr-1" />
                          Sim
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Não
                        </Badge>
                      )}
                    </TableCell>
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
                    colSpan={5}
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
