import {
  API,
  useMutation,
  useQueryClient,
  type ApiError,
  type Chapter,
} from "@api/src";
import type { ChapterFormValues } from "@ui/components/forms/validators";
import { mapChapterFormValuesToCreateChapter } from "../../components/chapters/chapterFormValues";

interface CreateChapterVariables {
  chapter: ChapterFormValues;
  courseId: string;
}

export const useCreateChapter = () => {
  const queryClient = useQueryClient();

  return useMutation<Chapter, ApiError, CreateChapterVariables>({
    mutationFn: ({ courseId, chapter }) =>
      API.post<Chapter>(
        `/courses/${courseId}/chapters`,
        mapChapterFormValuesToCreateChapter(chapter),
      ),

    onSuccess: (createdChapter: Chapter) => {
      const cacheKey = ["courses", createdChapter.courseId, "chapters"];

      const previous = queryClient.getQueryData<Chapter[]>(cacheKey) ?? [];
      queryClient.setQueryData(cacheKey, [...previous, createdChapter]);
    },
  });
};
