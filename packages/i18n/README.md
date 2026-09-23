# i18n

Shared internationalization package that may be used by React applications. It initializes [i18next][i18next] with the
supported locales, browser language detection, and exposes two translation systems: **static** translations for fixed UI
strings, and **dynamic** translations for locale-specific content that comes from the backend server.

Import the package in the application entry point to ensure i18next is initialized before any component renders:

```ts
import "i18n";
```

## Static Translations

Static translations cover fixed UI strings such as button labels, headings, and error messages. They are stored in JSON
files under `locales/<locale>/` and resolved at build time.

### Translation syntax

`useTranslation` is imported directly from `react-i18next`. Translations are called using a selector function, which
provides full TypeScript safety and IDE auto-complete:

```tsx
import { useTranslation } from "react-i18next";

const { t } = useTranslation(["courses", "common"]);

<h1>{t(($) => $.courses.form.title)}</h1>
<button>{t(($) => $.common.save)}</button>
```

> [!important]
> You must specify the namespaces that contain the keys you want to translate for `useTranslation()`.

The `$` proxy represents all resources across imported namespaces. The first path segment is always the namespace name
(`courses`, `common`, `auth`, etc.), followed by the nested key path. TypeScript will error on any path that does not
exist in the locale files.

### Namespaces

Strings are split across focused namespace files. Use the namespace that matches the feature area (`courses`, `quiz`,
`auth`, etc.). The `common` namespace is for generic UI elements (buttons, labels) that are context-specific.

### Pluralization

For strings that depend on a count, define `_one` and `_other` suffixed variants instead of separate keys. i18next
selects the correct form automatically based on the `count` interpolation value.

```json
"chapter": {
  "count_one": "{{count}} chapter",
  "count_other": "{{count}} chapters"
}
```

```tsx
<span>{t(($) => $.courses.chapter.count, { count: chapterCount })}</span>
```

> [!important]
> The interpolation variable must be named `count`.

> [!tip]
> For more pluralization options, see the [i18next documentation](https://www.i18next.com/translation-function/plurals).

Both the key lookup and plural resolution happen inside `t`; the call site always uses the base key.

### Adding New Strings

1. Add the key to `locales/en/<namespace>.json` (English is the source language).
2. Add the matching key to other locales (e.g., `locales/nl/<namespace>.json`).
3. If it is a new namespace, add the import and entry to `src/resources.ts`.

## Language Detection

The package uses [i18next-browser-languageDetector][detector] to automatically detect the user's language. Detection
order:

1. `localStorage` key `"language"` (set when the user explicitly switches the language)
2. Browser/OS language (`navigator.language`)

Detected language is cached to `localStorage` automatically. Changing the language via `i18n.changeLanguage(locale)`
persists the selection for the next visit.

## Supported Locales and Fallback

Currently supported: `"en"` (English) and `"nl"` (Dutch). English (`"en"`) is the source and fallback language; if a
key is missing from another locale, i18next falls back to the English string automatically.

## Dynamic Translations

Dynamic translations cover content that is stored in the database and returned from the backend as an array of locale
objects. Each element carries a `localeCode` field that identifies its language, plus the translatable fields for that
resource.

### `useLocalize`

Hook that returns a `localize` function bound to the user's current language. Use it inside React components wherever
backend translations need to be rendered.

```tsx
import { useLocalize } from "i18n";

const { localize } = useLocalize();

<h1>{localize(course.translations, "title", t(($) => $.common.unknown))}</h1>;
```

### Selection Priority

`useLocalize` applies a four-step fallback chain when resolving a translation:

1. Translation for the current user language
2. Translation for the default locale (see `DEFAULT_LOCALE`)
3. First item in the translation array
4. The provided default value

### `DEFAULT_LOCALE`

Exported constant that holds the locale code used in fallback step 2. Import it when you need to reference the default
locale explicitly.

```ts
import { DEFAULT_LOCALE } from "i18n";
```

To change the default locale, update this constant in `src/locale.ts`.

[i18next]: https://www.i18next.com/
[detector]: https://github.com/i18next/i18next-browser-languageDetector
