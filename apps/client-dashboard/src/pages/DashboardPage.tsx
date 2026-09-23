import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { dashboardStatsQueryOptions, QueryBoundary } from "@api/src";
import CourseAverageScoresSection from "../components/dashboard/CourseAverageScoresSection";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import MetricsGrid from "../components/dashboard/MetricsGrid";

const DashboardMetrics = () => {
  const { data } = useSuspenseQuery(dashboardStatsQueryOptions);

  return (
    <MetricsGrid
      totalEmployees={data.totalEmployees}
      totalPublishedCourses={data.publishedCourses}
      totalGroups={data.groups}
    />
  );
};

const DashboardPage = () => {
  const { t } = useTranslation("courses");

  return (
    <DashboardLayout>
      <QueryBoundary
        errorMessage={t(($) => $.courses.messages.error.loading_all)}
      >
        <DashboardMetrics />
      </QueryBoundary>

      <QueryBoundary
        errorMessage={t(($) => $.courses.messages.error.loading_all)}
      >
        <CourseAverageScoresSection />
      </QueryBoundary>
    </DashboardLayout>
  );
};

export default DashboardPage;
