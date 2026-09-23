import { useTranslation } from "react-i18next";
import { useLocalize } from "i18n";
import { Lock } from "lucide-react";
import { cn } from "@ui/lib/utils";
import AnswerOption, { type AnswerVariant } from "../stepper/AnswerOption.tsx";
import type { Answer, AnswerSubmission } from "@api/src";

interface QuizStepContentProps {
  questionText: string;
  options: Answer[];
  selectedOption: string | null;
  onOptionSelect: (id: string) => void;
  submissionResult: AnswerSubmission | null;
  locked: boolean;
}

const QuizStepContent = ({
  questionText,
  options,
  selectedOption,
  onOptionSelect,
  submissionResult,
  locked,
}: QuizStepContentProps) => {
  const { t, i18n } = useTranslation("quiz");
  const { localize } = useLocalize();

  const getVariant = (answerId: string): AnswerVariant => {
    // If there is no user submission, the answer should not be highlighted.
    if (!submissionResult) {
      return "default";
    }

    // If there is a submission, and it is the correct answer, highlight it correctly.
    if (answerId === submissionResult.correctAnswerId) {
      return "correct";
    }

    // There is a submission, it is not the correct answer, but the user selected it. Highlight it incorrectly.
    if (answerId === selectedOption) {
      return "incorrect";
    }

    return "default";
  };

  return (
    <div
      className={cn(
        "no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto md:items-center items-start space-y-6",
        submissionResult ? "justify-start" : "justify-center",
      )}
    >
      <p className="reading-text max-w-2xl text-brand-gray-900">
        {questionText}
      </p>

      {submissionResult && (
        <div className="mt-5 w-full max-w-2xl rounded-lg border border-solid border-brand-gray-400 p-4">
          <p className="reading-text text-brand-gray-900">
            {
              submissionResult.explanation[
                i18n.resolvedLanguage || i18n.language
              ]
            }
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3 w-full max-w-2xl mt-3">
        {options.map((option) => (
          <AnswerOption
            key={option.id}
            label={localize(option.translations, "text")}
            selected={selectedOption === option.id}
            onClick={() => onOptionSelect(option.id)}
            variant={getVariant(option.id)}
            disabled={!!submissionResult}
          />
        ))}
      </div>

      {locked && (
        <div className="flex w-full max-w-2xl items-center gap-2 text-sm text-brand-gray-600">
          <Lock className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{t(($) => $.quiz.taking.locked)}</span>
        </div>
      )}
    </div>
  );
};

export default QuizStepContent;
