import React from "react";
import { Link } from "react-router-dom";
import { useInView } from "react-intersection-observer";
import { useTranslation } from "react-i18next";
import {
  useQueryClient,
  useSuspenseInfiniteQuery,
} from "@tanstack/react-query";
import {
  completedChaptersQuery,
  courseChaptersQueryOptions,
  infiniteCoursesQueryOptions,
  QueryBoundary,
} from "api/src";
import { SearchInput } from "ui/components/SearchInput";
import { useUrlSearchParam } from "ui/hooks/useUrlSearchParam";
import LoadingSpinner from "ui/components/LoadingSpinner";
import CourseCard from "./CourseCard";

export type CourseListVariant = "overview" | "in_progress" | "completed";

interface CourseEmptyStateProps {
  variant: CourseListVariant;
  isSearching: boolean;
}

const CoursesEmptyState: React.FC<CourseEmptyStateProps> = ({
  variant,
  isSearching,
}) => {
  const { t } = useTranslation(["courses"]);

  const messageKey = isSearching ? "search" : variant;

  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <p className="text-sm text-brand-gray-600">
        {t(($) => $.courses.list.empty[messageKey])}
      </p>

      {!isSearching && variant !== "overview" && (
        <Link to="/" className="text-sm text-brand-primary-500">
          {t(($) => $.courses.list.empty.browse_link)}
        </Link>
      )}
    </div>
  );
};

const VARIANT_FINISHED = {
  overview: undefined,
  in_progress: false,
  completed: true,
} as const;

interface CoursesProps {
  variant: CourseListVariant;
  search?: string | null;
}

const CoursesList: React.FC<CoursesProps> = ({ variant, search }) => {
  const queryClient = useQueryClient();

  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useSuspenseInfiniteQuery(
      infiniteCoursesQueryOptions({
        finished: VARIANT_FINISHED[variant],
        search,
      }),
    );

  const courses = data.pages.flatMap((page) => page.data);

  const { ref: sentinelRef } = useInView({
    onChange: (inView) => {
      if (inView && hasNextPage && !isFetchingNextPage) {
        void fetchNextPage();
      }
    },
  });

  const prefetchCourse = (courseId: string) => {
    void queryClient.prefetchQuery(courseChaptersQueryOptions(courseId));
    void queryClient.prefetchQuery(completedChaptersQuery(courseId));
  };

  if (courses.length === 0) {
    return (
      <CoursesEmptyState
        variant={variant}
        isSearching={Boolean(search?.trim())}
      />
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {courses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            onFocus={() => prefetchCourse(course.id)}
            onMouseEnter={() => prefetchCourse(course.id)}
          />
        ))}
      </div>

      {isFetchingNextPage && <LoadingSpinner size="sm" className="mt-4" />}
      <div ref={sentinelRef} aria-hidden="true" />
    </>
  );
};

const Courses: React.FC<Omit<CoursesProps, "search">> = ({ variant }) => {
  const { t } = useTranslation(["courses"]);
  const searchQuery = useUrlSearchParam("search");

  return (
    <>
      <SearchInput
        queryParamName="search"
        placeholder={t(($) => $.courses.list.search)}
        className="mb-4"
        inputClassName="text-sm"
      />

      <QueryBoundary
        errorMessage={t(($) => $.courses.messages.error.loading_all)}
        loadingFallback={<LoadingSpinner size="lg" className="py-12" />}
      >
        <CoursesList variant={variant} search={searchQuery} />
      </QueryBoundary>
    </>
  );
};

export default Courses;
