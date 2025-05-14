import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

async function verificarAdminServerPage(): Promise<boolean> {
  const authState = await auth();
  if (!authState.userId) return false;
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(authState.userId);
    return user.privateMetadata?.is_admin === true;
  } catch { return false; }
}

export default async function AdminInimigosPage() {
  // Verificação de autenticação e permissão de admin
  const isAdmin = await verificarAdminServerPage();
  if (!isAdmin) {
    redirect("/"); // Ou para uma página de "acesso negado"
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Gerenciamento de Inimigos</h1>
      
      <div className="bg-muted/50 p-10 rounded-lg text-center">
        <h2 className="text-xl mb-4">Em desenvolvimento</h2>
        <p className="text-muted-foreground">
          O módulo de gerenciamento de inimigos ainda está em desenvolvimento.
          <br />
          Em breve você poderá adicionar, editar e excluir inimigos.
        </p>
      </div>
    </div>
  );
} 