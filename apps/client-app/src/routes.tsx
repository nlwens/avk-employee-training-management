import { createBrowserRouter } from "react-router-dom";
import { navigationRoute } from "./routes/navigation.routes";
import {
  coursesRoute,
  courseDetailsRoute,
  courseChapterRoute,
  courseQuizRoute,
  courseCompletedRoute,
} from "./routes/courses.routes";
import { loginRoute, userActivationRoute } from "./routes/auth.routes";
import App from "./App";
import { NavbarLayout } from "./components/navigation/NavbarLayout";
import { ProtectedRoute } from "@ui/components/routes/ProtectedRoute";
import { UnauthenticatedRoute } from "@ui/components/routes/UnauthenticatedRoute";
import { AppLayout } from "./layouts/AppLayout.tsx";
import NotFoundPage from "./pages/NotFoundPage";

export const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <NavbarLayout />,
            children: [...navigationRoute, ...coursesRoute],
          },
          {
            element: <AppLayout />,
            children: [
              ...courseDetailsRoute,
              ...courseChapterRoute,
              ...courseQuizRoute,
              ...courseCompletedRoute,
            ],
          },
        ],
      },
      {
        element: <UnauthenticatedRoute />,
        children: [...userActivationRoute],
      },
      ...loginRoute,
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
