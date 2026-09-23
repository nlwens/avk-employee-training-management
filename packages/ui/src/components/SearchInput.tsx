import * as React from "react";
import { SearchIcon, XIcon } from "lucide-react";

import { Input } from "@ui/components/ui/input";
import { cn } from "@ui/lib/utils";
import {
  setUrlSearchParam,
  useUrlSearchParam,
} from "@ui/hooks/useUrlSearchParam";

export interface SearchInputProps extends Omit<
  React.ComponentProps<typeof Input>,
  "type" | "value" | "defaultValue" | "onChange"
> {
  queryParamName?: string;
  debounceMs?: number;
  replaceUrl?: boolean;
  inputClassName?: string;
  clearButtonLabel?: string;
  onDebouncedValueChange?: (value: string) => void;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      queryParamName = "search",
      debounceMs = 1000,
      replaceUrl = true,
      placeholder = "Search...",
      className,
      inputClassName,
      clearButtonLabel = "Clear search",
      onDebouncedValueChange,
      disabled,
      ...props
    },
    ref,
  ) => {
    const urlValue = useUrlSearchParam(queryParamName);
    const [draftValue, setDraftValue] = React.useState<string | null>(null);
    const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const value = draftValue ?? urlValue;

    const clearPendingCommit = React.useCallback(() => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }, []);

    const commitValue = React.useCallback(
      (nextValue: string) => {
        const trimmedValue = nextValue.trim();

        setUrlSearchParam({
          paramName: queryParamName,
          value: trimmedValue,
          replace: replaceUrl,
        });

        onDebouncedValueChange?.(trimmedValue);
        setDraftValue(null);
      },
      [onDebouncedValueChange, queryParamName, replaceUrl],
    );

    const queueCommit = React.useCallback(
      (nextValue: string) => {
        clearPendingCommit();

        if (debounceMs <= 0) {
          commitValue(nextValue);
          return;
        }

        timeoutRef.current = setTimeout(() => {
          commitValue(nextValue);
        }, debounceMs);
      },
      [clearPendingCommit, commitValue, debounceMs],
    );

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextValue = event.target.value;

      setDraftValue(nextValue);
      queueCommit(nextValue);
    };

    const handleClear = () => {
      clearPendingCommit();
      setDraftValue("");
      commitValue("");
    };

    React.useEffect(() => {
      return () => clearPendingCommit();
    }, [clearPendingCommit]);

    return (
      <div className={cn("relative w-full", className)}>
        <SearchIcon
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        />

        <Input
          ref={ref}
          type="text"
          role="searchbox"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          className={cn("pr-10 pl-9", inputClassName)}
          {...props}
        />

        {value && !disabled ? (
          <button
            type="button"
            aria-label={clearButtonLabel}
            onClick={handleClear}
            className="absolute top-1/2 right-3 inline-flex size-5 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <XIcon aria-hidden="true" className="size-4" />
          </button>
        ) : null}
      </div>
    );
  },
);

SearchInput.displayName = "SearchInput";
