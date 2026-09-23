import { queryOptions } from "@tanstack/react-query";
import type {
  QueryClient,
  UseSuspenseQueryOptions,
} from "@tanstack/react-query";
import { API } from "../api";
import type { Chapter } from "../types/chapters";
import type { CompletedChapter } from "../types/completed-chapters";

export const courseChaptersQueryOptions = (courseId: string) =>
  queryOptions({
    queryKey: ["courses", courseId, "chapters"],
    queryFn: () => API.get<Chapter[]>(`/courses/${courseId}/chapters`),
  });

export const chapterQueryOptions = (courseId: string, chapterId: string) =>
  queryOptions({
    queryKey: ["courses", courseId, "chapters", chapterId],
    queryFn: () =>
      API.get<Chapter>(`/courses/${courseId}/chapters/${chapterId}`),
  });

/**
 * Extends chapterQueryOptions with initialData seeded from the course chapters
 * cache, so the page shows the chapter immediately without a loading state.
 */
export const chapterQueryOptionsWithCache = (
  courseId: string,
  chapterId: string,
  queryClient: QueryClient,
): UseSuspenseQueryOptions<Chapter, unknown> => ({
  ...(chapterQueryOptions(courseId, chapterId) as UseSuspenseQueryOptions<
    Chapter,
    unknown
  >),
  initialData: () =>
    queryClient
      .getQueryData<Chapter[]>(courseChaptersQueryOptions(courseId).queryKey)
      ?.find((chapter) => chapter.id === chapterId),
  initialDataUpdatedAt: () =>
    queryClient.getQueryState(courseChaptersQueryOptions(courseId).queryKey)
      ?.dataUpdatedAt,
});

export const completedChaptersQuery = (courseId: string) =>
  queryOptions({
    queryKey: ["courses", courseId, "completed-chapters"],
    queryFn: () =>
      API.get<CompletedChapter[]>(`/courses/${courseId}/completed-chapters`),
  });
