/**
 * Locale used for date/time display regardless of the active UI language.
 * German formatting yields day/month/year order.
 */
export const DATE_FORMAT_LOCALE = "de";

type DateTimeFormatOptionsWithLocale = Intl.DateTimeFormatOptions & {
  locale?: string;
};

export type DateTimeFormatParams = {
  date: DateTimeFormatOptionsWithLocale;
};

/**
 * Builds i18next `formatParams` for `{{- date, datetime }}` interpolations
 * using the standard European date format locale.
 */
export function dateFormatParams(
  options: Intl.DateTimeFormatOptions,
): DateTimeFormatParams {
  return {
    date: { ...options, locale: DATE_FORMAT_LOCALE },
  };
}
