"use client";

import React, { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  InimigoSchema,
  InimigoFormData,
  InimigoStatusSchema,
} from "@/lib/types";
import { addInimigo } from "@/actions/inimigoActions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function AddInimigoForm() {
  const [isPending, startTransition] = useTransition();

  const form = useForm<InimigoFormData>({
    resolver: zodResolver(InimigoSchema),
    defaultValues: {
      nome: "",
      status: "pendente", // Valor padrão do schema
    },
  });

  const onSubmit = async (data: InimigoFormData) => {
    startTransition(async () => {
      const formDataToSubmit = new FormData();
      formDataToSubmit.append("nome", data.nome);
      formDataToSubmit.append("status", data.status);

      const result = await addInimigo(formDataToSubmit);
      if (result.success) {
        toast.success(result.message || "Inimigo adicionado com sucesso!");
        form.reset();
      } else {
        toast.error(result.message || "Erro ao adicionar inimigo.", {
          description: result.errors
            // @ts-ignore TODO: Melhorar tipagem de errors ou ajustar ActionResponse
            ?.map((err) => `${err.field}: ${err.message}`)
            .join("\n"),
        });
      }
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 p-4 border rounded-md mt-4"
      >
        <h2 className="text-xl font-semibold mb-4">Adicionar Novo Inimigo</h2>
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Inimigo</FormLabel>
              <FormControl>
                <Input placeholder="Nome do inimigo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status da Vingança</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {InimigoStatusSchema.options.map((statusValue) => (
                    <SelectItem key={statusValue} value={statusValue}>
                      {statusValue.charAt(0).toUpperCase() +
                        statusValue.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adicionando...
            </>
          ) : (
            "Adicionar Inimigo"
          )}
        </Button>
      </form>
    </Form>
  );
}
