import { useCallback } from "react";
import type { ApiError } from "../api";
import { getApiErrorStatusCode } from "../api";
import { useApiErrorHandlerContext } from "../context/apiErrorHandler.context";
import { handleApiError, type HandleApiErrorConfig } from "../handleApiError";

export type UseHandleApiErrorOptions = Pick<
  HandleApiErrorConfig,
  "onNotFound"
> & {
  messages?: Partial<HandleApiErrorConfig["messages"]>;
};

export function useHandleApiError() {
  const { toast, navigate, logout, getMessages } = useApiErrorHandlerContext();

  const handleApiErrorCallback = useCallback(
    (error: ApiError, options?: UseHandleApiErrorOptions) => {
      handleApiError(error, {
        toast,
        navigate,
        logout,
        messages: getMessages(options),
        onNotFound: options?.onNotFound,
      });
    },
    [toast, navigate, logout, getMessages],
  );

  return {
    handleApiError: handleApiErrorCallback,
    getStatusCode: getApiErrorStatusCode,
  };
}
