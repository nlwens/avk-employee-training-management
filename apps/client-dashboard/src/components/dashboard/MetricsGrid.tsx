import { BookOpen, User, Users } from "lucide-react";
import MetricCard from "./MetricCard";
import { useTranslation } from "react-i18next";

interface MetricsGridProps {
  totalEmployees: number;
  totalPublishedCourses: number;
  totalGroups: number;
}

const MetricsGrid = ({
  totalEmployees,
  totalPublishedCourses,
  totalGroups,
}: MetricsGridProps) => {
  const { t } = useTranslation(["employees", "courses"]);

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-5">
      <MetricCard
        label={t(($) => $.employees.dashboard.total)}
        value={totalEmployees}
        icon={<User strokeWidth={3.5} />}
      />
      <MetricCard
        label={t(($) => $.courses.dashboard.published_courses)}
        value={totalPublishedCourses}
        icon={<BookOpen strokeWidth={3.5} />}
      />
      <MetricCard
        label={t(($) => $.employees.dashboard.groups)}
        value={totalGroups}
        icon={<Users strokeWidth={3.5} />}
      />
    </section>
  );
};

export default MetricsGrid;
