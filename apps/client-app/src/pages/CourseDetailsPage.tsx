import React, { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { dateFormatParams, useLocalize } from "i18n";
import { useAuth } from "@auth-context/src";
import { Button } from "ui/components/ui/button";
import { Skeleton } from "ui/components/ui/skeleton";
import CourseNavbar from "../components/courses/CourseNavbar";
import CourseChapter from "../components/courses/CourseChapter";
import {
  completedChaptersQuery,
  courseChaptersQueryOptions,
  courseQueryOptions,
  coursesListQueryKey,
  QueryBoundary,
  segmentsQueryOptions,
  useCourse,
} from "api/src";
import CoursePageContent from "../components/courses/CoursePageContent";

// Placeholder shown while the chapter list (and the start button) is loading.
const CourseChaptersSkeleton: React.FC = () => (
  <>
    <div className="mt-6 pt-2">
      <Skeleton className="h-11 w-full rounded-md sm:w-44" />
    </div>

    <div className="mt-12">
      <Skeleton className="mb-5 h-7 w-40" />

      <div className="flex flex-col gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    </div>
  </>
);

const CourseChaptersSection: React.FC<{ courseId: string }> = ({
  courseId,
}) => {
  const queryClient = useQueryClient();

  const { t } = useTranslation(["courses", "chapters"]);
  const { localize } = useLocalize();
  const { user } = useAuth();

  // Completed chapters only drive the per-chapter checkmarks, so keep them
  // non-blocking: the list renders immediately and checkmarks pop in when ready.
  const { data: completedChapters = [] } = useQuery(
    completedChaptersQuery(courseId),
  );

  const { data: chapters } = useSuspenseQuery(
    courseChaptersQueryOptions(courseId),
  );

  const prefetchSegments = (chapterId: string) =>
    queryClient.prefetchQuery(segmentsQueryOptions(courseId, chapterId));

  const completedChapterIds = completedChapters
    .filter((c) => c.userId === user!.id)
    .map((c) => c.chapterId);

  const firstChapterId = chapters[0]?.id;

  // Prefetch the first chapter's segments, so "Start learning" opens instantly.
  useEffect(() => {
    if (firstChapterId) {
      void queryClient.prefetchQuery(
        segmentsQueryOptions(courseId, firstChapterId),
      );
    }
  }, [queryClient, courseId, firstChapterId]);

  return (
    <>
      {firstChapterId && (
        <div className="mt-6 pt-2">
          <Link to={`/courses/${courseId}/chapters/${firstChapterId}`}>
            <Button
              size="lg"
              onMouseEnter={() => prefetchSegments(firstChapterId)}
              onPointerDown={() => prefetchSegments(firstChapterId)}
              className="font-button w-full bg-avk-blue text-white sm:w-auto"
            >
              {t(($) => $.courses.detail.start_learning)}
            </Button>
          </Link>
        </div>
      )}

      <div className="mt-12">
        <h2 className="mb-5 text-xl tracking-tight text-brand-gray-900">
          {t(($) => $.chapters.display.list)}
        </h2>

        {chapters.length === 0 ? (
          <p className="reading-text text-brand-gray-600">
            {t(($) => $.chapters.display.none_available)}
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {chapters.map((chapter) => (
              <CourseChapter
                key={chapter.id}
                courseId={courseId}
                chapterId={chapter.id}
                title={localize(chapter.translations, "title")}
                isCompleted={completedChapterIds.includes(chapter.id)}
                prefetchSegments={() => prefetchSegments(chapter.id)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

const CourseDetails: React.FC<{ courseId: string }> = ({ courseId }) => {
  const { localize } = useLocalize();
  const { t } = useTranslation(["courses", "chapters"]);

  const { data: course } = useCourse(courseId);

  return (
    <div className="mx-auto max-w-4xl pb-12">
      <div className="mt-2 flex flex-col gap-6">
        <div>
          <h1 className="mb-4 text-2xl font-bold tracking-tight text-brand-gray-900">
            {localize(course.translations, "title")}
          </h1>
          <div className="flex flex-wrap gap-3 text-sm text-avk-blue">
            <span className="reading-text rounded-full bg-brand-gray-700 px-3 py-1 font-light">
              {t(($) => $.chapters.display.count, {
                count: course.chaptersCount,
              })}
            </span>
            {course.updatedAt && (
              <span className="reading-text rounded-full bg-brand-gray-700 px-3 py-1 font-light">
                {t(($) => $.courses.detail.last_updated, {
                  date: new Date(course.updatedAt),
                  formatParams: dateFormatParams({
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  }),
                })}
              </span>
            )}
          </div>
        </div>

        {localize(course.translations, "content") && (
          <p className="reading-text whitespace-pre-line text-brand-gray-600">
            {localize(course.translations, "content")}
          </p>
        )}
      </div>

      <QueryBoundary
        loadingFallback={<CourseChaptersSkeleton />}
        errorMessage={t(($) => $.courses.messages.error.loading)}
      >
        <CourseChaptersSection courseId={course.id} />
      </QueryBoundary>
    </div>
  );
};

const CourseDetailsPage: React.FC = () => {
  const { courseId } = useParams() as { courseId: string };

  const { t } = useTranslation(["courses", "chapters"]);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [courseId]);

  return (
    <>
      <CourseNavbar />
      <CoursePageContent className="safe-bottom-padding min-h-0 flex-1 overflow-y-auto no-scrollbar">
        <QueryBoundary
          onNotFound={() => {
            void queryClient.invalidateQueries({
              queryKey: coursesListQueryKey,
            });

            queryClient.removeQueries(courseQueryOptions(courseId));
            queryClient.removeQueries(courseChaptersQueryOptions(courseId));

            navigate("/", { replace: true });
          }}
          messages={{ notFound: t(($) => $.courses.messages.error.not_found) }}
          errorMessage={t(($) => $.courses.messages.error.loading)}
        >
          <CourseDetails courseId={courseId} />
        </QueryBoundary>
      </CoursePageContent>
    </>
  );
};

export default CourseDetailsPage;
