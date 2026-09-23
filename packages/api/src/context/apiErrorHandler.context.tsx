import { createContext, useContext, type ReactNode } from "react";
import type { HandleApiErrorConfig } from "../handleApiError";
import type { UseHandleApiErrorOptions } from "../hooks/useHandleApiError";

export type ApiErrorHandlerContextValue = {
  toast: HandleApiErrorConfig["toast"];
  navigate: HandleApiErrorConfig["navigate"];
  logout: HandleApiErrorConfig["logout"];
  getMessages: (
    options?: UseHandleApiErrorOptions,
  ) => HandleApiErrorConfig["messages"];
};

const ApiErrorHandlerContext =
  createContext<ApiErrorHandlerContextValue | null>(null);

export const ApiErrorHandlerProvider = ({
  children,
  value,
}: {
  children: ReactNode;
  value: ApiErrorHandlerContextValue;
}) => (
  <ApiErrorHandlerContext.Provider value={value}>
    {children}
  </ApiErrorHandlerContext.Provider>
);

export function useApiErrorHandlerContext(): ApiErrorHandlerContextValue {
  const context = useContext(ApiErrorHandlerContext);

  if (!context) {
    throw new Error(
      "useHandleApiError must be used within an ApiErrorHandlerProvider",
    );
  }

  return context;
}
