import * as React from "react";
import queryString from "query-string";

const URL_SEARCH_PARAMS_CHANGE_EVENT = "url-search-params-change";

export interface SetUrlSearchParamOptions {
  paramName: string;
  value: string;
  replace?: boolean;
}

export const getUrlSearchParam = (paramName: string): string => {
  if (typeof window === "undefined") {
    return "";
  }

  const parsedQuery = queryString.parse(window.location.search);
  const value = parsedQuery[paramName];

  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
};

export const setUrlSearchParam = ({
  paramName,
  value,
  replace = true,
}: SetUrlSearchParamOptions) => {
  if (typeof window === "undefined") {
    return;
  }

  const parsedQuery = queryString.parse(window.location.search);
  const nextQuery = { ...parsedQuery };
  const trimmedValue = value.trim();

  if (trimmedValue) {
    nextQuery[paramName] = trimmedValue;
  } else {
    delete nextQuery[paramName];
  }

  const nextUrl = queryString.stringifyUrl(
    {
      url: window.location.pathname,
      query: nextQuery,
    },
    {
      skipEmptyString: true,
      skipNull: true,
    },
  );

  const nextLocation = `${nextUrl}${window.location.hash}`;
  const currentLocation = `${window.location.pathname}${window.location.search}${window.location.hash}`;

  if (nextLocation === currentLocation) {
    return;
  }

  const historyMethod = replace ? "replaceState" : "pushState";

  window.history[historyMethod](window.history.state, "", nextLocation);
  window.dispatchEvent(new Event(URL_SEARCH_PARAMS_CHANGE_EVENT));
};

const subscribeToUrlSearchParams = (onStoreChange: () => void) => {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  window.addEventListener("popstate", onStoreChange);
  window.addEventListener(URL_SEARCH_PARAMS_CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("popstate", onStoreChange);
    window.removeEventListener(URL_SEARCH_PARAMS_CHANGE_EVENT, onStoreChange);
  };
};

export const useUrlSearchParam = (paramName = "search") => {
  return React.useSyncExternalStore(
    subscribeToUrlSearchParams,
    () => getUrlSearchParam(paramName),
    () => "",
  );
};
