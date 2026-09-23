import { useTranslation } from "react-i18next";

import { cn } from "@ui/lib/utils";
import { useLocalize } from "i18n";
import type { DashboardCourse } from "../../types/course";

type CourseCardProps = {
  course: DashboardCourse;
  className?: string;
};

const CourseCard = ({ course, className }: CourseCardProps) => {
  const { t } = useTranslation(["courses", "chapters"]);
  const { localize } = useLocalize();
  const title = localize(course.translations, "title");

  return (
    <article
      className={cn(
        "flex flex-col overflow-hidden rounded-lg shadow-xs bg-white",
        className,
      )}
    >
      <div className="flex flex-1 items-center px-5 py-5">
        <span
          className="line-clamp-2 text-lg font-medium text-black"
          title={title}
        >
          {title}
        </span>
      </div>

      <div className="border-t border-gray-300 px-5 py-3 text-base text-black">
        {t(($) => $.chapters.display.count, { count: course.chaptersCount })}
      </div>
    </article>
  );
};

export default CourseCard;
