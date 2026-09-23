import { Outlet, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQueryClient, useSuspenseQueries } from "@tanstack/react-query";
import { courseQueryOptionsWithCache, courseStatsQueryOptions } from "api/src";
import QuizStatisticsSection from "../components/courses/QuizStatisticsSection";
import Tabs from "../components/tabs/Tabs";

const QuizSummaryPage = () => {
  const { courseId } = useParams() as { courseId: string };

  const { t } = useTranslation("quiz");
  const queryClient = useQueryClient();

  const [{ data: course }, { data: stats }] = useSuspenseQueries({
    queries: [
      courseQueryOptionsWithCache(courseId, queryClient),
      courseStatsQueryOptions(courseId),
    ],
  });

  return (
    <div className="space-y-6">
      <QuizStatisticsSection
        questionsCount={course.questionsCount}
        averageScorePercentage={stats.averageScore}
      />

      <Tabs
        items={[
          { to: "users", label: t(($) => $.quiz.summary.users) },
          { to: "questions", label: t(($) => $.quiz.summary.questions_tab) },
        ]}
      />

      <Outlet />
    </div>
  );
};

export default QuizSummaryPage;
