import React from "react";
import { useTranslation } from "react-i18next";
import Courses from "../components/courses/Courses";

const UserCoursesPage: React.FC = () => {
  const { t } = useTranslation(["navigation", "courses"]);

  return (
    <div className="safe-bottom-padding">
      <h3 className="font-label text-lg font-normal text-brand-gray-900">
        {t(($) => $.navigation.links.my_courses)}
      </h3>
      <p className="pt-1 pb-3 text-sm text-brand-gray-600">
        {t(($) => $.courses.list.descriptions.in_progress)}
      </p>

      <Courses variant="in_progress" />
    </div>
  );
};

export default UserCoursesPage;
