import { useTranslation } from "react-i18next";
import { localize, type LocalizeFn } from "../localize";

/**
 * React hook that returns a `localize` function pre-bound to the currently
 * active i18n language.
 *
 * Use it inside components that render backend-provided translated content
 * (e.g., course titles, question text). The returned function automatically
 * picks the right translation for the language the user has selected, with a
 * fallback chain; see `localize` for the full priority rules.
 *
 * ```tsx
 * function CourseCard({ course }: { course: ApiCourse }) {
 *   const { localize } = useLocalize();
 *   return <h2>{localize(course.translations, "title")}</h2>;
 * }
 * ```
 */
export function useLocalize(): { localize: LocalizeFn } {
  const { t, i18n } = useTranslation();

  return {
    localize: (translations, key, defaultValue = "") =>
      localize(
        translations,
        key,
        defaultValue || t(($) => $.common.unknown),
        i18n.resolvedLanguage || i18n.language,
      ),
  };
}
