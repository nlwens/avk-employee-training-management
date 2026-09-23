import type { ReactNode } from "react";
import { cn } from "@ui/lib/utils";
import { Button } from "@ui/components/ui/button";

export interface ErrorAlertProps {
  children: ReactNode;
  className?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  retryLabel?: string;
}

const ErrorAlert = ({
  children,
  className,
  onRetry,
  isRetrying = false,
  retryLabel,
}: ErrorAlertProps) => {
  return (
    <div
      className={cn(
        "rounded border border-red-200 bg-red-50 px-4 py-6 text-center text-sm text-red-600",
        className,
      )}
      role="alert"
    >
      <div>{children}</div>
      {onRetry && retryLabel && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4 border-red-300 text-red-700 hover:bg-red-100"
          onClick={onRetry}
          disabled={isRetrying}
        >
          {retryLabel}
        </Button>
      )}
    </div>
  );
};

export default ErrorAlert;
