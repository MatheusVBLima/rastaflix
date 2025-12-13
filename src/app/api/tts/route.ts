import { NextResponse } from "next/server";
import { clerkClient, getAuth } from "@clerk/nextjs/server";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent";

interface TTSRequest {
  text: string;
  voice?: string;
}

interface TTSResponse {
  audio?: string;
  mimeType?: string;
  error?: string;
}

/**
 * Handles POST requests to generate audio from text using Google Gemini TTS.
 * Only authenticated admin users can access this endpoint.
 *
 * @param request - The incoming HTTP request with { text: string, voice?: string }
 * @returns A JSON response with base64 audio data or error message
 */
export async function POST(request: Request): Promise<NextResponse<TTSResponse>> {
  // Verificar autenticação
  const { userId } = getAuth(request as any);

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

    // Se é PCM raw (L16), converter para WAV adicionando header
    let finalAudio = audioData;
    let finalMimeType = originalMimeType;

    if (originalMimeType.includes("L16") || originalMimeType.includes("pcm")) {
      // Decodificar base64 para bytes
      const pcmBytes = Uint8Array.from(atob(audioData), c => c.charCodeAt(0));

      // Criar WAV header (PCM 16-bit, mono, 24000Hz)
      const sampleRate = 24000;
      const numChannels = 1;
      const bitsPerSample = 16;
      const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
      const blockAlign = numChannels * (bitsPerSample / 8);
      const dataSize = pcmBytes.length;
      const fileSize = 36 + dataSize;

      const wavHeader = new ArrayBuffer(44);
      const view = new DataView(wavHeader);

      // RIFF header
      view.setUint32(0, 0x52494646, false); // "RIFF"
      view.setUint32(4, fileSize, true); // file size - 8
      view.setUint32(8, 0x57415645, false); // "WAVE"

      // fmt chunk
      view.setUint32(12, 0x666d7420, false); // "fmt "
      view.setUint32(16, 16, true); // chunk size
      view.setUint16(20, 1, true); // audio format (PCM)
      view.setUint16(22, numChannels, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, byteRate, true);
      view.setUint16(32, blockAlign, true);
      view.setUint16(34, bitsPerSample, true);

      // data chunk
      view.setUint32(36, 0x64617461, false); // "data"
      view.setUint32(40, dataSize, true);

      // Combinar header + PCM data
      const wavBytes = new Uint8Array(44 + pcmBytes.length);
      wavBytes.set(new Uint8Array(wavHeader), 0);
      wavBytes.set(pcmBytes, 44);

      // Converter para base64
      let binary = '';
      for (let i = 0; i < wavBytes.length; i++) {
        binary += String.fromCharCode(wavBytes[i]);
      }
      finalAudio = btoa(binary);
      finalMimeType = "audio/wav";
    }

    return NextResponse.json({
      audio: finalAudio,
      mimeType: finalMimeType,
    });
  } catch (error) {
    console.error("Erro ao chamar API Gemini:", error);
    return NextResponse.json(
      { error: "Erro interno ao gerar áudio" },
      { status: 500 }
    );
  }
}
