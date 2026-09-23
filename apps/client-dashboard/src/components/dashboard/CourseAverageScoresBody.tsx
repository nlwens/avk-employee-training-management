import { useTranslation } from "react-i18next";
import type { CourseAverageScore } from "../../types/dashboard";
import CourseAverageScoreItem from "./CourseAverageScoreItem";

interface CourseAverageScoresBodyProps {
  courses: CourseAverageScore[];
}

const CourseAverageScoresBody = ({ courses }: CourseAverageScoresBodyProps) => {
  const { t } = useTranslation("courses");

  if (courses.length === 0) {
    return (
      <p className="p-4 text-sm text-gray-500">
        {t(($) => $.courses.dashboard.no_published_courses)}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5 p-4">
      {courses.map((course) => (
        <CourseAverageScoreItem key={course.courseName} course={course} />
      ))}
    </div>
  );
};

export default CourseAverageScoresBody;
