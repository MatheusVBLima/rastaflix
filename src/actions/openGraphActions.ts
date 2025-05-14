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

  try {
    const options = {
      url,
      timeout: 4000,
      headers: { "user-agent": "Rastaflix-Preview-Bot/1.0" },
    }; // Timeout e user-agent para evitar problemas
    const { result, error } = await ogs(options);

    if (error || !result.success) {
      console.error(
        "Erro ao buscar Open Graph data:",
        result?.ogTitle,
        result?.ogDescription,
        result?.errorDetails
      );
      return {
        success: false,
        error: "Não foi possível obter dados de preview da URL.",
        message: result.error
          ? `Detalhes: ${result.error}`
          : "Verifique se a URL é pública e possui metadags Open Graph.",
      };
    }

    const imageUrl =
      result.ogImage && result.ogImage[0] ? result.ogImage[0].url : null;

    // Se ogs teve sucesso em ler a página, consideramos a operação um sucesso.
    // A ausência de imageUrl será tratada pelo cliente.
    return {
      success: true,
      imageUrl,
      message: imageUrl
        ? "Dados Open Graph obtidos com sucesso."
        : "Dados Open Graph obtidos, mas nenhuma imagem de preview (og:image) específica foi encontrada.",
    };
  } catch (e: any) {
    console.error("Exceção em getOpenGraphData:", e);
    return {
      success: false,
      error: "Ocorreu um erro inesperado ao processar a URL.",
      message: e.message || "Erro desconhecido.",
    };
  }
}
