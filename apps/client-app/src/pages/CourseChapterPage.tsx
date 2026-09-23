import React, { useEffect } from "react";
import { useSuspenseQueries, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLocalize } from "i18n";
import {
  courseChaptersQueryOptions,
  segmentsQueryOptions,
  QueryBoundary,
  courseQueryOptions,
  coursesListQueryKey,
  usePrefetchQuestions,
} from "api/src";
import CourseNavbar from "../components/courses/CourseNavbar";
import CoursePageContent from "../components/courses/CoursePageContent";
import Stepper from "../components/stepper/Stepper";
import StepFooter from "../components/stepper/StepFooter";
import StepContent from "../components/stepper/StepContent";
import { useMarkChapterCompleted } from "../hooks/useMarkChapterCompleted";

interface CourseChapterContentProps {
  courseId: string;
  chapterId: string;
}

const CourseChapterContent: React.FC<CourseChapterContentProps> = ({
  courseId,
  chapterId,
}) => {
  const { localize } = useLocalize();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [{ data: chapters }, { data: segments }] = useSuspenseQueries({
    queries: [
      courseChaptersQueryOptions(courseId),
      segmentsQueryOptions(courseId, chapterId),
    ],
  });

  useMarkChapterCompleted(courseId, chapterId);

  const step = Math.max(
    0,
    chapters.findIndex((item) => item.id === chapterId),
  );

  const steps = chapters.map((chapter) => ({
    label: localize(chapter.translations, "title"),
  }));

  // Prefetch the contents of the next chapter.
  const nextChapter = chapters[step + 1];
  useEffect(() => {
    if (nextChapter) {
      void queryClient.prefetchQuery(
        segmentsQueryOptions(courseId, nextChapter.id),
      );
    }
  }, [queryClient, courseId, nextChapter]);

  // If we are on the last page, prefetch the quiz.
  usePrefetchQuestions({ courseId, enabled: step === chapters.length - 1 });

  const goToChapter = (index: number) => {
    const chapter = chapters[index];
    if (chapter) {
      navigate(`/courses/${courseId}/chapters/${chapter.id}`);
    }
  };

  return (
    <div className="mx-auto flex h-full w-full max-w-5xl flex-1 flex-col gap-6">
      <section className="w-full">
        <Stepper steps={steps} current={step} onStepClick={goToChapter} />
      </section>

      <div className="overflow-y-auto rounded-lg">
        <StepContent steps={steps} step={step} segments={segments} />
      </div>

      <StepFooter
        steps={steps}
        step={step}
        onGoToStep={goToChapter}
        courseId={courseId}
      />
    </div>
  );
};

const CourseChapterPage: React.FC = () => {
  const { courseId, chapterId } = useParams() as {
    courseId: string;
    chapterId: string;
  };

  const { t } = useTranslation(["courses"]);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <CourseNavbar />
      <CoursePageContent className="flex min-h-0 flex-1 flex-col">
        <QueryBoundary
          onNotFound={() => {
            void queryClient.invalidateQueries({
              queryKey: coursesListQueryKey,
            });

            // This call invalidates this query but also all nested queries.
            void queryClient.invalidateQueries(courseQueryOptions(courseId));

            navigate(`/courses/${courseId}`, { replace: true });
          }}
          messages={{ notFound: t(($) => $.courses.messages.error.not_found) }}
          errorMessage={t(($) => $.courses.messages.error.loading)}
        >
          <CourseChapterContent courseId={courseId} chapterId={chapterId} />
        </QueryBoundary>
      </CoursePageContent>
    </div>
  );
};

export default CourseChapterPage;
