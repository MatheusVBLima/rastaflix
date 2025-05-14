import { clerkClient, getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

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
    const isAdmin = user.privateMetadata?.is_admin === true;
    return NextResponse.json({ isAdmin });
  } catch (error) {
    console.error("Erro ao buscar metadados do usuário:", error);
    return NextResponse.json(
      { isAdmin: false, error: "Erro ao verificar permissões" },
      { status: 500 }
    );
  }
}
