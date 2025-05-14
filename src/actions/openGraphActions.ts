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
  console.log("[openGraphActions] Iniciando getOpenGraphData para URL:", url);

  if (!url || !url.startsWith("http")) {
    console.log("[openGraphActions] URL inválida:", url);
    return {
      success: false,
      error: "URL inválida.",
      message: "Por favor, insira uma URL válida começando com http ou https.",
    };
  }

  // Primeira tentativa: usar open-graph-scraper para todas as URLs
  try {
    console.log("[openGraphActions] Tentando método Open Graph para:", url);
    const options = {
      url,
      timeout: 4000,
      headers: { "user-agent": "Rastaflix-Preview-Bot/1.0" },
    };

    console.log(
      "[openGraphActions] Chamando ogs com opções:",
      JSON.stringify(options)
    );
    const { result, error } = await ogs(options).catch((e) => {
      console.error("[openGraphActions] Erro ao chamar ogs diretamente:", e);
      // Se ogs falhar com erro de promise, retorna um objeto com error para manter o fluxo
      return { result: null, error: e };
    });

    console.log(
      "[openGraphActions] Resposta de ogs - error:",
      error,
      "result success:",
      result?.success
    );

    if (!error && result && result.success) {
      const imageUrl =
        result.ogImage && result.ogImage[0] ? result.ogImage[0].url : null;

      console.log("[openGraphActions] OG Image URL encontrada:", imageUrl);

      if (imageUrl) {
        // Se o Open Graph retornou uma imagem, usamos ela
        return {
          success: true,
          imageUrl,
          message: "Dados Open Graph obtidos com sucesso.",
        };
      }

      // Se chegamos aqui, o Open Graph funcionou mas não encontrou imagem
      console.log(
        "[openGraphActions] Open Graph não retornou imagem, tentando método manual"
      );
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
    console.log("[openGraphActions] Tentando método manual para:", url);
    const urlObj = new URL(url);

    // Método específico para YouTube
    if (
      urlObj.hostname.includes("youtube.com") ||
      urlObj.hostname.includes("youtu.be")
    ) {
      console.log("[openGraphActions] URL identificada como YouTube");

      // Extrair videoId para URLs padrão do YouTube
      let videoId = urlObj.searchParams.get("v");
      console.log("[openGraphActions] videoId do parâmetro 'v':", videoId);

      // Lidar com URLs abreviadas do YouTube (youtu.be)
      if (!videoId && urlObj.hostname.includes("youtu.be")) {
        videoId = urlObj.pathname.substring(1);
        console.log(
          "[openGraphActions] videoId do pathname (youtu.be):",
          videoId
        );
      }

      if (videoId) {
        // Construir URL da thumbnail do YouTube diretamente
        const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        console.log(
          "[openGraphActions] Thumbnail URL construída:",
          thumbnailUrl
        );
        return {
          success: true,
          imageUrl: thumbnailUrl,
          message: "Thumbnail do YouTube obtida diretamente.",
        };
      } else {
        console.log(
          "[openGraphActions] Não foi possível extrair videoId do YouTube"
        );
      }
    } else {
      console.log(
        "[openGraphActions] URL não identificada como plataforma conhecida:",
        urlObj.hostname
      );
    }

    // Aqui poderíamos adicionar métodos para outras plataformas (Twitch, Vimeo, etc.)

    // Se chegamos aqui, não conseguimos obter imagem por nenhum método
    console.log("[openGraphActions] Nenhum método conseguiu obter imagem");
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
