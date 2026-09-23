import React from "react";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useToast } from "ui/hooks/use-toast";
import { useLocalize } from "i18n";
import DashboardLayout from "../dashboard/DashboardLayout";
import CourseDetailSidebar from "./CourseDetailSidebar";
import { useUpdateChapter } from "../../hooks/mutations/useUpdateChapter";
import {
  courseChaptersQueryOptions,
  courseQueryOptionsWithCache,
  courseQueryOptions,
  coursesListQueryKey,
  QueryBoundary,
  type ApiError,
  type Chapter,
  segmentsQueryOptions,
  useHandleApiError,
  useSuspenseQueries,
  useQueryClient,
} from "api/src";

interface CourseWorkspaceContentProps {
  courseId: string;
}

const CourseWorkspaceContent: React.FC<CourseWorkspaceContentProps> = ({
  courseId,
}) => {
  const { localize } = useLocalize();
  const queryClient = useQueryClient();
  const { t } = useTranslation(["courses", "chapters", "common"]);
  const { toast } = useToast();
  const { handleApiError } = useHandleApiError();
  const { mutateAsync: updateChapter } = useUpdateChapter();

  const [{ data: course }, { data: chapters }] = useSuspenseQueries({
    queries: [
      courseQueryOptionsWithCache(courseId, queryClient),
      courseChaptersQueryOptions(courseId),
    ],
  });

  const sortedChapters = [...chapters].sort((a, b) => a.order - b.order);

  const prefetchChapter = (chapter: Chapter) => {
    void queryClient.prefetchQuery(
      segmentsQueryOptions(chapter.courseId, chapter.id),
    );
  };

  /**
   * Persists a chapter reorder after drag-and-drop in the sidebar.
   *
   * The sidebar passes list indices based on the current sorted chapters.
   * We update the course chapters query cache optimistically so the list
   * reflects the new order immediately, then PATCH only the chapters whose
   * `order` actually changed. If any request fails, we restore the previous
   * cache snapshot so the UI matches the server again.
   */
  const handleReorderChapters = async (fromIndex: number, toIndex: number) => {
    const previousChapters = sortedChapters;
    const nextChapters = [...previousChapters];
    const [movedChapter] = nextChapters.splice(fromIndex, 1);
    nextChapters.splice(toIndex, 0, movedChapter);

    // Reassign 1-based order values so they match the new list position.
    const nextChaptersWithOrder = nextChapters.map((chapter, index) => ({
      ...chapter,
      order: index + 1,
    }));

    queryClient.setQueryData(
      courseChaptersQueryOptions(courseId).queryKey,
      nextChaptersWithOrder,
    );

    const changedChapters = nextChaptersWithOrder.filter(
      (chapter) =>
        previousChapters.find((previous) => previous.id === chapter.id)
          ?.order !== chapter.order,
    );

    try {
      await Promise.all(
        changedChapters.map((chapter) =>
          updateChapter({
            courseId,
            chapterId: chapter.id,
            order: chapter.order,
          }),
        ),
      );

      if (changedChapters.length > 0) {
        toast({
          variant: "success",
          title: t(($) => $.common.status.success),
          description: t(($) => $.chapters.messages.success.reordered),
        });
      }
    } catch (error) {
      queryClient.setQueryData(
        courseChaptersQueryOptions(courseId).queryKey,
        previousChapters,
      );

      handleApiError(error as ApiError, {
        messages: {
          unexpectedError: t(($) => $.chapters.messages.error.mutating),
        },
      });
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="relative left-1/2 w-screen -translate-x-1/2 bg-avk-blue/15">
        <div className="mx-auto max-w-7xl px-6 py-4 sm:px-12">
          <h2 className="text-2xl font-medium text-black">
            {localize(course.translations, "title")}
          </h2>
        </div>
      </div>

      <div className="relative left-1/2 flex w-screen flex-1 -translate-x-1/2 flex-col bg-white">
        <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-1 flex-col gap-10 px-6 py-5 sm:px-12 lg:flex-row">
          <CourseDetailSidebar
            chapters={chapters}
            onReorderChapters={(fromIndex, toIndex) => {
              void handleReorderChapters(fromIndex, toIndex);
            }}
            onPrefetchChapter={prefetchChapter}
          />

          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            {/* This is mostly just to show a loading spinner in the right */}
            {/* panel instead of replacing the entire page. We do not handle */}
            {/* errors here as we do not expect any. */}
            <QueryBoundary>
              <Outlet />
            </QueryBoundary>
          </div>
        </div>
      </div>
    </div>
  );
};

const CourseWorkspaceLayout: React.FC = () => {
  const { courseId } = useParams() as { courseId: string };

  const { t } = useTranslation(["courses"]);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return (
    <DashboardLayout>
      <QueryBoundary
        onNotFound={() => {
          void queryClient.invalidateQueries({
            queryKey: coursesListQueryKey,
          });

          queryClient.removeQueries(courseQueryOptions(courseId));

          navigate("/courses", { replace: true });
        }}
        messages={{ notFound: t(($) => $.courses.messages.error.not_found) }}
        errorMessage={t(($) => $.courses.messages.error.loading)}
      >
        <CourseWorkspaceContent courseId={courseId} />
      </QueryBoundary>
    </DashboardLayout>
  );
};

export default CourseWorkspaceLayout;
