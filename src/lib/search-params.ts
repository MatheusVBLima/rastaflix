import {
  createSearchParamsCache,
  parseAsString,
} from "nuqs/server";

export const historiasSearchParams = {
  busca: parseAsString.withDefault(""),
  tag: parseAsString.withDefault("todas"),
};

export const esculachosSearchParams = {
  busca: parseAsString.withDefault(""),
};

export const historiasParamsCache = createSearchParamsCache(
  historiasSearchParams
);

export const esculachosParamsCache = createSearchParamsCache(
  esculachosSearchParams
);
