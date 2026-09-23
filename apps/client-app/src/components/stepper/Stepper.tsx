import { cn } from "@ui/lib/utils";
import { Check } from "lucide-react";
import { Fragment, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

interface StepperProps {
  steps: readonly unknown[];
  current?: number;
  onStepClick?: (index: number) => void;
}

const STEP_MIN_WIDTH = 110;
const STEP_RING_INSET = 4;

interface StepIndicatorProps {
  index: number;
  completed: boolean;
  active: boolean;
  label?: string;
  onClick?: () => void;
}

const StepIndicator = ({
  index,
  completed,
  active,
  label,
  onClick,
}: StepIndicatorProps) => {
  const { t } = useTranslation(["courses", "chapters"]);
  const className = cn(
    "relative z-10 box-border flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-solid transition-all",
    onClick ? "cursor-pointer" : "cursor-default",
    (active || completed) &&
      "border-brand-primary-500 bg-brand-primary-500 text-white hover:bg-brand-primary-500 hover:text-white",
    active &&
      "ring-2 ring-brand-primary-500/25 ring-offset-2 ring-offset-background",
    !active &&
      !completed &&
      "border-brand-gray-400 bg-white text-brand-gray-600 hover:border-brand-gray-400 hover:bg-accent hover:text-brand-gray-600",
  );

  const content = completed ? (
    <Check className="h-4 w-4" aria-hidden="true" />
  ) : (
    <span className="text-sm font-semibold">{index + 1}</span>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={
          label ??
          `${t(($) => $.chapters.display.label, { number: index + 1 })}`
        }
        aria-current={active ? "step" : undefined}
        className={className}
      >
        {content}
      </button>
    );
  }

  return <span className={className}>{content}</span>;
};

const Stepper = ({ steps, current = 0, onStepClick }: StepperProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const safeCurrent = Math.max(0, Math.min(current, steps.length - 1));
  const compactLayout = steps.length >= 3;

  useEffect(() => {
    const activeStep = stepRefs.current[safeCurrent];
    const container = containerRef.current;

    if (activeStep && container) {
      activeStep.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [safeCurrent]);

  if (compactLayout) {
    return (
      <div
        ref={containerRef}
        role="list"
        aria-label="Progress"
        className="isolate flex w-full flex-row items-center overflow-x-auto no-scrollbar"
        style={{ padding: `${STEP_RING_INSET}px` }}
      >
        {steps.map((_, index) => {
          const completed = index < safeCurrent;
          const active = index === safeCurrent;

          return (
            <Fragment key={index}>
              <div
                role="listitem"
                aria-current={active ? "step" : undefined}
                ref={(el) => {
                  stepRefs.current[index] = el;
                }}
                className="relative z-10 shrink-0 rounded-full bg-background"
              >
                <StepIndicator
                  index={index}
                  completed={completed}
                  active={active}
                  label={
                    (steps[index] as { label?: string } | undefined)?.label
                  }
                  onClick={onStepClick ? () => onStepClick(index) : undefined}
                />
              </div>

              {index !== steps.length - 1 && (
                <div
                  className={cn(
                    "relative z-0 -mx-4 h-0.5 shrink-0 flex-1",
                    completed ? "bg-brand-primary-500" : "bg-brand-gray-400",
                  )}
                  style={{ minWidth: `${STEP_MIN_WIDTH}px` }}
                  aria-hidden="true"
                />
              )}
            </Fragment>
          );
        })}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      role="list"
      aria-label="Progress"
      className="flex w-full flex-row items-center overflow-x-auto overflow-y-visible py-1 no-scrollbar"
    >
      {steps.map((_, index) => {
        const completed = index < safeCurrent;
        const active = index === safeCurrent;

        return (
          <div
            key={index}
            role="listitem"
            aria-current={active ? "step" : undefined}
            ref={(el) => {
              stepRefs.current[index] = el;
            }}
            className="relative isolate flex flex-1 flex-col items-center"
            style={{ minWidth: `${STEP_MIN_WIDTH}px` }}
          >
            {index !== steps.length - 1 && (
              <div
                className={cn(
                  "absolute left-1/2 top-4 z-0 h-0.5 w-full",
                  completed ? "bg-brand-primary-500" : "bg-brand-gray-400",
                )}
                aria-hidden="true"
              />
            )}

            <div className="relative z-10 flex min-w-0 flex-col items-center">
              <StepIndicator
                index={index}
                completed={completed}
                active={active}
                label={(steps[index] as { label?: string } | undefined)?.label}
                onClick={onStepClick ? () => onStepClick(index) : undefined}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Stepper;
