import { useEffect } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { questionsQueryOptions } from "../../queries/questions.queries";
import { userAnswersQueryOptions } from "../../queries/answers.queries";

type PrefetchQuestionsProps = {
  courseId: string;
  enabled?: boolean;
};

export const prefetchQuestions = async (
  queryClient: QueryClient,
  courseId: string,
): Promise<void> => {
  const questions = await queryClient.ensureQueryData(
    questionsQueryOptions(courseId),
  );

  for (const question of questions) {
    void queryClient.prefetchQuery(
      userAnswersQueryOptions(courseId, question.id),
    );
  }
};

export const usePrefetchQuestions = ({
  courseId,
  enabled,
}: PrefetchQuestionsProps) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (enabled === false) {
      return;
    }

    void prefetchQuestions(queryClient, courseId);
  }, [queryClient, courseId, enabled]);
};
