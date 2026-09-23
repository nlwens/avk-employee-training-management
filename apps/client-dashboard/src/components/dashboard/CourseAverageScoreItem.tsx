import { useTranslation } from "react-i18next";
import type { CourseAverageScore } from "../../types/dashboard";

interface CourseAverageScoreItemProps {
  course: CourseAverageScore;
}

const CourseAverageScoreItem = ({ course }: CourseAverageScoreItemProps) => {
  const { t } = useTranslation("courses");

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-4">
        <span>{course.courseName}</span>
        <span>{course.averageScorePercentage}%</span>
      </div>

      <div
        className="h-3 overflow-hidden rounded-full bg-gray-200"
        role="progressbar"
        aria-label={t(($) => $.courses.dashboard.quiz_score_label, {
          name: course.courseName,
        })}
        aria-valuenow={course.averageScorePercentage}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-avk-blue"
          style={{ width: `${course.averageScorePercentage}%` }}
        />
      </div>
    </div>
  );
};

export default CourseAverageScoreItem;
