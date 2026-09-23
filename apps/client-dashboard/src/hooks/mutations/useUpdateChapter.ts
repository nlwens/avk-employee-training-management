import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  API,
  chapterQueryOptions,
  courseChaptersQueryOptions,
  type ApiError,
  type Chapter,
  type UpdateChapter,
} from "@api/src";
import type { ChapterFormValues } from "@ui/components/forms/validators";
import { toChapterTranslationInputs } from "../../components/chapters/chapterFormValues";

interface UpdateChapterVariables {
  courseId: string;
  chapterId: string;
  chapter?: ChapterFormValues;
  translations?: ChapterFormValues["translations"];
  order?: number;
}

const toUpdateChapterBody = ({
  chapter,
  translations,
  order,
}: Pick<
  UpdateChapterVariables,
  "chapter" | "translations" | "order"
>): UpdateChapter => {
  const body: UpdateChapter = {};

  if (order !== undefined) {
    body.order = order;
  }

  const sourceTranslations = chapter?.translations ?? translations;
  if (sourceTranslations) {
    body.translations = toChapterTranslationInputs(sourceTranslations);
  }

  return body;
};

export const useUpdateChapter = () => {
  const queryClient = useQueryClient();

  return useMutation<Chapter, ApiError, UpdateChapterVariables>({
    mutationFn: ({ courseId, chapterId, chapter, translations, order }) =>
      API.patch<Chapter>(
        `/courses/${courseId}/chapters/${chapterId}`,
        toUpdateChapterBody({ chapter, translations, order }),
      ),

    onSuccess: (updatedChapter, { courseId, chapterId }) => {
      queryClient.setQueryData(
        chapterQueryOptions(courseId, chapterId).queryKey,
        updatedChapter,
      );

      queryClient.setQueryData<Chapter[]>(
        courseChaptersQueryOptions(courseId).queryKey,
        (chapters) =>
          chapters
            ?.map((chapter) =>
              chapter.id === chapterId ? updatedChapter : chapter,
            )
            .sort((a, b) => a.order - b.order),
      );
    },
  });
};
