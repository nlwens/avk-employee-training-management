import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  type AnswerSubmission,
  type ApiError,
  type UserAnswer,
  userAnswersQueryOptions,
} from "@api/src";
import { API } from "@api/src";
import { useAuth } from "@auth-context/src";

interface SubmitAnswerVariables {
  courseId: string;
  questionId: string;
  answerId: string;
}

export const useSubmitAnswer = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<AnswerSubmission, ApiError, SubmitAnswerVariables>({
    mutationFn: ({ courseId, questionId, answerId }: SubmitAnswerVariables) =>
      API.post<AnswerSubmission>(
        `/courses/${courseId}/questions/${questionId}/user-answers`,
        { answerId },
      ),
    onSuccess: (
      submission: AnswerSubmission,
      { courseId, questionId, answerId }: SubmitAnswerVariables,
    ) =>
      queryClient.setQueryData<UserAnswer[]>(
        userAnswersQueryOptions(courseId, questionId).queryKey,
        [
          {
            ...submission,
            answerId,
            userId: user!.id,
            createdAt: new Date().toISOString(),
          },
        ],
      ),
  });
};
