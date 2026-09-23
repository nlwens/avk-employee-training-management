/// <reference path="./@types/i18next.d.ts" />

import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import { resources, defaultNS } from "./resources";

export const SUPPORTED_LANGUAGES = ["nl", "en"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    defaultNS,
    enableSelector: "strict",

    fallbackLng: "en",
    supportedLngs: SUPPORTED_LANGUAGES,

    // Accept region variants (e.g., "en-US", "nl-NL") as matching their base
    // language. Without this, navigator.languages entries like "en-US" do not
    // match "en" in supportedLngs, so i18next skips them and may land on "nl".
    nonExplicitSupportedLngs: true,

    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "language",
    },
  });

export default i18n;

// Exporting React i18next's useTranslation hook so that our packages inherently
// import our types by importing this hook.
export { useTranslation } from "react-i18next";

export { DEFAULT_LOCALE } from "./locale";
export {
  DATE_FORMAT_LOCALE,
  dateFormatParams,
  type DateTimeFormatParams,
} from "./dateFormat";
export { resources } from "./resources";
export { useLocalize } from "./hooks/useLocalize";
export { useContentLanguage } from "./hooks/useContentLanguage";
export { localize, type LocalizeFn } from "./localize";
