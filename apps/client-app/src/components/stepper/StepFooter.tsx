import { Button } from "@ui/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";

interface StepFooterProps {
  steps: unknown[];
  step: number;
  onGoToStep: (index: number) => void;
  courseId?: string;
}

const StepFooter = ({ steps, step, onGoToStep, courseId }: StepFooterProps) => {
  const isOnline = useOnlineStatus();
  const { t } = useTranslation("quiz");

  return (
    <div className="fixed safe-bottom left-0 w-full flex justify-between px-5 pointer-events-none">
      <div className="pointer-events-auto">
        {step > 0 && (
          <Button onClick={() => onGoToStep(step - 1)} className="flex gap-2">
            <ChevronLeft className="w-4 h-4" />
          </Button>
        )}
      </div>

      {step === steps.length - 1 ? (
        <div className="fixed safe-bottom right-5 pointer-events-none">
          <div className="pointer-events-auto">
            {isOnline ? (
              <Link to={`/courses/${courseId}/quiz`}>
                <Button>{t(($) => $.quiz.taking.start)}</Button>
              </Link>
            ) : (
              <Button disabled>{t(($) => $.quiz.taking.start)}</Button>
            )}
          </div>
        </div>
      ) : (
        <div className="pointer-events-auto">
          <Button onClick={() => onGoToStep(step + 1)} className="flex gap-2">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default StepFooter;
