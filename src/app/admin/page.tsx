import React from 'react'
import { redirect } from 'next/navigation';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { AdminPanel } from '@/components/admin/AdminPanel';
import { StoryListAdmin } from '@/components/admin/StoryListAdmin';

async function verificarAdminServerPage(): Promise<boolean> {
  const authState = await auth();
  if (!authState.userId) return false;
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(authState.userId);
    return user.privateMetadata?.is_admin === true;
  } catch { return false; }
}

export default async function AdminPage() {
  const isAdmin = await verificarAdminServerPage();
  if (!isAdmin) {
    redirect('/'); // Ou para uma página de "acesso negado"
  }
  
  // Conteúdo da página de admin aqui
  return (
    <AdminPanel 
      storyListForEdit={<StoryListAdmin showDeleteButton={false} />} 
      storyListForDelete={<StoryListAdmin showDeleteButton={true} />}
    />
  );
}
