import { getQueryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";
import {
  fetchActiveSeason,
  fetchClipes,
  fetchEsculachos,
  fetchHistorias,
  fetchInimigos,
  fetchMusicas,
  fetchVotingData,
} from "@/lib/queries";

export function prefetchHistorias() {
  return getQueryClient().prefetchQuery({
    queryKey: queryKeys.historias.list(),
    queryFn: fetchHistorias,
  });
}

export function prefetchMusicas() {
  return getQueryClient().prefetchQuery({
    queryKey: queryKeys.musicas.list(),
    queryFn: fetchMusicas,
  });
}

export function prefetchEsculachos() {
  return getQueryClient().prefetchQuery({
    queryKey: queryKeys.esculachos.list(),
    queryFn: fetchEsculachos,
  });
}

export function prefetchInimigos() {
  return getQueryClient().prefetchQuery({
    queryKey: queryKeys.inimigos.list(),
    queryFn: fetchInimigos,
  });
}

export function prefetchClipes() {
  return getQueryClient().prefetchQuery({
    queryKey: queryKeys.clipes.list(),
    queryFn: fetchClipes,
  });
}

export async function prefetchRastaAwards() {
  const queryClient = getQueryClient();
  const activeSeason = await queryClient.fetchQuery({
    queryKey: queryKeys.rastaAwards.activeSeason(),
    queryFn: fetchActiveSeason,
  });

  if (activeSeason) {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.rastaAwards.votingData(activeSeason.id),
      queryFn: () => fetchVotingData(activeSeason.id),
    });
  }
}

const routePrefetchers: Record<string, () => Promise<unknown>> = {
  "/historias": prefetchHistorias,
  "/musicas": prefetchMusicas,
  "/esculachos": prefetchEsculachos,
  "/inimigos": prefetchInimigos,
  "/clipes": prefetchClipes,
  "/rasta-awards": prefetchRastaAwards,
};

export function prefetchRouteData(href: string) {
  const prefetcher = routePrefetchers[href];
  if (!prefetcher) return Promise.resolve();
  return prefetcher();
}
