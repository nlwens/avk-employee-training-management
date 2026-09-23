import { Navigate, type RouteObject } from "react-router-dom";
import {
  CreateCoursePage,
  CoursesPage,
  DashboardPage,
  EmployeesPage,
  CourseDetailsPage,
  CourseGroupsPage,
  CreateEmployeePage,
  CreateQuizPage,
  QuizPage,
  QuizSummaryPage,
  QuizSummaryUsersPage,
  QuizSummaryQuestionsPage,
  QuizQuestionsPage,
  CreateGroupPage,
  EditGroupPage,
  EditEmployeePage,
  EmployeeDetailsPage,
  CreateCourseChaptersPage,
  ChapterDetailsPage,
  EditChapterPage,
  EditCoursePage,
  SettingsPage,
} from "./lazy";
import CourseWorkspaceLayout from "../components/courses/CourseWorkspaceLayout";
import {
  queryClient,
  coursesQueryOptions,
  courseQueryOptions,
  courseChaptersQueryOptions,
  courseStatsQueryOptions,
  courseQuizResultsQueryOptions,
  dashboardStatsQueryOptions,
  groupsQueryOptions,
  prefetchQuestions,
  usersQueryOptions,
  userQueryOptions,
  segmentsQueryOptions,
} from "api/src";

export const dashboardRoute: RouteObject[] = [
  {
    path: "/",
    element: <DashboardPage />,
    loader: ({ request }) => {
      const url = new URL(request.url);
      const coursePage =
        Math.max(1, Number(url.searchParams.get("course_page"))) || 1;

      void queryClient.prefetchQuery(dashboardStatsQueryOptions);
      void queryClient.prefetchQuery(
        coursesQueryOptions({ published: true, page: coursePage, limit: 5 }),
      );
    },
  },
  {
    path: "/settings",
    element: <SettingsPage />,
  },
  {
    path: "/employees",
    element: <EmployeesPage />,
    loader: ({ request }) => {
      const search = new URL(request.url).searchParams.get("search");

      void queryClient.prefetchQuery(usersQueryOptions({ search }));
      void queryClient.prefetchQuery(groupsQueryOptions);
    },
  },
  {
    path: "/employees/groups/create",
    element: <CreateGroupPage />,
    loader: () => {
      void queryClient.prefetchQuery(usersQueryOptions());
    },
  },
  {
    path: "/employees/groups/:groupId/edit",
    element: <EditGroupPage />,
    loader: () => {
      void queryClient.prefetchQuery(groupsQueryOptions);
      void queryClient.prefetchQuery(usersQueryOptions());
    },
  },
  {
    path: "/employees/create",
    element: <CreateEmployeePage />,
    loader: () => {
      void queryClient.prefetchQuery(groupsQueryOptions);
    },
  },
  {
    path: "/employees/:userId",
    element: <EmployeeDetailsPage />,
    loader: ({ params }) => {
      const { userId } = params as { userId: string };
      void queryClient.prefetchQuery(userQueryOptions(userId));
    },
  },
  {
    path: "/employees/:userId/edit",
    element: <EditEmployeePage />,
    loader: ({ params }) => {
      const { userId } = params as { userId: string };
      void queryClient.prefetchQuery(userQueryOptions(userId));
      void queryClient.prefetchQuery(groupsQueryOptions);
    },
  },

  {
    path: "/courses",
    element: <CoursesPage />,
    loader: ({ request }) => {
      const url = new URL(request.url);
      const publishedPage =
        Math.max(1, Number(url.searchParams.get("published_page"))) || 1;
      const draftPage =
        Math.max(1, Number(url.searchParams.get("draft_page"))) || 1;

      void queryClient.prefetchQuery(
        coursesQueryOptions({
          published: true,
          page: publishedPage,
          limit: 12,
        }),
      );
      void queryClient.prefetchQuery(
        coursesQueryOptions({
          published: false,
          page: draftPage,
          limit: 12,
        }),
      );
    },
  },
  {
    path: "/courses/create",
    element: <CreateCoursePage />,
  },
  {
    path: "/courses/:courseId",
    element: <CourseWorkspaceLayout />,
    loader: ({ params }) => {
      const { courseId } = params as { courseId: string };
      void queryClient.prefetchQuery(courseQueryOptions(courseId));
      void queryClient.prefetchQuery(courseChaptersQueryOptions(courseId));
      void queryClient.prefetchQuery(courseStatsQueryOptions(courseId));
    },
    children: [
      {
        index: true,
        element: <Navigate to="overview" replace />,
      },
      {
        path: "overview",
        element: <CourseDetailsPage />,
      },
      {
        path: "edit",
        element: <EditCoursePage />,
      },
      {
        path: "groups",
        element: <CourseGroupsPage />,
        loader: () => {
          void queryClient.prefetchQuery(groupsQueryOptions);
        },
      },
      {
        path: "quiz",
        element: <QuizPage />,
        loader: ({ params }) => {
          const { courseId } = params as { courseId: string };
          void prefetchQuestions(queryClient, courseId);
        },
        children: [
          {
            index: true,
            element: <Navigate to="summary" replace />,
          },
          {
            path: "summary",
            element: <QuizSummaryPage />,
            loader: ({ params }) => {
              const { courseId } = params as { courseId: string };
              void queryClient.prefetchQuery(courseStatsQueryOptions(courseId));
            },
            children: [
              {
                index: true,
                element: <Navigate to="users" replace />,
              },
              {
                path: "users",
                element: <QuizSummaryUsersPage />,
                loader: ({ params }) => {
                  const { courseId } = params as { courseId: string };
                  void queryClient.prefetchQuery(
                    courseQuizResultsQueryOptions(courseId),
                  );
                  void queryClient.prefetchQuery(usersQueryOptions());
                },
              },
              {
                path: "questions",
                element: <QuizSummaryQuestionsPage />,
              },
            ],
          },
          {
            path: "questions",
            element: <QuizQuestionsPage />,
          },
        ],
      },
      {
        path: "chapters/create",
        element: <CreateCourseChaptersPage />,
      },
      {
        path: "chapters/:chapterId",
        loader: ({ params }) => {
          const { courseId, chapterId } = params as {
            courseId: string;
            chapterId: string;
          };

          void queryClient.prefetchQuery(
            segmentsQueryOptions(courseId, chapterId),
          );
        },
        children: [
          { index: true, element: <ChapterDetailsPage /> },
          { path: "edit", element: <EditChapterPage /> },
        ],
      },
    ],
  },

  {
    path: "/quizzes/edit",
    element: <CreateQuizPage />,
  },
];
