import { useCallback, useMemo, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "i18n";
import { useAuth } from "auth-context";
import { useToast } from "ui/hooks/use-toast";
import {
  ApiErrorHandlerProvider,
  type ApiErrorHandlerContextValue,
} from "../context/apiErrorHandler.context";
import type { HandleApiErrorConfig } from "../handleApiError";
import type { UseHandleApiErrorOptions } from "../hooks/useHandleApiError";

export const AppApiErrorHandlerProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { toast } = useToast();
  const { logout: authLogout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation(["errors"]);

  const logout = useCallback(() => {
    queryClient.clear();
    authLogout();
  }, [authLogout, queryClient]);

  const getMessages = useCallback(
    (options?: UseHandleApiErrorOptions): HandleApiErrorConfig["messages"] => ({
      sessionExpired: t(($) => $.errors.session_expired),
      forbidden: options?.messages?.forbidden ?? t(($) => $.errors.forbidden),
      notFound:
        options?.messages?.notFound ?? t(($) => $.errors.resource_not_found),
      conflict: options?.messages?.conflict ?? t(($) => $.errors.conflict),
      unexpectedError:
        options?.messages?.unexpectedError ?? t(($) => $.errors.unexpected),
    }),
    [t],
  );

  const value = useMemo<ApiErrorHandlerContextValue>(
    () => ({ toast, navigate, logout, getMessages }),
    [toast, navigate, logout, getMessages],
  );

  return (
    <ApiErrorHandlerProvider value={value}>{children}</ApiErrorHandlerProvider>
  );
};
