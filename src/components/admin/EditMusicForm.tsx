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
import { useQuery } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';

// Zod schema para o formulário
const FormSchema = EditMusicSchema;

type FormValues = z.infer<typeof FormSchema>;

interface EditMusicFormProps {}

export function EditMusicForm({}: EditMusicFormProps) {
  const [musicIdToEdit, setMusicIdToEdit] = useState<string>("");
  const [isLoadingMusic, setIsLoadingMusic] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const router = useRouter();
  const queryClient = useQueryClient();
  
  // Para edição 
  const [isEditPending, startEditTransition] = useTransition();
  
  // Estado inicial da action
  const initialEditState: ActionResponse = { 
    success: false, 
    message: "" 
  };
  
  // Criar formAction para useFormState
  const editFormAction = async (prevState: ActionResponse, formData: FormData) => {
    return await editMusic(formData);
  };
  
  // Estado do formulário e formAction vinculada para gerenciar submissões
  const [editState, editFormAction2] = useFormState(editFormAction, initialEditState);
  
  // Usar o useQuery que já está com o cache populado graças ao prefetch
  const { data: musicas, isLoading } = useQuery<Music[]>({
    queryKey: ['musicas'],
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

  const handleLoadMusic = useCallback(async () => {
    if (!musicIdToEdit) {
      setLoadError("Por favor, insira um ID de música para carregar.");
      toast.error("Erro", {
        description: "Por favor, insira um ID de música para carregar.",
        position: "bottom-right",
      });
      form.reset(); // Limpa o formulário se o ID for removido
      return;
    }
    setIsLoadingMusic(true);
    setLoadError(null);
    form.reset(); // Limpa antes de carregar novos dados

    startEditTransition(async () => {
      const result = await getMusicById(musicIdToEdit);
      setIsLoadingMusic(false);
      if (result.music) {
        form.reset({
          id: result.music.id,
          title: result.music.title,
          url: result.music.url,
          imageUrl: result.music.imageUrl || "",
        });
      } else {
        const errorMsg = result.error || "Falha ao carregar música.";
        setLoadError(errorMsg);
        toast.error("Erro ao carregar música", {
          description: errorMsg,
          position: "bottom-right",
        });
      }
    });
  }, [musicIdToEdit, form]);

  useEffect(() => {
    if (editState.success) {
      // Mostrar toast de sucesso
      toast.success("Música atualizada com sucesso!", {
        description: editState.message,
        position: "bottom-right",
      });
      
      // Revalidar dados
      router.refresh();
      queryClient.resetQueries({ queryKey: ['musicas'] });
      queryClient.resetQueries({ queryKey: ['music', musicIdToEdit] });
    } else if (editState?.message && !editState.success) {
      // Mostrar toast de erro se houver mensagem e não for sucesso
      toast.error("Erro ao editar música", {
        description: editState.message,
        position: "bottom-right",
      });
      
      // Se houver erros de validação, mostrar cada erro em um toast separado
      if (editState?.errors) {
        editState.errors.forEach(err => {
          toast.error(`${err.field}: ${err.message}`, {
            position: "bottom-right",
          });
        });
      }
    }
  }, [editState, router, queryClient, musicIdToEdit]);

  const onSubmit = useCallback((values: FormValues) => {
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
  }, [editFormAction2]);

  // Filtered musics for the table
  const filteredMusicas = musicas?.filter(music => 
    music.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    music.id.toLowerCase().includes(searchTerm.toLowerCase())
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
            onClick={handleLoadMusic} 
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
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
                    <Input type="url" placeholder="https://exemplo.com/musica" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL da Imagem (Opcional)</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://exemplo.com/imagem.png" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" disabled={isEditPending || isLoadingMusic}>
              {isEditPending ? "Salvando Alterações..." : "Salvar Alterações"}
            </Button>
          </form>
        </Form>
      )}
      
      {/* Tabela de músicas */}
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
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-4">Carregando músicas...</TableCell>
                </TableRow>
              ) : filteredMusicas && filteredMusicas.length > 0 ? (
                filteredMusicas.map((music) => (
                  <TableRow key={music.id}>
                    <TableCell className="font-medium">{music.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">{music.id}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          setMusicIdToEdit(music.id);
                          handleLoadMusic();
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
                  <TableCell colSpan={3} className="text-center py-4">Nenhuma música encontrada.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
} 