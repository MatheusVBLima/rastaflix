"use client";

import { useEffect, useState } from "react";
import { useQueryState } from "nuqs";
import type { ParserBuilder } from "nuqs";

/**
 * Synchronizes a local input string with a URL query parameter and debounces updates from the input back to the URL.
 *
 * Keeps a controlled input state initialized from the query value (or empty string) and updates the URL query parameter
 * only after the local input has been stable for the specified debounce interval.
 *
 * @param key - The query parameter name to read and write
 * @param parser - A parser/serializer builder used to read and validate the query value
 * @param debounceMs - Milliseconds to wait after the last input change before writing the value to the URL (default: 300)
 * @returns A read-only tuple of `[inputValue, setInputValue]` for use with controlled inputs
 */
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
