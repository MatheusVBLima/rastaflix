import {
  Query,
  QueryClient,
  defaultShouldDehydrateQuery,
  isServer,
} from "@tanstack/react-query";

/**
 * Create a React Query client preconfigured with the application's default query options.
 *
 * @returns A new `QueryClient` configured with 30-minute `staleTime`, 24-hour `gcTime`, automatic refetching on window focus/reconnect/mount disabled, and `retry` set to 2.
 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 30,
        gcTime: 1000 * 60 * 60 * 24,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount: false,
        retry: 2,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

/**
 * Provide a QueryClient appropriate for the current environment.
 *
 * On the server this returns a new QueryClient instance; in the browser it
 * returns a lazily-initialized, module-scoped singleton.
 *
 * @returns A new `QueryClient` when running on the server, otherwise the cached browser `QueryClient` instance.
 */
export function getQueryClient() {
  if (isServer) {
    return makeQueryClient();
  }

  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }

  return browserQueryClient;
}

/**
 * Determines whether a query should be dehydrated for serialization/hydration.
 *
 * @param query - The query instance to evaluate
 * @returns `true` if the query should be dehydrated, `false` otherwise
 */
export function shouldDehydrateQuery(query: Query) {
  return defaultShouldDehydrateQuery(query);
}
