"use client";

import React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { getQueryClient } from "@/lib/query-client";

interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * Wraps children with a React Query `QueryClientProvider` and, in development, renders React Query Devtools.
 *
 * @param children - Nested React content to render inside the provider.
 * @returns A React element that provides a `QueryClient` context for `children` and includes React Query Devtools when `process.env.NODE_ENV === "development"`.
 */
export default function Providers({ children }: ProvidersProps) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
