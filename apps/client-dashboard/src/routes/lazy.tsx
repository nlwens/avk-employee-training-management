import { lazy } from "react";

export const CourseDetailsPage = lazy(
  () => import("../pages/CourseDetailsPage"),
);
export const CourseGroupsPage = lazy(() => import("../pages/CourseGroupsPage"));
export const CreateCoursePage = lazy(() => import("../pages/CreateCoursePage"));
export const CreateGroupPage = lazy(() => import("../pages/CreateGroupPage"));
export const EditGroupPage = lazy(() => import("../pages/EditGroupPage"));
export const CoursesPage = lazy(() => import("../pages/CoursesPage"));
export const DashboardPage = lazy(() => import("../pages/DashboardPage"));
export const EmployeesPage = lazy(() => import("../pages/EmployeesPage"));
export const LoginPage = lazy(() => import("../pages/LoginPage"));
export const CreateEmployeePage = lazy(
  () => import("../pages/CreateEmployeePage"),
);
export const EditEmployeePage = lazy(() => import("../pages/EditEmployeePage"));
export const EmployeeDetailsPage = lazy(
  () => import("../pages/EmployeeDetailsPage"),
);
export const CreateQuizPage = lazy(() => import("../pages/CreateQuizPage"));
export const QuizSummaryPage = lazy(() => import("../pages/QuizSummaryPage"));
export const QuizSummaryUsersPage = lazy(
  () => import("../pages/QuizSummaryUsersPage"),
);
export const QuizSummaryQuestionsPage = lazy(
  () => import("../pages/QuizSummaryQuestionsPage"),
);
export const QuizQuestionsPage = lazy(
  () => import("../pages/QuizQuestionsPage"),
);
export const QuizPage = lazy(() => import("../pages/QuizPage"));
export const CreateCourseChaptersPage = lazy(
  () => import("../pages/CreateCourseChaptersPage"),
);
export const ChapterDetailsPage = lazy(
  () => import("../pages/ChapterDetailsPage"),
);
export const EditChapterPage = lazy(() => import("../pages/EditChapterPage"));
export const EditCoursePage = lazy(() => import("../pages/EditCoursePage"));

export const SettingsPage = lazy(() => import("../pages/SettingsPage"));
