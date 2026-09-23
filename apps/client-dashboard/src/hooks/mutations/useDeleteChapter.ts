import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  API,
  chapterQueryOptions,
  courseChaptersQueryOptions,
  type ApiError,
  type Chapter,
} from "@api/src";

interface DeleteChapterVariables {
  courseId: string;
  chapterId: string;
}

export const useDeleteChapter = () => {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, DeleteChapterVariables>({
    mutationFn: ({ courseId, chapterId }) =>
      API.delete<void>(`/courses/${courseId}/chapters/${chapterId}`),
    onSuccess: (_data, { courseId, chapterId }) => {
      queryClient.removeQueries({
        queryKey: chapterQueryOptions(courseId, chapterId).queryKey,
      });
      queryClient.setQueryData<Chapter[]>(
        courseChaptersQueryOptions(courseId).queryKey,
        (chapters) => chapters?.filter((chapter) => chapter.id !== chapterId),
      );
    },
  });
};
