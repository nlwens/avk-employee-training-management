import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { CourseAverageScore } from "../../types/dashboard";
import CourseAverageScoresBody from "./CourseAverageScoresBody";

interface CourseAverageScoresProps {
  courses?: CourseAverageScore[];
  children?: ReactNode;
  footer?: ReactNode;
}

const CourseAverageScores = ({
  courses,
  children,
  footer,
}: CourseAverageScoresProps) => {
  const { t } = useTranslation("courses");

  return (
    <section className="pt-5">
      <div className="max-w-lg rounded-md border border-brand-border bg-white">
        <span className="block p-4 font-medium">
          {t(($) => $.courses.dashboard.average_quiz_score)}
        </span>

        <hr className="border-brand-border" />

        {children ?? <CourseAverageScoresBody courses={courses ?? []} />}

        {footer && (
          <>
            <hr className="border-brand-border" />
            <div className="p-2">{footer}</div>
          </>
        )}
      </div>
    </section>
  );
};

export default CourseAverageScores;
