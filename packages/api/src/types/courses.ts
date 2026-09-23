import { type LocaleCode } from "./index";
import type { Group } from "./group";

export type CourseTranslation = {
  localeCode: LocaleCode;
  title: string;
  content: string | null;
};

export type Course = {
  id: string;
  published: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
  translations: CourseTranslation[];
  chaptersCount: number;
  questionsCount: number;
  // Number of chapters the current user has completed in this course.
  // This field is not populated for administrator actions (like update).
  completedChaptersCount: number;
  // Number of questions the user answered correctly in this course.
  // This field is not populated for administrator actions (like update).
  correctAnswersCount: number;
};

export type CourseDetail = Course & {
  groups: Group[];
};

export type CourseStats = {
  averageScore: number;
};

export type CourseQuizResult = {
  userId: string;
  score: number;
  submittedAt: string;
};

export type CourseTranslationInput = {
  locale: LocaleCode;
  title: string;
  content?: string;
};

export type CreateCourse = {
  translations: CourseTranslationInput[];
  priority: number;
  groups?: string[];
};

export type UpdateCourse = Partial<CreateCourse> & {
  published?: boolean;
};
