import React, { useCallback, useEffect, type ReactNode } from "react";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  useSuspenseQuery,
  useQueryClient,
  coursesQueryOptions,
  courseQueryOptions,
  courseChaptersQueryOptions,
  courseStatsQueryOptions,
  QueryBoundary,
} from "api/src";
import { useLocalize } from "i18n";
import { Button } from "ui/components/ui/button";
import PaginationControls from "ui/components/PaginationControls";
import {
  useUrlSearchParam,
  setUrlSearchParam,
} from "@ui/hooks/useUrlSearchParam";
import CourseCard from "../components/courses/CourseCard";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import type { DashboardCourse } from "../types/course";
import { SearchInput } from "@ui/components/SearchInput";

const COURSES_PAGE_LIMIT = 12;

const CourseGrid: React.FC<{ courses: DashboardCourse[] }> = ({ courses }) => {
  const { t } = useTranslation(["courses", "common"]);
  const { localize } = useLocalize();
  const queryClient = useQueryClient();

  const prefetchCourse = (courseId: string) => {
    void queryClient.prefetchQuery(courseQueryOptions(courseId));
    void queryClient.prefetchQuery(courseStatsQueryOptions(courseId));
    void queryClient.prefetchQuery(courseChaptersQueryOptions(courseId));
  };

  return (
    <div className="grid gap-x-12 gap-y-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 pb-12">
      {courses.map((course) => (
        <Link
          key={course.id}
          to={`/courses/${course.id}/overview`}
          onFocus={() => prefetchCourse(course.id)}
          onMouseEnter={() => prefetchCourse(course.id)}
          className="block h-full rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
          aria-label={t(($) => $.courses.list.open, {
            title: localize(course.translations, "title"),
          })}
        >
          <CourseCard course={course} className="h-full" />
        </Link>
      ))}
    </div>
  );
};

const PaginatedCourseSection: React.FC<{
  published: boolean;
  pageParam: string;
  headerAction?: ReactNode;
}> = ({ published, pageParam, headerAction }) => {
  const { t } = useTranslation(["courses", "common"]);
  const queryClient = useQueryClient();

  const urlPage = useUrlSearchParam(pageParam);
  const searchParam = useUrlSearchParam("search");
  const page = Math.max(1, Number(urlPage) || 1);

  const handlePageChange = useCallback(
    (newPage: number) => {
      setUrlSearchParam({
        paramName: pageParam,
        value: newPage <= 1 ? "" : String(newPage),
        replace: false,
      });
    },
    [pageParam],
  );

  const { data } = useSuspenseQuery(
    coursesQueryOptions({
      published,
      page,
      limit: COURSES_PAGE_LIMIT,
      search: searchParam,
    }),
  );

  const totalPages = data.pages;
  const effectivePage = totalPages > 0 ? Math.min(page, totalPages) : page;

  // Prefetch the next page when the user navigates to the next page.
  useEffect(() => {
    if (effectivePage < totalPages) {
      void queryClient.prefetchQuery(
        coursesQueryOptions({
          published,
          page: effectivePage + 1,
          limit: COURSES_PAGE_LIMIT,
          search: searchParam,
        }),
      );
    }
  }, [effectivePage, totalPages, published, queryClient, searchParam]);

  // Update the URL search param when the user navigates to a different page.
  useEffect(() => {
    if (effectivePage !== page && totalPages > 0) {
      setUrlSearchParam({
        paramName: pageParam,
        value: effectivePage <= 1 ? "" : String(effectivePage),
        replace: true,
      });
    }
  }, [effectivePage, page, totalPages, pageParam, searchParam]);

  const messageKey = searchParam ? "search" : "none_added";

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between pt-6">
        <h2 className="text-xl font-medium">
          {published
            ? t(($) => $.courses.list.published_with_count, {
                count: data.total,
              })
            : t(($) => $.courses.list.drafts_with_count, {
                count: data.total,
              })}
        </h2>
        {headerAction}
      </div>

      {data.data.length === 0 ? (
        <p className="py-5 text-center text-gray-500">
          {t(($) => $.courses.list.empty[messageKey])}
        </p>
      ) : (
        <CourseGrid courses={data.data} />
      )}

      <PaginationControls
        currentPage={effectivePage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        aria-label={t(($) => $.common.pagination.page_of, {
          page: effectivePage,
          pages: totalPages,
        })}
        pageAriaLabel={(p) => t(($) => $.common.pagination.page, { page: p })}
      />
    </section>
  );
};

const CoursesList: React.FC = () => {
  const { t } = useTranslation(["common"]);
  return (
    <div>
      <PaginatedCourseSection
        published
        pageParam="published_page"
        headerAction={
          <div className="flex gap-3">
            <Link to="/courses/create">
              <Button
                type="button"
                variant="secondary"
                className="gap-2 uppercase bg-avk-blue text-white hover:bg-avk-blue/80"
              >
                {t(($) => $.common.actions.add)}
                <Plus size={18} aria-hidden="true" />
              </Button>
            </Link>
            <SearchInput
              queryParamName="search"
              placeholder={"Search courses..."}
              className="w-full sm:w-44"
              inputClassName="text-sm"
            />
          </div>
        }
      />

      <div className="pb-16">
        <PaginatedCourseSection published={false} pageParam="draft_page" />
      </div>
    </div>
  );
};

const CoursesPage: React.FC = () => {
  const { t } = useTranslation(["courses"]);

  return (
    <DashboardLayout>
      <section>
        <QueryBoundary
          errorMessage={t(($) => $.courses.messages.error.loading_all)}
        >
          <CoursesList />
        </QueryBoundary>
      </section>
    </DashboardLayout>
  );
};

export default CoursesPage;
