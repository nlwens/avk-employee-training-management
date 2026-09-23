import React, { Suspense, useLayoutEffect, type ReactNode } from "react";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { useTranslation } from "i18n";
import ErrorAlert from "ui/components/ErrorAlert";
import LoadingSpinner from "ui/components/LoadingSpinner";
import { ErrorBoundary } from "./ErrorBoundary";
import { getApiErrorStatusCode, toApiError } from "../api";
import { useHandleApiError } from "../hooks/useHandleApiError";
import type { UseHandleApiErrorOptions } from "../hooks/useHandleApiError";

// HTTP status codes whose handling is fully or partially automatic.
const HANDLED_STATUS_CODES = [401, 403, 404];

type QueryBoundaryProps = {
  children: ReactNode;
  /**
   * Called after a 404 toast error is shown. Use this to clean up stale cache
   * entries and navigate the user to an appropriate parent route.
   */
  onNotFound?: UseHandleApiErrorOptions["onNotFound"];
  /** Override the default toast messages shown for handled HTTP errors. */
  messages?: UseHandleApiErrorOptions["messages"];
  /** Message shown in the `ErrorAlert` for unhandled errors (5xx, network). */
  errorMessage?: string;
  /** Custom loading fallback. Defaults to a `<LoadingSpinner />`. */
  loadingFallback?: ReactNode;
};

interface QueryErrorFallbackProps extends Omit<
  QueryBoundaryProps,
  "children" | "loadingFallback"
> {
  error: unknown;
  reset: () => void;
}

const QueryErrorFallback: React.FC<QueryErrorFallbackProps> = ({
  error,
  reset,
  onNotFound,
  messages,
  errorMessage,
}: QueryErrorFallbackProps) => {
  const { handleApiError } = useHandleApiError();
  const { t } = useTranslation(["errors", "common"]);

  const statusCode = getApiErrorStatusCode(error) || -1;
  const apiError = toApiError(error);
  const isRoutedError = HANDLED_STATUS_CODES.includes(statusCode);

  useLayoutEffect(() => {
    if (apiError && isRoutedError) {
      handleApiError(apiError, { onNotFound, messages });
    }
  }, [apiError, isRoutedError, handleApiError, onNotFound, messages]);

  if (isRoutedError) {
    return null;
  }

  return (
    <div className="flex items-center justify-center p-8">
      <ErrorAlert
        onRetry={reset}
        retryLabel={t(($) => $.common.actions.reload)}
      >
        {errorMessage ?? t(($) => $.errors.unexpected)}
      </ErrorAlert>
    </div>
  );
};

/**
 * All-in-one wrapper for data-fetching pages that use suspense queries.
 *
 * The default error handling works as follows:
 *
 * - 401: logout and redirect to /login (via `AppApiErrorHandlerProvider` context)
 * - 403: destructive toast
 * - 404: destructive toast + `onNotFound()` callback
 * - 5xx / network: inline `ErrorAlert` with a "Reload" retry button; clicking
 *   it calls `QueryErrorResetBoundary.reset()` then clears the boundary,
 *   causing TanStack to re-fetch the failed query.
 *
 * An example usage for a 404 that requires cache cleanup before redirecting:
 *
 * ```tsx
 * <QueryBoundary
 *   onNotFound={() => {
 *     queryClient.removeQueries(courseChaptersQueryOptions(courseId));
 *     navigate(`/courses/${courseId}`, { replace: true });
 *   }}
 *   messages={{ notFound: t(($) => $.courses.messages.error.not_found) }}
 *   errorMessage={t(($) => $.courses.messages.error.loading)}
 * >
 *   <ChapterContent />
 * </QueryBoundary>
 * ```
 */
export const QueryBoundary = ({
  children,
  onNotFound,
  messages,
  errorMessage,
  loadingFallback,
}: QueryBoundaryProps) => (
  <QueryErrorResetBoundary>
    {({ reset: resetQuery }) => (
      <ErrorBoundary
        fallback={(error, resetBoundary) => (
          <QueryErrorFallback
            error={error}
            reset={() => {
              resetQuery();
              resetBoundary();
            }}
            onNotFound={onNotFound}
            messages={messages}
            errorMessage={errorMessage}
          />
        )}
      >
        <Suspense
          fallback={loadingFallback ?? <LoadingSpinner size="lg" fullScreen />}
        >
          {children}
        </Suspense>
      </ErrorBoundary>
    )}
  </QueryErrorResetBoundary>
);
