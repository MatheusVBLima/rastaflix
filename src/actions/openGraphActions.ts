"use server";

import ogs from "open-graph-scraper";

interface OpenGraphResponse {
  success: boolean;
  imageUrl?: string | null;
  error?: string | null;
  message?: string;
}

export async function getOpenGraphData(
  url: string
): Promise<OpenGraphResponse> {
  if (!url || !url.startsWith("http")) {
    return {
      success: false,
      error: "URL inválida.",
      message: "Por favor, insira uma URL válida começando com http ou https.",
    };
  }

  // Primeira tentativa: usar open-graph-scraper para todas as URLs
  try {
    const options = {
      url,
      timeout: 4000,
      headers: { "user-agent": "Rastaflix-Preview-Bot/1.0" },
    };

    const { result, error } = await ogs(options).catch((e) => {
      console.error("[openGraphActions] Erro ao chamar ogs diretamente:", e);
      // Se ogs falhar com erro de promise, retorna um objeto com error para manter o fluxo
      return { result: null, error: e };
    });

    if (!error && result && result.success) {
      const imageUrl =
        result.ogImage && result.ogImage[0] ? result.ogImage[0].url : null;

      if (imageUrl) {
        // Se o Open Graph retornou uma imagem, usamos ela
        return {
          success: true,
          imageUrl,
          message: "Dados Open Graph obtidos com sucesso.",
        };
      }
    } else {
      console.error(
        "[openGraphActions] Erro ao buscar Open Graph data:",
        error,
        "Detalhes:",
        result?.ogTitle,
        result?.ogDescription,
        result?.errorDetails
      );
    }
  } catch (e) {
    console.error("[openGraphActions] Exceção ao tentar Open Graph:", e);
    // Se falhar o Open Graph, continuamos para o método manual
  }

  // Segunda tentativa: métodos específicos para plataformas conhecidas
  try {
    const urlObj = new URL(url);

    // Método específico para YouTube
    if (
      urlObj.hostname.includes("youtube.com") ||
      urlObj.hostname.includes("youtu.be")
    ) {
      // Extrair videoId para URLs padrão do YouTube
      let videoId = urlObj.searchParams.get("v");

      // Lidar com URLs abreviadas do YouTube (youtu.be)
      if (!videoId && urlObj.hostname.includes("youtu.be")) {
        videoId = urlObj.pathname.substring(1);
      }

      if (videoId) {
        // Construir URL da thumbnail do YouTube diretamente
        const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        return {
          success: true,
          imageUrl: thumbnailUrl,
          message: "Thumbnail do YouTube obtida diretamente.",
        };
      }
    }

    // Aqui poderíamos adicionar métodos para outras plataformas (Twitch, Vimeo, etc.)

    // Se chegamos aqui, não conseguimos obter imagem por nenhum método
    return {
      success: true, // Ainda consideramos a operação um sucesso
      imageUrl: null,
      message:
        "Não foi possível encontrar uma imagem de preview para esta URL.",
    };
  } catch (e: any) {
    console.error("[openGraphActions] Exceção em getOpenGraphData:", e);
    return {
      success: false,
      error: "Ocorreu um erro inesperado ao processar a URL.",
      message: e.message || "Erro desconhecido.",
    };
  }
}
