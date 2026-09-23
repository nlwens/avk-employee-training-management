import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  API,
  courseQueryOptions,
  coursesListQueryKey,
  type ApiError,
  type CourseDetail,
  type UpdateCourse,
} from "@api/src";

interface UpdateCourseVariables {
  courseId: string;
  body: UpdateCourse;
}

export const useUpdateCourse = () => {
  const queryClient = useQueryClient();

  return useMutation<CourseDetail, ApiError, UpdateCourseVariables>({
    mutationFn: ({ courseId, body }: UpdateCourseVariables) =>
      API.patch<CourseDetail>(`/courses/${courseId}`, body),
    onSuccess: (updatedCourse, { courseId }) => {
      queryClient.setQueryData(
        courseQueryOptions(courseId).queryKey,
        updatedCourse,
      );

      // Invalidate all course listings, as the course might be categorized
      // differently, based on the query parameters.
      void queryClient.invalidateQueries({ queryKey: coursesListQueryKey });
    },
  });
};
