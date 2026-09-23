import { queryOptions } from "@tanstack/react-query";
import { API } from "../api";
import type {
  Answer,
  CreateAnswerInput,
  CreateQuestionInput,
  Question,
  UpdateAnswerInput,
  UpdateQuestionInput,
} from "../types/questions";

export const questionsQueryKey = (courseId: string) =>
  ["courses", courseId, "questions"] as const;

export const questionsQueryOptions = (courseId: string) =>
  queryOptions({
    queryKey: questionsQueryKey(courseId),
    queryFn: () => API.get<Question[]>(`/courses/${courseId}/questions`),
  });

export const createQuestion = (courseId: string, body: CreateQuestionInput) =>
  API.post<Question>(`/courses/${courseId}/questions`, body);

export const updateQuestion = (
  courseId: string,
  questionId: string,
  body: UpdateQuestionInput,
) => API.patch<Question>(`/courses/${courseId}/questions/${questionId}`, body);

export const deleteQuestion = (courseId: string, questionId: string) =>
  API.delete<void>(`/courses/${courseId}/questions/${questionId}`);

export const createAnswer = (
  courseId: string,
  questionId: string,
  body: CreateAnswerInput,
) =>
  API.post<Answer>(
    `/courses/${courseId}/questions/${questionId}/answers`,
    body,
  );

export const updateAnswer = (
  courseId: string,
  questionId: string,
  answerId: string,
  body: UpdateAnswerInput,
) =>
  API.patch<Answer>(
    `/courses/${courseId}/questions/${questionId}/answers/${answerId}`,
    body,
  );

export const deleteAnswer = (
  courseId: string,
  questionId: string,
  answerId: string,
) =>
  API.delete<void>(
    `/courses/${courseId}/questions/${questionId}/answers/${answerId}`,
  );
