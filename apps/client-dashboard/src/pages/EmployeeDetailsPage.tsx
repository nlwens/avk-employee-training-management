import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  infiniteUserCourseStatsQueryOptions,
  QueryBoundary,
  userQueryOptionsWithCache,
  userCourseStatsDownloadQueryOptions,
  useQueryClient,
  useSuspenseInfiniteQuery,
  useSuspenseQuery,
  useQuery,
  useHandleApiError,
  toApiError,
} from "@api/src";
import { toEmployeeCourseSummary } from "../utils/employeeDetail";
import { Button } from "@ui/components/ui/button";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import CourseListTable from "../components/employees/CourseListTable";
import CourseSubmissionPanel from "../components/employees/CourseSubmissionPanel";

const EmployeeDetailsContent: React.FC<{ userId: string }> = ({ userId }) => {
  const { t } = useTranslation(["employees", "common"]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { handleApiError } = useHandleApiError();

  const { data: user } = useSuspenseQuery(
    userQueryOptionsWithCache(userId, queryClient),
  );

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useSuspenseInfiniteQuery(infiniteUserCourseStatsQueryOptions(userId));

  const courses = data.pages.flatMap((page) =>
    page.data.map(toEmployeeCourseSummary),
  );

  const selectedCourse =
    courses.find((course) => course.id === selectedCourseId) ?? null;

  const hasCompletedCourses =
    courses.some((course) => course.status === "completed") ||
    Boolean(hasNextPage);

  const groupNames = user.groups.map((group) => group.name).join(", ") || "-";
  const fullName = `${user.name} ${user.surname}`.trim();

  const fieldClassName =
    "inline-flex min-w-0 items-baseline gap-x-2 text-base sm:gap-5";

  const { refetch, isFetching } = useQuery({
    ...userCourseStatsDownloadQueryOptions(user.id, `${fullName}.csv`),
    enabled: false,
  });

  const handleDownload = async () => {
    const { error } = await refetch();
    const apiError = toApiError(error);

    if (apiError) {
      handleApiError(apiError);
    }
  };

  return (
    <section className="space-y-6 pt-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-14 sm:gap-y-2">
          <span className={fieldClassName}>
            <span className="shrink-0 font-semibold">
              {t(($) => $.employees.table.name)}:
            </span>
            <span className="whitespace-nowrap">{fullName}</span>
          </span>

          <span className={fieldClassName}>
            <span className="shrink-0 font-semibold">
              {t(($) => $.common.fields.email)}:
            </span>
            <span className="min-w-0 break-all sm:break-normal">
              {user.email ?? "-"}
            </span>
          </span>

          <span className="flex min-w-0 items-baseline gap-x-2 text-base sm:inline-flex sm:gap-6">
            <span className="shrink-0 font-semibold">
              {t(($) => $.employees.table.groups)}:
            </span>
            <span className="min-w-0 wrap-break-word">{groupNames}</span>
          </span>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-xl bg-avk-blue-light sm:w-auto hover:bg-avk-blue-light/80"
            disabled={isFetching}
            onClick={() => void handleDownload()}
            aria-label={t(($) => $.employees.detail.actions.download)}
          >
            {t(($) => $.employees.detail.actions.download)}
          </Button>
          <Link to={`/employees/${user.id}/edit`} className="shrink-0">
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-xl bg-avk-blue-light sm:w-22 hover:bg-avk-blue-light/80"
              aria-label={t(($) => $.employees.actions.edit, {
                name: user.name,
                surname: user.surname,
              })}
            >
              {t(($) => $.employees.detail.actions.edit)}
            </Button>
          </Link>
        </div>
      </div>

      <div className="-mx-6 flex flex-col gap-4 px-6 py-4 sm:-mx-12 sm:px-12 lg:flex-row">
        <div className="min-w-0 overflow-hidden rounded shadow-sm bg-white lg:w-[55%]">
          <CourseListTable
            courses={courses}
            selectedCourseId={selectedCourseId}
            onSelect={(course) => setSelectedCourseId(course?.id ?? null)}
          />

          {hasNextPage && (
            <div className="border-t border-gray-200 p-3 text-center">
              <Button
                type="button"
                variant="outline"
                disabled={isFetchingNextPage}
                onClick={() => void fetchNextPage()}
              >
                {isFetchingNextPage
                  ? t(($) => $.common.status.loading)
                  : t(($) => $.employees.detail.actions.load_more_courses)}
              </Button>
            </div>
          )}
        </div>

        <div className="min-w-0 overflow-y-auto rounded shadow-sm bg-white lg:w-[45%]">
          <CourseSubmissionPanel
            userId={userId}
            course={selectedCourse}
            hasCompletedCourses={hasCompletedCourses}
          />
        </div>
      </div>
    </section>
  );
};

const EmployeeDetailsPage: React.FC = () => {
  const { userId } = useParams() as { userId: string };

  const { t } = useTranslation("employees");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return (
    <DashboardLayout>
      <QueryBoundary
        onNotFound={() => {
          queryClient.removeQueries({ queryKey: ["users", userId] });
          navigate("/employees", { replace: true });
        }}
        errorMessage={t(($) => $.employees.messages.error.loading)}
      >
        <EmployeeDetailsContent userId={userId} />
      </QueryBoundary>
    </DashboardLayout>
  );
};

export default EmployeeDetailsPage;
