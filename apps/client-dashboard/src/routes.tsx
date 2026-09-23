import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import { authRoute } from "./routes/auth.routes";
import { dashboardRoute } from "./routes/dashboard.routes";
import { ProtectedRoute } from "@ui/components/routes/ProtectedRoute";
import NotFoundPage from "./pages/NotFoundPage";

export const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      {
        element: <ProtectedRoute />,
        children: [...dashboardRoute],
      },
      ...authRoute,
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
