import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { Course } from "@api/src";
import { useLocalize } from "i18n";

interface CourseProps {
  course: Course;
  onFocus?: () => Awaited<void>;
  onMouseEnter?: () => Awaited<void>;
}

const CourseCard = ({ course, onFocus, onMouseEnter }: CourseProps) => {
  const { localize } = useLocalize();
  const { t } = useTranslation(["courses", "chapters"]);

  return (
    <Link
      to={`/courses/${course.id}`}
      onFocus={onFocus}
      onMouseEnter={onMouseEnter}
      className="flex flex-col gap-2 rounded-lg border border-solid border-brand-gray-400 bg-white p-4 transition-colors hover:border-brand-primary-500"
    >
      <h3 className="font-label text-base text-black">
        {localize(course.translations, "title")}
      </h3>
      <p className="text-sm text-brand-gray-600">
        {t(($) => $.chapters.display.progress, {
          completed: course.completedChaptersCount,
          total: course.chaptersCount,
        })}
      </p>
    </Link>
  );
};

export default CourseCard;
