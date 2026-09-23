import { useSuspenseQuery } from "@tanstack/react-query";
import { questionsQueryOptions } from "../../queries/questions.queries";

export const useQuestions = (courseId: string) =>
  useSuspenseQuery(questionsQueryOptions(courseId));
