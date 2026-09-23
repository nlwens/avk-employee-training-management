import React from "react";
import { useTranslation } from "react-i18next";
import Courses from "../components/courses/Courses";

const CompletedCoursesPage: React.FC = () => {
  const { t } = useTranslation(["navigation", "courses"]);

  return (
    <div className="safe-bottom-padding">
      <h3 className="font-label text-lg font-normal text-brand-gray-900">
        {t(($) => $.courses.list.completed_heading)}
      </h3>
      <p className="pt-1 pb-3 text-sm text-brand-gray-600">
        {t(($) => $.courses.list.descriptions.completed)}
      </p>

      <Courses variant="completed" />
    </div>
  );
};

export default CompletedCoursesPage;
