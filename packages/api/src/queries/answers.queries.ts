import { queryOptions } from "@tanstack/react-query";
import { API } from "../api";
import type { UserAnswer } from "../types/user-answers";

export const userAnswersQueryOptions = (courseId: string, questionId: string) =>
  queryOptions({
    queryKey: ["courses", courseId, "questions", questionId, "user-answers"],
    queryFn: () =>
      API.get<UserAnswer[]>(
        `/courses/${courseId}/questions/${questionId}/user-answers`,
      ),
  });

export const deleteUserAnswer = (
  courseId: string,
  questionId: string,
  userId: string,
) =>
  API.delete<void>(
    `/courses/${courseId}/questions/${questionId}/user-answers/${userId}`,
  );
