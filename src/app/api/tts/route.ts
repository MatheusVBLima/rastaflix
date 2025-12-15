import { NextResponse } from "next/server";
import { clerkClient, auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

// Modelo Pro para melhor qualidade de áudio
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-preview-tts:generateContent";

interface TTSRequest {
  text: string;
  voice?: string;
}

interface TTSResponse {
  audioUrl?: string;
  error?: string;
}

// Cliente Supabase com service role para upload
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase URL ou Service Role Key não configurados");
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

/**
 * Handles POST requests to generate audio from text using Google Gemini TTS.
 * Uploads the audio to Supabase Storage and returns the public URL.
 * Only authenticated admin users can access this endpoint.
 *
 * @param request - The incoming HTTP request with { text: string, voice?: string }
 * @returns A JSON response with audioUrl or error message
 */
export async function POST(request: Request): Promise<NextResponse<TTSResponse>> {
  // Verificar autenticação
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: "Usuário não autenticado" },
      { status: 401 }
    );
  }

  // Verificar se é admin
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const isAdmin = user?.privateMetadata?.is_admin === true;

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores podem gerar áudio." },
        { status: 403 }
      );
    }
  } catch (error) {
    console.error("Erro ao verificar permissões:", error);
    return NextResponse.json(
      { error: "Erro ao verificar permissões" },
      { status: 500 }
    );
  }

  // Validar body
  let body: TTSRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Body inválido" },
      { status: 400 }
    );
  }

  const { text, voice = "Enceladus" } = body;

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json(
      { error: "Texto é obrigatório" },
      { status: 400 }
    );
  }

  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    console.error("GOOGLE_AI_API_KEY não configurada");
    return NextResponse.json(
      { error: "Configuração do servidor incompleta" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: text,
              },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: voice,
              },
            },
          },
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Erro da API Gemini:", response.status, errorData);

      if (response.status === 429) {
        return NextResponse.json(
          { error: "Limite de requisições excedido. Tente novamente mais tarde." },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: `Erro ao gerar áudio: ${errorData?.error?.message || response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Extrair áudio base64 da resposta
    const audioData = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    const originalMimeType = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType || "audio/wav";

    if (!audioData) {
      console.error("Resposta sem áudio:", JSON.stringify(data, null, 2));
      return NextResponse.json(
        { error: "Resposta da API não contém áudio" },
        { status: 500 }
      );
    }

    // Converter base64 para Buffer
    let audioBuffer: Buffer;
    let contentType: string;

    if (originalMimeType.includes("L16") || originalMimeType.includes("pcm")) {
      // Se é PCM raw (L16), converter para WAV adicionando header
      const pcmBytes = Buffer.from(audioData, "base64");

      // Extrair taxa de amostragem do mimeType (ex: audio/L16;rate=24000)
      let sampleRate = 24000;
      const rateMatch = originalMimeType.match(/rate=(\d+)/i);
      if (rateMatch) {
        sampleRate = parseInt(rateMatch[1], 10);
      }

      // Criar WAV header
      const numChannels = 1;
      const bitsPerSample = 16;
      const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
      const blockAlign = numChannels * (bitsPerSample / 8);
      const dataSize = pcmBytes.length;
      const fileSize = 36 + dataSize;

      const wavHeader = Buffer.alloc(44);
      
      // RIFF header
      wavHeader.write("RIFF", 0);
      wavHeader.writeUInt32LE(fileSize, 4);
      wavHeader.write("WAVE", 8);
      
      // fmt chunk
      wavHeader.write("fmt ", 12);
      wavHeader.writeUInt32LE(16, 16); // chunk size
      wavHeader.writeUInt16LE(1, 20); // audio format (PCM)
      wavHeader.writeUInt16LE(numChannels, 22);
      wavHeader.writeUInt32LE(sampleRate, 24);
      wavHeader.writeUInt32LE(byteRate, 28);
      wavHeader.writeUInt16LE(blockAlign, 32);
      wavHeader.writeUInt16LE(bitsPerSample, 34);
      
      // data chunk
      wavHeader.write("data", 36);
      wavHeader.writeUInt32LE(dataSize, 40);

      // Combinar header + PCM data
      audioBuffer = Buffer.concat([wavHeader, pcmBytes]);
      contentType = "audio/wav";
    } else {
      // Já é um formato válido (WAV, MP3, etc)
      audioBuffer = Buffer.from(audioData, "base64");
      contentType = originalMimeType.split(";")[0]; // Remove parâmetros extras
    }

    // Fazer upload para Supabase Storage
    const supabase = getSupabaseAdmin();
    const fileName = `${crypto.randomUUID()}.wav`;

    const { error: uploadError } = await supabase.storage
      .from("esculacho-audios")
      .upload(fileName, audioBuffer, {
        contentType,
        upsert: false,
      });

    if (uploadError) {
      console.error("Erro ao fazer upload para Supabase Storage:", uploadError);
      return NextResponse.json(
        { error: `Erro ao salvar áudio: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from("esculacho-audios")
      .getPublicUrl(fileName);

    return NextResponse.json({
      audioUrl: urlData.publicUrl,
    });
  } catch (error) {
    console.error("Erro ao chamar API Gemini:", error);
    return NextResponse.json(
      { error: "Erro interno ao gerar áudio" },
      { status: 500 }
    );
  }
}
