import type { RouteObject } from "react-router-dom";
import {
  CompletedCoursesPage,
  CourseChapterPage,
  CourseCompletedPage,
  CourseDetailsPage,
  CourseQuizPage,
  UserCoursesPage,
} from "./lazy";
import {
  queryClient,
  infiniteCoursesQueryOptions,
  courseQueryOptions,
  courseChaptersQueryOptions,
  segmentsQueryOptions,
  completedChaptersQuery,
  prefetchQuestions,
} from "api/src";

export const coursesRoute: RouteObject[] = [
  {
    path: "/courses",
    element: <UserCoursesPage />,
    loader: ({ request }) => {
      const search = new URL(request.url).searchParams.get("search");

      void queryClient.prefetchInfiniteQuery(
        infiniteCoursesQueryOptions({ finished: false, search }),
      );
    },
  },
  {
    path: "/courses/completed",
    element: <CompletedCoursesPage />,
    loader: ({ request }) => {
      const search = new URL(request.url).searchParams.get("search");

      void queryClient.prefetchInfiniteQuery(
        infiniteCoursesQueryOptions({ finished: true, search }),
      );
    },
  },
];

export const courseDetailsRoute: RouteObject[] = [
  {
    path: "/courses/:courseId",
    element: <CourseDetailsPage />,
    loader: ({ params }) => {
      const { courseId } = params as { courseId: string };
      void queryClient.prefetchQuery(courseQueryOptions(courseId));
      void queryClient.prefetchQuery(courseChaptersQueryOptions(courseId));
      void queryClient.prefetchQuery(completedChaptersQuery(courseId));
    },
  },
];

export const courseChapterRoute: RouteObject[] = [
  {
    path: "/courses/:courseId/chapters/:chapterId",
    element: <CourseChapterPage />,
    loader: ({ params }) => {
      const { courseId, chapterId } = params as {
        courseId: string;
        chapterId: string;
      };

      void queryClient.prefetchQuery(courseQueryOptions(courseId));
      void queryClient.prefetchQuery(courseChaptersQueryOptions(courseId));
      void queryClient.prefetchQuery(segmentsQueryOptions(courseId, chapterId));
    },
  },
];

export const courseQuizRoute: RouteObject[] = [
  {
    path: "/courses/:courseId/quiz",
    element: <CourseQuizPage />,
    loader: ({ params }) => {
      const { courseId } = params as { courseId: string };
      void queryClient.prefetchQuery(courseQueryOptions(courseId));
      void prefetchQuestions(queryClient, courseId);
    },
  },
];

export const courseCompletedRoute: RouteObject[] = [
  {
    path: "/courses/:courseId/completed",
    element: <CourseCompletedPage />,
  },
];
