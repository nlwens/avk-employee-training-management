import {
  deleteUserAnswer,
  infiniteUserCourseStatsQueryOptions,
  useMutation,
  useQueryClient,
  userAnswersQueryOptions,
  type ApiError,
  type UserAnswer,
} from "@api/src";

interface DeleteAllUserQuizAnswersVariables {
  courseId: string;
  userId: string;
  questionIds: string[];
}

export const useDeleteAllUserQuizAnswers = () => {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, DeleteAllUserQuizAnswersVariables>({
    mutationFn: async ({ courseId, userId, questionIds }) => {
      await Promise.all(
        questionIds.map((questionId) =>
          deleteUserAnswer(courseId, questionId, userId),
        ),
      );
    },
    onSuccess: (_data, { courseId, userId, questionIds }) => {
      for (const questionId of questionIds) {
        queryClient.setQueryData<UserAnswer[]>(
          userAnswersQueryOptions(courseId, questionId).queryKey,
          (answers) =>
            answers?.filter((answer) => answer.userId !== userId) ?? [],
        );
      }

      void queryClient.invalidateQueries({
        queryKey: infiniteUserCourseStatsQueryOptions(userId).queryKey,
      });
    },
  });
};
