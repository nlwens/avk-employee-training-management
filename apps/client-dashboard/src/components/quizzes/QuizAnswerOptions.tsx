import type { Question } from "@api/src";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useLocalize } from "i18n";
import { cn } from "@ui/lib/utils";
import { CircleCheckBig, XIcon } from "lucide-react";

type AnswerWithSelection = Question["answers"][number] & {
  isSelected?: boolean;
};

type QuestionWithSelection = Omit<Question, "answers"> & {
  selectedAnswerId?: string | null;
  answers: AnswerWithSelection[];
};

type Props = {
  number: number;
  question: QuestionWithSelection;
  className?: string;
  headerRight?: ReactNode;
  showSelectedAnswer?: boolean;
};

function getOptionLabel(index: number) {
  return String.fromCharCode(65 + index);
}

const QuizAnswerOptions = ({
  number,
  question,
  className,
  headerRight,
  showSelectedAnswer = false,
}: Props) => {
  const { t } = useTranslation("quiz");
  const { localize } = useLocalize();

  const questionText = localize(question.translations, "text");

  return (
    <div className={cn("space-y-1", className)}>
      <div
        className={cn(
          headerRight &&
            "flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between",
        )}
      >
        <span className="text-md font-semibold min-w-0">
          {t(($) => $.quiz.summary.question_label, {
            number,
            question: questionText,
          })}
        </span>

        {headerRight}
      </div>

      <ul className="space-y-1 text-sm">
        {question.answers.map((answer, index) => {
          const label = getOptionLabel(index);

          const hasSelectedAnswer = question.selectedAnswerId !== null;
          const shouldShowCorrectness =
            !showSelectedAnswer || hasSelectedAnswer;

          const isCorrect =
            shouldShowCorrectness && answer.id === question.correctAnswerId;

          const isSelected =
            showSelectedAnswer &&
            (answer.isSelected === true ||
              answer.id === question.selectedAnswerId);

          const isIncorrectSelected = isSelected && !isCorrect;

          return (
            <li key={answer.id}>
              <p
                className={cn(
                  "flex items-center justify-between gap-3 rounded px-2 py-1",
                  isCorrect && "font-semibold",
                  isSelected && "bg-gray-100",
                )}
              >
                <span>
                  {label}: {localize(answer.translations, "text")}
                </span>

                <span className="flex shrink-0 items-center gap-2">
                  {isCorrect && (
                    <CircleCheckBig
                      size={18}
                      className="block text-green-500"
                    />
                  )}

                  {isIncorrectSelected && (
                    <XIcon size={18} className="block text-red-500" />
                  )}
                </span>
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default QuizAnswerOptions;
