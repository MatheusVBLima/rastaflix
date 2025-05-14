import React from 'react';
import { getHistorias } from '@/app/historias/data'; // Ajuste o caminho se necessário
import { Story } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
// Importar o botão de deletar
import { DeleteStoryButton } from './DeleteStoryButton'; 

interface StoryListAdminProps {
  // No futuro, podemos adicionar props para funcionalidades de edição/seleção
  showDeleteButton?: boolean;
  // onSelectStoryForEdit?: (storyId: string) => void; // Exemplo para futura edição
}

export async function StoryListAdmin({ showDeleteButton = true }: StoryListAdminProps) {
  const historias = await getHistorias();

  if (!historias || historias.length === 0) {
    return <p className="text-center text-muted-foreground py-8">Nenhuma história encontrada.</p>;
  }

  return (
    <div className="rounded-md border mt-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">Título</TableHead>
            <TableHead>ID</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead>URL</TableHead>
            {showDeleteButton && <TableHead className="text-right">Ações</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {historias.map((story: Story) => (
            <TableRow key={story.id}>
              <TableCell className="font-medium">{story.title}</TableCell>
              <TableCell>
                <Badge variant="outline" className="font-mono text-xs">{story.id}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {story.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <a href={story.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline truncate max-w-[200px] block">
                  {story.url}
                </a>
              </TableCell>
              {showDeleteButton && (
                <TableCell className="text-right">
                  <DeleteStoryButton storyId={story.id} storyTitle={story.title} />
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 