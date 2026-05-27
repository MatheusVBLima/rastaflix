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
