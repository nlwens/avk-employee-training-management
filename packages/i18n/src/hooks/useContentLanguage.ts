import { useTranslation } from "react-i18next";
import { type SupportedLanguage } from "..";

/**
 * Returns the active application locale as a supported language.
 */
export function useContentLanguage(): SupportedLanguage {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language;

  return language.split("-")[0] as SupportedLanguage;
}
