import { useTranslation } from "react-i18next";

interface QuizStatisticsSectionProps {
  questionsCount: number;
  averageScorePercentage: number;
  showTitle?: boolean;
}

const QuizStatisticsSection = ({
  questionsCount,
  averageScorePercentage,
  showTitle = false,
}: QuizStatisticsSectionProps) => {
  const { t } = useTranslation("quiz");

  return (
    <section>
      {showTitle && (
        <div className="mb-4 border-b border-gray-400 pb-1">
          <span className="font-medium text-lg">
            {t(($) => $.quiz.stats.title)}
          </span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <article className="rounded-md border border-gray-300 bg-white p-4">
          <p className="text-sm text-gray-600">
            {t(($) => $.quiz.stats.question_count)}
          </p>
          <p className="text-2xl font-semibold">{questionsCount}</p>
        </article>

        <article className="rounded-md border border-gray-300 bg-white p-4">
          <p className="text-sm text-gray-600">
            {t(($) => $.quiz.stats.average_score)}
          </p>
          <p className="text-2xl font-semibold">{averageScorePercentage}%</p>
        </article>
      </div>
    </section>
  );
};

export default QuizStatisticsSection;
