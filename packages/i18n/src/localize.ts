import { DEFAULT_LOCALE } from "./locale";

type BaseTranslation = { localeCode: string };

export type LocalizeFn = <T extends BaseTranslation>(
  translations: T[],
  key: keyof T & string,
  defaultValue?: string,
) => string;

/**
 * Select the best available translation for a given key using the following:
 *
 * 1. Current language: the value for the active locale.
 * 2. Default locale: fallback when the current locale has no entry.
 * 3. First item: used when the default locale is also missing.
 * 4. `defaultValue`: returned as a last resort when the array is empty.
 *
 * Prefer calling this through `useLocalize` in components so that the locale
 * is automatically bound to the active i18n language. Call this function
 * directly (passing an explicit `locale`) for non-React contexts.
 */
export function localize<T extends BaseTranslation>(
  translations: T[],
  key: keyof T & string,
  defaultValue: string = "",
  locale: string = DEFAULT_LOCALE,
): string {
  // If no translations are provided, immediately return the default value.
  if (translations.length === 0) {
    return defaultValue;
  }

  // First, try to find a translation for the current language.
  let translation = translations.find((t) => t.localeCode === locale);
  if (translation && key in translation) {
    return translation[key] as string;
  }

  // If no translation is found for the current language, try to find one for the default.
  translation = translations.find((t) => t.localeCode === DEFAULT_LOCALE);
  if (translation && key in translation) {
    return translation[key] as string;
  }

  // There is no translation for the current language or the default; return the first one.
  translation = translations[0] as T;
  if (key in translation) {
    return translation[key] as string;
  }

  // The translation key is not found in any translation; return the default value.
  return defaultValue;
}
