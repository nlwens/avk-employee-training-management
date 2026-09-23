import { Button } from "@ui/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";

interface QuizStepFooterProps {
  totalSteps: number;
  step: number;
  isOptionSelected: boolean;
  isAnswered: boolean;
  isPending: boolean;
  onAction: () => void;
  onBack: () => void;
}

const QuizStepFooter = ({
  totalSteps,
  step,
  isOptionSelected,
  isAnswered,
  isPending,
  onAction,
  onBack,
}: QuizStepFooterProps) => {
  const isOnline = useOnlineStatus();
  const { t } = useTranslation("quiz");

  return (
    <div className="fixed safe-bottom left-0 w-full px-6 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-5xl mx-auto flex gap-3 md:justify-center">
        {step > 0 && (
          <Button
            onClick={onBack}
            aria-label={t(($) => $.quiz.taking.previous)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}

        <Button
          onClick={onAction}
          className="flex flex-1 gap-2 md:w-auto md:flex-none"
          disabled={
            isPending ||
            (!isAnswered && !isOptionSelected) ||
            (!isAnswered && !isOnline)
          }
        >
          {!isAnswered
            ? t(($) => $.quiz.taking.check)
            : step === totalSteps - 1
              ? t(($) => $.quiz.taking.submit)
              : t(($) => $.quiz.taking.next)}
        </Button>
      </div>
    </div>
  );
};

export default QuizStepFooter;
