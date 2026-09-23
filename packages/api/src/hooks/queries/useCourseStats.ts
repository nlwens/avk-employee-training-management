import { useSuspenseQuery } from "@tanstack/react-query";
import { courseStatsQueryOptions } from "../../queries/courses.queries";

export const useCourseStats = (courseId: string) =>
  useSuspenseQuery(courseStatsQueryOptions(courseId));
