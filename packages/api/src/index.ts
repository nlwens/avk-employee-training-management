export * from "@tanstack/react-query";

export { API, type ApiError, getApiErrorStatusCode, toApiError } from "./api";
export { handleApiError, type HandleApiErrorConfig } from "./handleApiError";
export {
  ApiErrorHandlerProvider,
  type ApiErrorHandlerContextValue,
} from "./context/apiErrorHandler.context";
export { ErrorBoundary } from "./components/ErrorBoundary";
export { QueryBoundary } from "./components/QueryBoundary";
export { AppApiErrorHandlerProvider } from "./providers/AppApiErrorHandlerProvider";
export { TanStackProvider, queryClient } from "./tanstack.provider";
export { ErrorCode } from "./types/error-codes";

export {
  deleteUserAnswer,
  userAnswersQueryOptions,
} from "./queries/answers.queries";
export {
  courseChaptersQueryOptions,
  chapterQueryOptions,
  chapterQueryOptionsWithCache,
  completedChaptersQuery,
} from "./queries/chapters.queries";
export {
  coursesListQueryKey,
  infiniteCoursesListQueryKey,
  courseQueryOptions,
  courseQueryOptionsWithCache,
  courseStatsQueryOptions,
  courseQuizResultsQueryOptions,
  coursesQueryOptions,
  infiniteCoursesQueryOptions,
  type CoursesQueryOptions,
} from "./queries/courses.queries";
export { groupsQueryOptions } from "./queries/groups.queries";
export {
  segmentsQueryOptions,
  createSegment,
  updateSegment,
  deleteSegment,
} from "./queries/segments.queries";
export { dashboardStatsQueryOptions } from "./queries/dashboard.queries";
export {
  usersListQueryKey,
  usersQueryOptions,
  userQueryOptions,
  userQueryOptionsWithCache,
  userCourseStatsDownloadQueryOptions,
  usersSearchQueryOptions,
  upsertUserInUsersListQueries,
  removeUserFromUsersListQueries,
  userMatchesUsersQuery,
  type UsersQueryOptions,
} from "./queries/users.queries";
export {
  questionsQueryKey,
  questionsQueryOptions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  createAnswer,
  updateAnswer,
  deleteAnswer,
} from "./queries/questions.queries";
export {
  activateUser,
  userActivationQueryOptions,
} from "./queries/user-activations.queries";

export { useCourse } from "./hooks/queries/useCourse";
export { useGroups } from "./hooks/queries/useGroups";
export {
  prefetchQuestions,
  usePrefetchQuestions,
} from "./hooks/queries/usePrefetchQuestions";
export { useUsers } from "./hooks/queries/useUsers";
export { infiniteUserCourseStatsQueryOptions } from "./queries/user-course-stats.queries";
export {
  useHandleApiError,
  type UseHandleApiErrorOptions,
} from "./hooks/useHandleApiError";
export { useQuestions } from "./hooks/queries/useQuestions";
export { useCourseStats } from "./hooks/queries/useCourseStats";
export { useChangePassword } from "./hooks/mutations/useChangePassword";
export { useActivateUser } from "./hooks/mutations/useActivateUser";

export { LOCALE_CODES, type LocaleCode, type PaginatedResponse } from "./types";
export type {
  Course,
  CourseDetail,
  CourseStats,
  CourseTranslation,
  CourseTranslationInput,
  CourseQuizResult,
  CreateCourse,
  UpdateCourse,
} from "./types/courses";
export type {
  Chapter,
  ChapterTranslation,
  CreateChapter,
  UpdateChapter,
} from "./types/chapters";
export type { CompletedChapter } from "./types/completed-chapters";
export type {
  Question,
  Answer,
  QuestionTranslation,
  AnswerTranslation,
  QuestionTranslationInput,
  AnswerTranslationInput,
  CreateQuestionInput,
  UpdateQuestionInput,
  CreateAnswerInput,
  UpdateAnswerInput,
} from "./types/questions";
export type { AnswerSubmission, UserAnswer } from "./types/user-answers";
export type {
  Segment,
  SegmentInput,
  SegmentAttachmentType,
} from "./types/segments";
export type { SegmentFile } from "./types/segment-files";
export type { Group } from "./types/group";
export type { DashboardStats } from "./types/dashboard";
export type { User } from "./types/user";
export type {
  ActivateUserInput,
  UserActivation,
} from "./types/user-activation";

export { buildFileUrl } from "./file-builder";
export { downloadCourseStatsCsv } from "./download";
