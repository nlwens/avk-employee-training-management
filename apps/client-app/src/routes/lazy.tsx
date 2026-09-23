import { lazy } from "react";

export const HomePage = lazy(() => import("../pages/HomePage"));
export const UserCoursesPage = lazy(() => import("../pages/UserCoursesPage"));
export const CompletedCoursesPage = lazy(
  () => import("../pages/CompletedCoursesPage"),
);
export const CourseDetailsPage = lazy(
  () => import("../pages/CourseDetailsPage"),
);
export const CourseChapterPage = lazy(
  () => import("../pages/CourseChapterPage"),
);
export const CourseQuizPage = lazy(() => import("../pages/CourseQuizPage"));
export const CourseCompletedPage = lazy(
  () => import("../pages/CourseCompletedPage"),
);
export const LoginPage = lazy(() => import("../pages/LoginPage"));

export const UserActivationPage = lazy(
  () => import("../pages/UserActivationPage"),
);
