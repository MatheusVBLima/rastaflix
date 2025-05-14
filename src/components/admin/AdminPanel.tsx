"use client";

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddStoryForm } from "./AddStoryForm"; 
import { EditStoryForm } from "./EditStoryForm";

interface AdminPanelProps {
  storyListForEdit: React.ReactNode;
  storyListForDelete: React.ReactNode;
}

export function AdminPanel({ storyListForEdit, storyListForDelete }: AdminPanelProps) {
  return (
    <div className="container mx-auto py-10">
      <Tabs defaultValue="add" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="add">Adicionar História</TabsTrigger>
          <TabsTrigger value="edit">Editar História</TabsTrigger>
          <TabsTrigger value="delete">Deletar História</TabsTrigger>
        </TabsList>
        <TabsContent value="add">
          <AddStoryForm />
        </TabsContent>
        <TabsContent value="edit">
          <EditStoryForm />
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-2">Histórias Existentes (para referência de ID)</h3>
            {storyListForEdit}
          </div>
        </TabsContent>
        <TabsContent value="delete">
          {storyListForDelete}
        </TabsContent>
      </Tabs>
    </div>
  );
}
