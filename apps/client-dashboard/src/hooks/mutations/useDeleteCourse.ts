import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  API,
  coursesListQueryKey,
  courseQueryOptions,
  courseStatsQueryOptions,
  type ApiError,
  type Course,
} from "@api/src";

export const useDeleteCourse = () => {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (courseId: string) => API.delete<void>(`/courses/${courseId}`),
    onSuccess: (_data, courseId) => {
      queryClient.removeQueries(courseQueryOptions(courseId));
      queryClient.removeQueries(courseStatsQueryOptions(courseId));

      queryClient.setQueriesData<Course[]>(
        { queryKey: coursesListQueryKey },
        (courses) => courses?.filter((course) => course.id !== courseId),
      );
    },
  });
};
