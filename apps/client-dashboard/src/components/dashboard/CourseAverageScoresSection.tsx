import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  courseStatsQueryOptions,
  coursesQueryOptions,
  QueryBoundary,
  useQueryClient,
} from "@api/src";
import LoadingSpinner from "@ui/components/LoadingSpinner";
import PaginationControls from "@ui/components/PaginationControls";
import {
  useUrlSearchParam,
  setUrlSearchParam,
} from "@ui/hooks/useUrlSearchParam";
import CourseAverageScores from "./CourseAverageScores";
import CourseAverageScoresData, {
  DASHBOARD_COURSES_LIMIT,
} from "./CourseAverageScoresData";

const CourseAverageScoresSection = () => {
  const { t } = useTranslation(["courses", "common"]);
  const queryClient = useQueryClient();
  const [totalPages, setTotalPages] = useState(0);

  const urlPage = useUrlSearchParam("course_page");
  const page = Math.max(1, Number(urlPage) || 1);
  const effectivePage = totalPages > 0 ? Math.min(page, totalPages) : page;

  const handlePageChange = useCallback((newPage: number) => {
    setUrlSearchParam({
      paramName: "course_page",
      value: newPage <= 1 ? "" : String(newPage),
      replace: false,
    });
  }, []);

  const handlePagesLoaded = useCallback((pages: number) => {
    setTotalPages(pages);
  }, []);

  // Prefetch the next page when the user navigates to the next page.
  useEffect(() => {
    if (effectivePage >= totalPages) return;

    const prefetchNext = async () => {
      const nextPage = await queryClient.fetchQuery(
        coursesQueryOptions({
          published: true,
          page: effectivePage + 1,
          limit: DASHBOARD_COURSES_LIMIT,
        }),
      );

      for (const course of nextPage.data) {
        void queryClient.prefetchQuery(courseStatsQueryOptions(course.id));
      }
    };

    void prefetchNext();
  }, [effectivePage, totalPages, queryClient]);

  // Update the URL search param when the user navigates to a different page.
  useEffect(() => {
    if (effectivePage !== page && totalPages > 0) {
      setUrlSearchParam({
        paramName: "course_page",
        value: effectivePage <= 1 ? "" : String(effectivePage),
        replace: true,
      });
    }
  }, [effectivePage, page, totalPages]);

  return (
    <CourseAverageScores
      footer={
        totalPages > 1 ? (
          <PaginationControls
            currentPage={effectivePage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            aria-label={t(($) => $.common.pagination.page_of, {
              page: effectivePage,
              pages: totalPages,
            })}
            pageAriaLabel={(p) =>
              t(($) => $.common.pagination.page, { page: p })
            }
          />
        ) : undefined
      }
    >
      <QueryBoundary
        errorMessage={t(($) => $.courses.messages.error.loading_all)}
        loadingFallback={<LoadingSpinner size="lg" className="py-10" />}
      >
        <CourseAverageScoresData
          page={effectivePage}
          onPagesLoaded={handlePagesLoaded}
        />
      </QueryBoundary>
    </CourseAverageScores>
  );
};

export default CourseAverageScoresSection;
