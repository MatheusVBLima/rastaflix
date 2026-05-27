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

/**
 * Prefetches the historias list into the shared React Query cache.
 *
 * @returns The result of the query client's prefetch operation.
 */
export function prefetchHistorias() {
  return getQueryClient().prefetchQuery({
    queryKey: queryKeys.historias.list(),
    queryFn: fetchHistorias,
  });
}

/**
 * Prefetches the musics list into the shared React Query cache.
 *
 * @returns The musics list data cached under the `musicas.list` query key, or `undefined` if the query produced no data
 */
export function prefetchMusicas() {
  return getQueryClient().prefetchQuery({
    queryKey: queryKeys.musicas.list(),
    queryFn: fetchMusicas,
  });
}

/**
 * Prefetches the esculachos list into the shared query cache.
 *
 * @returns The result of the prefetch operation containing the esculachos list data
 */
export function prefetchEsculachos() {
  return getQueryClient().prefetchQuery({
    queryKey: queryKeys.esculachos.list(),
    queryFn: fetchEsculachos,
  });
}

/**
 * Prefetches the inimigos list into the shared React Query cache.
 *
 * @returns The result of the query client's prefetch operation.
 */
export function prefetchInimigos() {
  return getQueryClient().prefetchQuery({
    queryKey: queryKeys.inimigos.list(),
    queryFn: fetchInimigos,
  });
}

/**
 * Prefetches the clipes list into the shared query cache.
 *
 * @returns The prefetched `clipes` list data, or `undefined` if no data was fetched.
 */
export function prefetchClipes() {
  return getQueryClient().prefetchQuery({
    queryKey: queryKeys.clipes.list(),
    queryFn: fetchClipes,
  });
}

/**
 * Prefetches Rasta Awards data: the current active season and, if one exists, that season's voting data.
 *
 * Fetches the active season from the shared query client and, when an active season is returned,
 * prefetches voting data scoped to that season's id.
 */
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

/**
 * Triggers any registered data prefetcher for the given route path.
 *
 * @param href - The route path to prefetch (e.g., "/historias")
 * @returns The result of the route's prefetcher, or `undefined` if no prefetcher is registered
 */
export function prefetchRouteData(href: string) {
  const prefetcher = routePrefetchers[href];
  if (!prefetcher) return Promise.resolve();
  return prefetcher();
}
