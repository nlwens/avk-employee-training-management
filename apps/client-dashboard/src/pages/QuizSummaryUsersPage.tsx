import React from "react";
import { useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  courseQueryOptionsWithCache,
  courseQuizResultsQueryOptions,
  usersQueryOptions,
  useSuspenseQueries,
} from "api/src";
import QuizResultsTable, {
  type QuizResultRow,
} from "../components/quizzes/QuizResultsTable";

const QuizSummaryUsersPage: React.FC = () => {
  const { courseId } = useParams() as { courseId: string };

  const queryClient = useQueryClient();

  const [{ data: results }, { data: users }, { data: course }] =
    useSuspenseQueries({
      queries: [
        courseQuizResultsQueryOptions(courseId),
        usersQueryOptions(),
        courseQueryOptionsWithCache(courseId, queryClient),
      ],
    });

  // The quiz results only carry user identifiers; pull names from the users list.
  const usersById = new Map(users.map((user) => [user.id, user]));

  const rows: QuizResultRow[] = results.map((result) => ({
    userId: result.userId,
    name: usersById.get(result.userId)?.name ?? "",
    surname: usersById.get(result.userId)?.surname ?? "",
    score: result.score,
    total: course.questionsCount,
    submittedAt: result.submittedAt,
  }));

  return <QuizResultsTable results={rows} />;
};

export default QuizSummaryUsersPage;
