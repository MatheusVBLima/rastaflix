"use client";

import { useEffect, useState } from "react";
import { useQueryState } from "nuqs";
import type { ParserBuilder } from "nuqs";

export function useDebouncedQueryState(
  key: string,
  parser: ParserBuilder<string>,
  debounceMs = 300
) {
  const [urlValue, setUrlValue] = useQueryState(key, parser);
  const [inputValue, setInputValue] = useState(urlValue ?? "");

  useEffect(() => {
    setInputValue(urlValue ?? "");
  }, [urlValue]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (inputValue !== urlValue) {
        void setUrlValue(inputValue || null);
      }
    }, debounceMs);
    return () => clearTimeout(timeout);
  }, [inputValue, urlValue, setUrlValue, debounceMs]);

  return [inputValue, setInputValue] as const;
}
