import queryString from "query-string";
import type {
  InfiniteData,
  QueryClient,
  UseSuspenseQueryOptions,
} from "@tanstack/react-query";
import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { API } from "../api";
import type { PaginatedResponse } from "../types";
import type {
  Course,
  CourseDetail,
  CourseStats,
  CourseQuizResult,
} from "../types/courses";

export interface CoursesQueryOptions {
  search?: string | null;
  published?: boolean;
  finished?: boolean;
  page?: number;
  limit?: number;
}

export const coursesListQueryKey = ["courses", "list"] as const;
export const infiniteCoursesListQueryKey = [
  ...coursesListQueryKey,
  "infinite",
] as const;

export const coursesQueryOptions = ({
  search,
  published,
  finished,
  page,
  limit,
}: CoursesQueryOptions = {}) => {
  const trimmedSearch = search?.trim() ?? "";

  // Build only the params that are actively set.
  const params = {
    ...(trimmedSearch && { search: trimmedSearch }),
    ...(published !== undefined && { published }),
    ...(finished !== undefined && { finished }),
    ...(page !== undefined && { page }),
    ...(limit !== undefined && { limit }),
  } satisfies CoursesQueryOptions;

  return queryOptions({
    queryKey: [...coursesListQueryKey, params],
    queryFn: () =>
      API.get<PaginatedResponse<Course>>(
        queryString.stringifyUrl(
          { url: "/courses", query: params },
          { skipNull: true },
        ),
      ),
  });
};

export const infiniteCoursesQueryOptions = ({
  search,
  published,
  finished,
  limit,
}: Omit<CoursesQueryOptions, "page"> = {}) => {
  const trimmedSearch = search?.trim() ?? "";

  const params = {
    ...(trimmedSearch && { search: trimmedSearch }),
    ...(published !== undefined && { published }),
    ...(finished !== undefined && { finished }),
    ...(limit !== undefined && { limit }),
  } satisfies CoursesQueryOptions;

  return infiniteQueryOptions({
    queryKey: [...infiniteCoursesListQueryKey, params],
    queryFn: ({ pageParam }) =>
      API.get<PaginatedResponse<Course>>(
        queryString.stringifyUrl(
          { url: "/courses", query: { ...params, page: pageParam } },
          { skipNull: true },
        ),
      ),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.pages ? lastPage.page + 1 : undefined,
  });
};

export const courseQueryOptions = (courseId: string) =>
  queryOptions({
    queryKey: ["courses", courseId],
    queryFn: () => API.get<CourseDetail>(`/courses/${courseId}`),
  });

export const courseStatsQueryOptions = (courseId: string) =>
  queryOptions({
    queryKey: ["courses", courseId, "stats"],
    queryFn: () => API.get<CourseStats>(`/courses/${courseId}/stats`),
  });

export const courseQuizResultsQueryOptions = (courseId: string) =>
  queryOptions({
    queryKey: ["courses", courseId, "quiz-results"],
    queryFn: () =>
      API.get<CourseQuizResult[]>(`/courses/${courseId}/quiz-results`),
  });

/** Find a course in the cache, returning it alongside its cache timestamp. */
const findCourseInCache = (
  courseId: string,
  queryClient: QueryClient,
): { course: Course; time: number | undefined } | undefined => {
  const entries = queryClient.getQueriesData<unknown>({
    queryKey: coursesListQueryKey,
  });

  for (const [key, data] of entries) {
    if (!data) {
      continue;
    }

    let found: Course | undefined;

    if ("pages" in (data as object)) {
      // The "pages" property can be found only in infinite queries.
      found = (data as InfiniteData<PaginatedResponse<Course>>).pages
        .flatMap((page) => page.data)
        .find((course) => course.id === courseId);
    } else if ("data" in (data as object)) {
      // The "data" property is most likely to be found only in paginated queries.
      found = (data as PaginatedResponse<Course>).data.find(
        (course) => course.id === courseId,
      );
    }

    if (found) {
      return {
        course: found,
        time: queryClient.getQueryState(key)?.dataUpdatedAt,
      };
    }
  }

  return undefined;
};

/**
 * Extends courseQueryOptions with initialData seeded from the courses-list
 * cache, so the page shows the course immediately without a loading state.
 */
export const courseQueryOptionsWithCache = (
  courseId: string,
  queryClient: QueryClient,
): UseSuspenseQueryOptions<Course, unknown> => ({
  ...(courseQueryOptions(courseId) as UseSuspenseQueryOptions<Course, unknown>),
  initialData: () => findCourseInCache(courseId, queryClient)?.course,
  initialDataUpdatedAt: () => findCourseInCache(courseId, queryClient)?.time,
});
