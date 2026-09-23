import type { ApiError } from "./api";

interface ToastOptions {
  variant?: "destructive" | "success" | "default";
  title?: string;
  description?: string;
}

export interface HandleApiErrorConfig {
  toast: (options: ToastOptions) => void;
  navigate: (to: string, options?: { replace?: boolean }) => void;
  logout: () => void;
  /**
   * Pre-translated messages for common HTTP errors.
   * The handler uses these instead of raw i18n keys so it stays independent.
   */
  messages: {
    sessionExpired: string;
    forbidden: string;
    notFound: string;
    conflict: string;
    unexpectedError: string;
  };
  /**
   * Called after the 404 toast is shown.
   * Use for cache invalidation and redirecting to the appropriate list page.
   */
  onNotFound?: () => void;
}

/** Unified API error handler for client applications. */
export function handleApiError(
  error: ApiError,
  config: HandleApiErrorConfig,
): void {
  const { toast, navigate, logout, messages } = config;

  switch (error.statusCode) {
    case 401:
      logout();
      toast({ variant: "destructive", description: messages.sessionExpired });
      navigate("/login", { replace: true });
      return;

    case 403:
      toast({ variant: "destructive", description: messages.forbidden });
      return;

    case 404:
      toast({ variant: "destructive", description: messages.notFound });
      config.onNotFound?.();
      return;

    case 409:
      toast({ variant: "destructive", description: messages.conflict });
      return;

    default:
      toast({ variant: "destructive", description: messages.unexpectedError });
  }
}
