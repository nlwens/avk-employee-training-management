import { useSuspenseQueries } from "@tanstack/react-query";
import { useAuth } from "@auth-context/src";
import { userAnswersQueryOptions, type Question } from "@api/src";

export const useUserAnswers = (courseId: string, questions: Question[]) => {
  const { user } = useAuth();

  return useSuspenseQueries({
    queries: questions.map((question: Question) =>
      userAnswersQueryOptions(courseId, question.id),
    ),
    combine: (results) => ({
      data: results.map((result) =>
        result.data
          ? result.data.filter((answer) => answer.userId === user!.id)
          : [],
      ),
    }),
  });
};
