import { cache } from "react";
import "server-only";
import { redirect } from "next/navigation";
import { auth, clerkClient } from "@clerk/nextjs/server";

export const getIsAdmin = cache(async (): Promise<boolean> => {
  const authState = await auth();
  if (!authState.userId) return false;

  try {
    const client = await clerkClient();
    const user = await client.users.getUser(authState.userId);
    return user.privateMetadata?.is_admin === true;
  } catch {
    return false;
  }
});

/**
 * Ensure the current user is an admin and redirect to the homepage if not.
 *
 * If the caller is not an admin, performs a navigation redirect to `/` to prevent access.
 */
export async function requireAdmin(): Promise<void> {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) {
    redirect("/");
  }
}

/**
 * Ensure the current user is an admin, throwing otherwise.
 *
 * Use in Server Actions and Route Handlers before any write.
 * @returns The admin's Clerk user ID.
 */
export async function ensureAdmin(): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Usuário não autenticado.");
  }
  if (!(await getIsAdmin())) {
    throw new Error("Acesso negado. Requer privilégios de administrador.");
  }
  return userId;
}
