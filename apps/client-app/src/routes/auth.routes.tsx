import type { RouteObject } from "react-router-dom";
import { LoginPage, UserActivationPage } from "./lazy";
import SettingsPage from "../pages/SettingsPage";

export const loginRoute: RouteObject[] = [
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/settings",
    element: <SettingsPage />,
  },
];

export const userActivationRoute: RouteObject[] = [
  {
    path: "/user/activate/:code",
    element: <UserActivationPage />,
  },
];
