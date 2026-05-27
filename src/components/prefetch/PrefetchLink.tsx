"use client";

import Link, { type LinkProps } from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useRef, type ReactNode } from "react";
import { prefetchRouteData } from "@/lib/prefetch";

type PrefetchLinkProps = LinkProps & {
  children: ReactNode;
  queryKey: readonly unknown[];
  queryFn: () => Promise<unknown>;
  prefetchDelay?: number;
  className?: string;
};

/**
 * Render a Next.js Link that prefetches the target route and associated query data on user intent.
 *
 * Prefetching is scheduled on mouse enter after a debounce, canceled on mouse leave/blur, and triggered immediately on focus.
 *
 * @param queryKey - React Query key used to prefetch the associated data for the target route
 * @param queryFn - Function that fetches the data for `queryKey` when prefetching
 * @param prefetchDelay - Delay in milliseconds before initiating prefetch on hover (default: 300)
 * @param className - Optional CSS class applied to the rendered Link
 * @returns A Link element that wraps `children` and triggers route and data prefetching on user intent
 */
export function PrefetchLink({
  children,
  queryKey,
  queryFn,
  prefetchDelay = 300,
  className,
  ...linkProps
}: PrefetchLinkProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );

  const runPrefetch = () => {
    const href = typeof linkProps.href === "string" ? linkProps.href : linkProps.href.pathname ?? "";
    router.prefetch(href);
    void queryClient.prefetchQuery({ queryKey, queryFn });
    void prefetchRouteData(href);
  };

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(runPrefetch, prefetchDelay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const handleFocus = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    runPrefetch();
  };

  return (
    <Link
      {...linkProps}
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleMouseLeave}
    >
      {children}
    </Link>
  );
}
