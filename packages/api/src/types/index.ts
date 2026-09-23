export const LOCALE_CODES = ["en", "nl"] as const;

export type LocaleCode = (typeof LOCALE_CODES)[number];

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  limit: number;
  page: number;
  pages: number;
};
