import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "@ui/hooks/use-toast";
import {
  QueryBoundary,
  questionsQueryOptions,
  userAnswersQueryOptions,
  useHandleApiError,
  useSuspenseQueries,
  useSuspenseQuery,
  type ApiError,
} from "@api/src";

import { DeleteConfirmationPopover } from "../common/DeleteConfirmationPopover";
import type { EmployeeDetailCourse } from "../../types/employee-detail";
import { useDeleteAllUserQuizAnswers } from "../../hooks/mutations/useDeleteAllUserQuizAnswers";
import { buildEmployeeCourseSubmission } from "../../utils/employeeDetail";
import CourseSubmissionDetail from "./CourseSubmissionDetail";

type Props = {
  userId: string;
  course: EmployeeDetailCourse | null;
  hasCompletedCourses: boolean;
};

const CourseSubmissionPanelContent = ({
  userId,
  course,
  hasCompletedCourses,
}: {
  userId: string;
  course: EmployeeDetailCourse;
  hasCompletedCourses: boolean;
}) => {
  const { t } = useTranslation(["employees", "common"]);
  const { toast } = useToast();
  const { handleApiError } = useHandleApiError();
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const { data: questions } = useSuspenseQuery(
    questionsQueryOptions(course.id),
  );

  const userAnswersResults = useSuspenseQueries({
    queries: questions.map((question) =>
      userAnswersQueryOptions(course.id, question.id),
    ),
  });

  const courseWithSubmission = buildEmployeeCourseSubmission(
    userId,
    course,
    questions,
    userAnswersResults.map((result) => result.data),
  );

  const deleteAllUserQuizAnswers = useDeleteAllUserQuizAnswers();

  const answeredQuestionIds =
    courseWithSubmission.submission?.questions
      .filter((question) => question.selectedAnswerId !== null)
      .map((question) => question.id) ?? [];

  const handleDeleteAllAnswers = () => {
    deleteAllUserQuizAnswers.mutate(
      {
        courseId: course.id,
        userId,
        questionIds: answeredQuestionIds,
      },
      {
        onSuccess: () => {
          toast({
            variant: "success",
            title: t(($) => $.common.status.success),
            description: t(
              ($) => $.employees.detail.messages.success.answers_deleted,
            ),
          });
          setShowDeleteConfirmation(false);
        },
        onError: (error: ApiError) => {
          handleApiError(error);
        },
      },
    );
  };

  return (
    <>
      <CourseSubmissionDetail
        course={courseWithSubmission}
        hasCompletedCourses={
          hasCompletedCourses || courseWithSubmission.status === "completed"
        }
        onDeleteAllAnswers={() => setShowDeleteConfirmation(true)}
        isDeletingAllAnswers={deleteAllUserQuizAnswers.isPending}
      />

      {showDeleteConfirmation && (
        <DeleteConfirmationPopover
          open
          onOpenChange={(open) => {
            if (!open) {
              setShowDeleteConfirmation(false);
            }
          }}
          title={t(($) => $.employees.detail.confirm.delete_answers.title)}
          description={t(
            ($) => $.employees.detail.confirm.delete_answers.description,
          )}
          deleteLabel={t(($) => $.employees.detail.actions.delete_all_answers)}
          cancelLabel={t(($) => $.common.actions.cancel)}
          onConfirm={handleDeleteAllAnswers}
          isPending={deleteAllUserQuizAnswers.isPending}
        />
      )}
    </>
  );
};

const CourseSubmissionPanel = ({
  userId,
  course,
  hasCompletedCourses,
}: Props) => {
  const { t } = useTranslation(["employees"]);

  if (!course) {
    return (
      <CourseSubmissionDetail
        course={null}
        hasCompletedCourses={hasCompletedCourses}
      />
    );
  }

  return (
    <QueryBoundary
      key={course.id}
      errorMessage={t(($) => $.employees.messages.error.loading)}
    >
      <CourseSubmissionPanelContent
        userId={userId}
        course={course}
        hasCompletedCourses={hasCompletedCourses}
      />
    </QueryBoundary>
  );
};

export default CourseSubmissionPanel;
