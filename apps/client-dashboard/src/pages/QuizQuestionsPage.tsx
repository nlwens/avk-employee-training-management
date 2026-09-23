import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import type { SubmitHandler } from "react-hook-form";
import { useTranslation } from "react-i18next";

import {
  createAnswer,
  createQuestion,
  deleteAnswer,
  deleteQuestion,
  queryClient,
  questionsQueryKey,
  toApiError,
  updateAnswer,
  updateQuestion,
  useHandleApiError,
  useMutation,
  useQuestions,
} from "@api/src";
import type { QuizFormValues } from "@ui/components/forms/validators";
import { useToast } from "@ui/hooks/use-toast";

import QuizForm from "../components/quizzes/QuizForm";
import {
  mapQuestionsToQuizFormValues,
  syncCourseQuestions,
} from "../api/quizQuestionsApi";

/**
 * Fetches the course questions and renders the quiz form in either view or edit
 * mode. Saving can run multiple API requests, so partial failures are reported
 * with completed/failed counts and the latest backend data is refetched.
 */
const QuizQuestionsPage = () => {
  const { courseId } = useParams() as { courseId: string };
  const { t } = useTranslation(["quiz", "common"]);
  const { toast } = useToast();
  const { handleApiError } = useHandleApiError();

  const { data: questions } = useQuestions(courseId);
  const [isEditing, setIsEditing] = useState(questions.length === 0);

  const initialData = useMemo(
    () => mapQuestionsToQuizFormValues(questions),
    [questions],
  );

  /**
   * Keeps the form focused on editing while the page handles API orchestration.
   */
  const saveQuestionsMutation = useMutation({
    mutationFn: (values: QuizFormValues) =>
      syncCourseQuestions({
        courseId,
        originalQuestions: questions,
        nextValues: values,
        mutations: {
          createQuestion: ({ courseId, body }) =>
            createQuestion(courseId, body),
          updateQuestion: ({ courseId, questionId, body }) =>
            updateQuestion(courseId, questionId, body),
          deleteQuestion: ({ courseId, questionId }) =>
            deleteQuestion(courseId, questionId),
          createAnswer: ({ courseId, questionId, body }) =>
            createAnswer(courseId, questionId, body),
          updateAnswer: ({ courseId, questionId, answerId, body }) =>
            updateAnswer(courseId, questionId, answerId, body),
          deleteAnswer: ({ courseId, questionId, answerId }) =>
            deleteAnswer(courseId, questionId, answerId),
        },
      }),
  });

  /**
   * Saves edited questions and refreshes the local form state from the backend.
   */
  const handleSave: SubmitHandler<QuizFormValues> = async (values) => {
    try {
      const result = await saveQuestionsMutation.mutateAsync(values);

      await queryClient.invalidateQueries({
        queryKey: questionsQueryKey(courseId),
      });

      if (result.failed > 0) {
        toast({
          variant: "destructive",
          title: t(($) => $.quiz.editor.messages.error.partial_update_failed),
          description: t(
            ($) => $.quiz.editor.messages.error.partial_update_result,
            {
              completed: result.completed,
              failed: result.failed,
            },
          ),
        });
        return;
      }

      toast({
        variant: "success",
        title: t(($) => $.common.status.success),
        description: t(($) => $.quiz.editor.messages.success.updated),
      });

      setIsEditing(false);
    } catch (error) {
      await queryClient.invalidateQueries({
        queryKey: questionsQueryKey(courseId),
      });

      const apiError = toApiError(error);

      if (apiError) {
        handleApiError(apiError, {
          messages: {
            unexpectedError: t(($) => $.quiz.editor.messages.error.updating),
          },
        });
        return;
      }

      toast({
        variant: "destructive",
        description: t(($) => $.quiz.editor.messages.error.updating),
      });
    }
  };

  return (
    <QuizForm
      initialData={initialData}
      isEditing={isEditing}
      isSubmitting={saveQuestionsMutation.isPending}
      showHeader
      onEdit={() => setIsEditing(true)}
      onSubmit={handleSave}
      onCancel={() => setIsEditing(false)}
    />
  );
};

export default QuizQuestionsPage;
