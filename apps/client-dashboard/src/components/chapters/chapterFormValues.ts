import type { ChapterFormValues } from "@ui/components/forms/validators";
import type { CreateChapter } from "api/src";

export const toChapterTranslationInputs = (
  translations: ChapterFormValues["translations"],
) =>
  Object.entries(translations)
    .map(([locale, data]) => ({
      locale,
      title: data.title.trim(),
    }))
    .filter((translation) => translation.title.length > 0);

export const mapChapterFormValuesToCreateChapter = (
  chapter: ChapterFormValues,
): CreateChapter => ({
  order: chapter.order,
  translations: toChapterTranslationInputs(chapter.translations),
});
