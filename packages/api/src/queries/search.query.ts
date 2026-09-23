import queryString from "query-string";

export interface SearchQueryOptions {
  search?: string | null;
}

export const buildSearchEndpoint = (
  endpoint: string,
  search?: string | null,
) => {
  return queryString.stringifyUrl(
    {
      url: endpoint,
      query: {
        search: search || undefined,
      },
    },
    {
      skipNull: true,
    },
  );
};
