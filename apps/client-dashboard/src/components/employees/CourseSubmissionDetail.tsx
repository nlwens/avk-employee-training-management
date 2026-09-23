import { useTranslation } from "react-i18next";
import { dateFormatParams } from "i18n";
import { Button } from "@ui/components/ui/button";

import type { EmployeeDetailCourse } from "../../types/employee-detail";
import { DELETE_TRIGGER_CLASS_NAME } from "../common/DeleteConfirmationDialog";
import QuizAnswerOptions from "../quizzes/QuizAnswerOptions";

type Props = {
  course: EmployeeDetailCourse | null;
  hasCompletedCourses: boolean;
  onDeleteAllAnswers?: () => void;
  isDeletingAllAnswers?: boolean;
};

const CourseSubmissionDetail = ({
  course,
  hasCompletedCourses,
  onDeleteAllAnswers,
  isDeletingAllAnswers = false,
}: Props) => {
  const { t } = useTranslation("employees");

  if (!course) {
    return (
      <div className="flex min-h-48 items-center justify-center p-8 text-center text-sm text-gray-400">
        {hasCompletedCourses
          ? t(($) => $.employees.detail.select_course)
          : t(($) => $.employees.detail.no_completed_courses)}
      </div>
    );
  }

  if (!course.submission) {
    return (
      <div className="flex min-h-48 items-center justify-center p-8 text-center text-sm text-gray-400">
        {t(($) => $.employees.detail.no_submission)}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b border-gray-300 px-4 py-3 text-sm text-gray-600">
        <span>
          {t(($) => $.employees.detail.submitted, {
            date: new Date(course.submission.submittedAt),
            formatParams: dateFormatParams({
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
          })}
        </span>

        <span className="font-medium">{course.submission.score}</span>
      </div>

      <div className="space-y-6 p-4">
        {course.submission.questions.map((question, index) => (
          <QuizAnswerOptions
            key={question.id}
            number={index + 1}
            question={question}
            showSelectedAnswer
          />
        ))}
      </div>

      <div className="flex justify-center border-t border-gray-200 p-4">
        <Button
          type="button"
          variant="outline"
          className={DELETE_TRIGGER_CLASS_NAME}
          disabled={isDeletingAllAnswers}
          onClick={onDeleteAllAnswers}
        >
          {t(($) => $.employees.detail.actions.delete_all_answers)}
        </Button>
      </div>
    </div>
  );
};

export default CourseSubmissionDetail;
