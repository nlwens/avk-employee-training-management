import { type ReactNode } from "react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

// To learn more about garbage collection and caching, see the official docs:
// https://tanstack.com/query/v5/docs/framework/react/guides/caching

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
    },
  },
});

export const TanStackProvider = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);
