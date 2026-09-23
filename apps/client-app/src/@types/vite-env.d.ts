/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

// This import makes the file a module, which is required for the declare module
// block below to augment vite-plugin-pwa rather than redeclare it from scratch.
import "vite-plugin-pwa";

import type { IconResource } from "vite-plugin-pwa";

// Redefinition of the locale code type from the API package. We cannot include
// it here as we would be including an entire tree of packages.
type LocaleCode = "en" | "nl";

type LocalizationValue =
  | string
  | { value: string; lang?: string; dir?: "ltr" | "rtl" };

/**
 * Manifest localization is supported only in Chromium 148+ (only on PC).
 * @see https://developer.chrome.com/blog/manifest-localization
 */
type ManifestLocalizations = Partial<Record<LocaleCode, LocalizationValue>>;

declare module "vite-plugin-pwa" {
  interface ManifestShortcutOption {
    name: string;
    short_name?: string;
    url: string;
    description?: string;
    icons?: IconResource[];
  }

  export interface ManifestOptions {
    /** Localized full names. Supported in Chromium 148+. */
    name_localized?: ManifestLocalizations;

    /** Localized short names. Supported in Chromium 148+. */
    short_name_localized?: ManifestLocalizations;

    /** Localized descriptions. Supported in Chromium 148+. */
    description_localized?: ManifestLocalizations;

    /** Localized icons. Supported in Chromium 148+. */
    icons_localized?: Partial<Record<LocaleCode, IconResource[]>>;

    /** Localized shortcuts. Supported in Chromium 148+. */
    shortcuts_localized?: Partial<Record<LocaleCode, ManifestShortcutOption[]>>;
  }
}
