import {
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import {
  API,
  infiniteCoursesListQueryKey,
  type ApiError,
  type CompletedChapter,
  type Course,
  type PaginatedResponse,
} from "api/src";

interface CompleteChapterContext {
  courseId: string;
  chapterId: string;
}

export const useCompleteChapter = () => {
  const queryClient = useQueryClient();

  return useMutation<CompletedChapter, ApiError, CompleteChapterContext>({
    mutationFn: ({ courseId, chapterId }) =>
      API.post<CompletedChapter>(`/courses/${courseId}/completed-chapters`, {
        chapterId,
      }),
    onSuccess: (data, { courseId }) => {
      queryClient.setQueryData<CompletedChapter[]>(
        ["courses", courseId, "completed-chapters"],
        (prev = []) => [...prev, data],
      );

      // Increment completedChaptersCount on the single-course cache entry.
      queryClient.setQueryData<Course>(
        ["courses", courseId],
        (course) =>
          course && {
            ...course,
            completedChaptersCount: course.completedChaptersCount + 1,
          },
      );

      // Increment completedChaptersCount inside the infinite course list cache.
      queryClient.setQueriesData<InfiniteData<PaginatedResponse<Course>>>(
        { queryKey: infiniteCoursesListQueryKey },
        (prev) =>
          prev && {
            ...prev,
            pages: prev.pages.map((page) => ({
              ...page,
              data: page.data.map((course) =>
                course.id === courseId
                  ? {
                      ...course,
                      completedChaptersCount: course.completedChaptersCount + 1,
                    }
                  : course,
              ),
            })),
          },
      );
    },
    onError: (error, { courseId }) => {
      if (error.statusCode === 409) {
        void queryClient.invalidateQueries({
          queryKey: ["courses", courseId, "completed-chapters"],
        });
      }
    },
  });
};
