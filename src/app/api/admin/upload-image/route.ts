import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getIsAdmin } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const ALLOWED_FOLDERS = new Set(["awards", "clipes", "historias", "musicas"] as const);
type UploadFolder = "awards" | "clipes" | "historias" | "musicas";

const MIME_TO_EXT: Record<string, { ext: string; mime: string }> = {
  "image/png": { ext: "png", mime: "image/png" },
  "image/jpeg": { ext: "jpg", mime: "image/jpeg" },
  "image/jpg": { ext: "jpg", mime: "image/jpeg" },
  "image/webp": { ext: "webp", mime: "image/webp" },
  "image/gif": { ext: "gif", mime: "image/gif" },
};

function matchesMagicBytes(buf: Buffer, mime: string): boolean {
  if (buf.length < 12) return false;
  switch (mime) {
    case "image/png":
      return buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
    case "image/jpeg":
      return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
    case "image/gif":
      return buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38;
    case "image/webp":
      return (
        buf.subarray(0, 4).toString("ascii") === "RIFF" &&
        buf.subarray(8, 12).toString("ascii") === "WEBP"
      );
    default:
      return false;
  }
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Usuário não autenticado." }, { status: 401 });
  }

  if (!(await getIsAdmin())) {
    return NextResponse.json(
      { error: "Acesso negado. Apenas administradores podem enviar imagens." },
      { status: 403 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Envio inválido." }, { status: 400 });
  }

  const file = formData.get("file");
  const rawFolder = String(formData.get("folder") ?? "clipes");
  const folder: UploadFolder = ALLOWED_FOLDERS.has(rawFolder as UploadFolder)
    ? (rawFolder as UploadFolder)
    : "clipes";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Selecione um arquivo de imagem." }, { status: 400 });
  }

  if (file.size === 0) {
    return NextResponse.json({ error: "O arquivo enviado está vazio." }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "A imagem deve ter no máximo 5 MB." },
      { status: 400 }
    );
  }

  const typeInfo = MIME_TO_EXT[file.type.toLowerCase()];
  if (!typeInfo) {
    return NextResponse.json(
      { error: "Formato não suportado. Use PNG, JPG, WebP ou GIF." },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!matchesMagicBytes(buffer, typeInfo.mime)) {
    return NextResponse.json(
      { error: "O conteúdo do arquivo não corresponde a uma imagem válida." },
      { status: 400 }
    );
  }

  const bucket = folder === "awards" ? "award-nominees" : "media-images";
  const filePath =
    folder === "awards"
      ? `${crypto.randomUUID()}.${typeInfo.ext}`
      : `${folder}/${crypto.randomUUID()}.${typeInfo.ext}`;

  const supabase = getSupabaseAdmin();
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, buffer, {
      contentType: typeInfo.mime,
      cacheControl: "31536000",
      upsert: false,
    });

  if (uploadError) {
    console.error("Erro ao enviar imagem para Supabase Storage:", uploadError);
    return NextResponse.json(
      { error: `Erro ao salvar imagem: ${uploadError.message}` },
      { status: 500 }
    );
  }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);

  return NextResponse.json({ url: urlData.publicUrl });
}
