export const ENGLISH_LOCALE = 'en';
export const DUTCH_LOCALE = 'nl';

export const SUPPORTED_LOCALES = [ENGLISH_LOCALE, DUTCH_LOCALE] as const;
export const DEFAULT_LOCALE = DUTCH_LOCALE;

export type LocaleCode = (typeof SUPPORTED_LOCALES)[number];
