import { Outlet } from "react-router-dom";
import { useRegisterSW } from "virtual:pwa-register/react";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { AppApiErrorHandlerProvider, queryClient } from "api/src";
import { AuthProvider } from "auth-context/src";
import { Toaster } from "ui/components/ui/toaster";
import { persister } from "./lib/idb-persister";
import { OfflineBanner } from "./components/offline/OfflineBanner";

// On a PWA, window focus means the user foregrounded the app. This is a good
// moment to refresh stale data in the background without showing a spinner.
queryClient.setDefaultOptions({
  queries: {
    ...queryClient.getDefaultOptions().queries,
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: true,
  },
});

function App() {
  // Register the service worker to handle PWA updates immediately.
  useRegisterSW({ immediate: true });

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        // Cache persisted in IndexedDB is considered valid for 7 days.
        // After this window, the cache is discarded on the next app load.
        maxAge: 1000 * 60 * 60 * 24 * 7,
      }}
    >
      <AuthProvider>
        <AppApiErrorHandlerProvider>
          <Outlet />
          <Toaster />
          <OfflineBanner />
        </AppApiErrorHandlerProvider>
      </AuthProvider>
      <ReactQueryDevtools />
    </PersistQueryClientProvider>
  );
}

export default App;
