import { infiniteQueryOptions } from "@tanstack/react-query";
import queryString from "query-string";

import { API } from "../api";
import type { PaginatedResponse } from "../types";
import type { Course } from "../types/courses";

const COURSE_STATS_PAGE_LIMIT = 20;

/**
 * Fetches employee course stats page-by-page.
 *
 * This query maps directly to the real API response from
 * GET /users/:userId/course-stats. Dashboard-only display state is built in
 * the dashboard app, not in the API package.
 */
export const infiniteUserCourseStatsQueryOptions = (userId: string) =>
  infiniteQueryOptions({
    queryKey: [
      "users",
      userId,
      "course-stats",
      "infinite",
      { limit: COURSE_STATS_PAGE_LIMIT },
    ],
    queryFn: ({ pageParam }) =>
      API.get<PaginatedResponse<Course>>(
        queryString.stringifyUrl({
          url: `/users/${userId}/course-stats`,
          query: {
            page: pageParam,
            limit: COURSE_STATS_PAGE_LIMIT,
          },
        }),
      ),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.pages ? lastPage.page + 1 : undefined,
  });
