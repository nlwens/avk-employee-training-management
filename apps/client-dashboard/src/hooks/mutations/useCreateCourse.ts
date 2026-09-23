import {
  API,
  type ApiError,
  type Chapter,
  type CourseDetail,
  type CourseStats,
  courseChaptersQueryOptions,
  courseQueryOptions,
  coursesListQueryKey,
  courseStatsQueryOptions,
  useMutation,
  useQueryClient,
} from "api/src";
import {
  type CourseFormValues,
  mapCourseFormValuesToCreateCourse,
} from "../../components/courses/courseFormValues";

export const useCreateCourse = () => {
  const queryClient = useQueryClient();

  return useMutation<CourseDetail, ApiError, CourseFormValues>({
    mutationFn: (course: CourseFormValues) =>
      API.post<CourseDetail>(
        "/courses",
        mapCourseFormValuesToCreateCourse(course),
      ),

    onSuccess: (createdCourse) => {
      queryClient.setQueryData<CourseDetail>(
        courseQueryOptions(createdCourse.id).queryKey,
        createdCourse,
      );

      queryClient.setQueryData<Chapter[]>(
        courseChaptersQueryOptions(createdCourse.id).queryKey,
        [],
      );

      queryClient.setQueryData<CourseStats>(
        courseStatsQueryOptions(createdCourse.id).queryKey,
        { averageScore: 0 },
      );

      // As we cannot be sure in what queries the course will land (it depends
      // on the filters), we shall invalidate all such queries.
      void queryClient.invalidateQueries({ queryKey: coursesListQueryKey });
    },
  });
};
