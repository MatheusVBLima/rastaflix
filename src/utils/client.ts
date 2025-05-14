import { createBrowserClient } from "@supabase/ssr";

// Adicionar uma declaração global para window.Clerk para TypeScript
declare global {
  interface Window {
    Clerk?: {
      session?: {
        getToken: (options?: { template?: string }) => Promise<string | null>;
      };
    };
  }
}

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      accessToken: async () => {
        if (
          typeof window !== "undefined" &&
          window.Clerk &&
          window.Clerk.session
        ) {
          // Para a integração TPA padrão do Supabase, geralmente não é necessário um template específico.
          // O Clerk envia o token de sessão padrão.
          return await window.Clerk.session.getToken();
        }
        return null;
      },
    }
  );
