import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { courseQueryOptionsWithCache } from "../../queries/courses.queries";

export const useCourse = (courseId: string) => {
  const queryClient = useQueryClient();
  return useSuspenseQuery(courseQueryOptionsWithCache(courseId, queryClient));
};
