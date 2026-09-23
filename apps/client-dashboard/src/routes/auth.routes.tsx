import type { RouteObject } from "react-router-dom";
import { LoginPage } from "./lazy";

export const authRoute: RouteObject[] = [
  {
    path: "/login",
    element: <LoginPage />,
  },
];
