import { cache } from "react";
import "server-only";
import { redirect } from "next/navigation";
import { auth, clerkClient } from "@clerk/nextjs/server";
import type { HeaderAuthState } from "@/lib/types";

const SIGNED_OUT_AUTH: HeaderAuthState = {
  isSignedIn: false,
  isAdmin: false,
  user: null,
};

export const getHeaderAuth = cache(async (): Promise<HeaderAuthState> => {
  try {
    const authState = await auth();
    if (!authState.userId) return SIGNED_OUT_AUTH;

    const client = await clerkClient();
    const user = await client.users.getUser(authState.userId);
    const primaryEmail = user.emailAddresses.find(
      (e) => e.id === user.primaryEmailAddressId
    );
    const fullName =
      [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || null;

    return {
      isSignedIn: true,
      isAdmin: user.privateMetadata?.is_admin === true,
      user: {
        id: user.id,
        fullName,
        username: user.username,
        email: primaryEmail?.emailAddress ?? null,
        imageUrl: user.imageUrl,
        emailVerified: primaryEmail?.verification?.status === "verified",
        createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : null,
        lastSignInAt: user.lastSignInAt
          ? new Date(user.lastSignInAt).toISOString()
          : null,
      },
    };
  } catch {
    return SIGNED_OUT_AUTH;
  }
});

export const getIsAdmin = cache(async (): Promise<boolean> => {
  const { isAdmin } = await getHeaderAuth();
  return isAdmin;
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
