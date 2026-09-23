import { Loader2Icon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@ui/lib/utils";

type LoadingSpinnerSize = "sm" | "md" | "lg";

const sizeClassNames: Record<LoadingSpinnerSize, string> = {
  sm: "size-4",
  md: "size-6",
  lg: "size-10",
};

export interface LoadingSpinnerProps {
  size?: LoadingSpinnerSize;
  showLabel?: boolean;
  label?: string;
  fullScreen?: boolean;
  className?: string;
  spinnerClassName?: string;
}

const LoadingSpinner = ({
  size = "md",
  showLabel = false,
  label,
  fullScreen = false,
  className,
  spinnerClassName,
}: LoadingSpinnerProps) => {
  const { t } = useTranslation("common");
  const resolvedLabel = label ?? t(($) => $.common.status.loading);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center justify-center gap-2 text-gray-500",
        fullScreen && "w-full min-h-[calc(100dvh-9.5rem)] flex-1",
        className,
      )}
    >
      <Loader2Icon
        aria-hidden="true"
        className={cn("animate-spin", sizeClassNames[size], spinnerClassName)}
      />
      {showLabel ? (
        <span className="text-sm">{resolvedLabel}</span>
      ) : (
        <span className="sr-only">{resolvedLabel}</span>
      )}
    </div>
  );
};

export default LoadingSpinner;
