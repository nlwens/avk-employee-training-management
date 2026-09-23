import React from "react";
import { useTranslation } from "react-i18next";
import Courses from "../components/courses/Courses";

const HomePage: React.FC = () => {
  const { t } = useTranslation(["navigation", "courses"]);

  return (
    <div className="safe-bottom-padding">
      <h3 className="font-label text-lg font-normal text-brand-gray-900">
        {t(($) => $.navigation.links.all_courses)}
      </h3>
      <p className="pt-1 pb-3 text-sm text-brand-gray-600">
        {t(($) => $.courses.list.descriptions.overview)}
      </p>

      <Courses variant="overview" />
    </div>
  );
};

export default HomePage;
