import { clerkClient, getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * Handles GET requests to determine if the authenticated user has admin privileges.
 *
 * Returns a JSON response with the user's admin status. If the user is not authenticated, responds with a 401 status and `isAdmin: false`. If an error occurs during user lookup or metadata access, responds with a 500 status and `isAdmin: false`.
 *
 * @param request - The incoming HTTP request.
 * @returns A JSON response indicating whether the user is an admin.
 */
export async function GET(request: Request) {
  const { userId } = getAuth(request as any);

  if (!userId) {
    return NextResponse.json(
      { isAdmin: false, error: "Usuário não autenticado" },
      { status: 401 }
    );
  }

  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const isAdmin = user?.privateMetadata?.is_admin === true;
    return NextResponse.json({ isAdmin });
  } catch (error: unknown) {
    console.error("Erro ao buscar metadados do usuário:", error);
    const errorMessage =
      error instanceof Error
        ? `Erro ao verificar permissões: ${error.message}`
        : "Erro ao verificar permissões";
    return NextResponse.json(
      { isAdmin: false, error: errorMessage },
      { status: 500 }
    );
  }
}
