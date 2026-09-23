import type { Course } from "@api/src";

export type DashboardCourse = Omit<
  Course,
  "completedChaptersCount" | "correctAnswersCount"
>;
