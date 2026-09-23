import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { TanStackProvider, AppApiErrorHandlerProvider } from "api/src";
import { Outlet } from "react-router-dom";
import { AuthProvider } from "auth-context/src";
import { Toaster } from "ui/components/ui/toaster";

function App() {
  return (
    <div>
      <TanStackProvider>
        <AuthProvider>
          <AppApiErrorHandlerProvider>
            <Outlet />
            <Toaster />
          </AppApiErrorHandlerProvider>
        </AuthProvider>
        <ReactQueryDevtools />
      </TanStackProvider>
    </div>
  );
}

export default App;
