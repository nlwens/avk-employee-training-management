import { Check, X } from "lucide-react";
import { cn } from "@ui/lib/utils";

export type AnswerVariant = "default" | "correct" | "incorrect";

interface AnswerOptionProps {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  variant?: AnswerVariant;
  onClick?: () => void;
}

const AnswerOption = ({
  label,
  selected = false,
  disabled = false,
  variant = "default",
  onClick,
}: AnswerOptionProps) => {
  const isCorrect = variant === "correct";
  const isIncorrect = variant === "incorrect";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full rounded-lg border border-solid bg-white p-4 text-left transition-colors",
        !disabled && "hover:border-brand-primary-500",
        disabled && "cursor-default",
        variant === "default" &&
          (selected
            ? "border-brand-primary-500 bg-brand-primary-500/5"
            : "border-brand-gray-400"),
        isCorrect && "border-green-500 bg-green-50",
        isIncorrect && "border-red-500 bg-red-50",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        {isCorrect && <Check className="w-4 h-4 text-green-500 shrink-0" />}
        {isIncorrect && <X className="w-4 h-4 text-red-500 shrink-0" />}
      </div>
    </button>
  );
};

export default AnswerOption;
