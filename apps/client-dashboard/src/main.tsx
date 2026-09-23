import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "i18n";
import { router } from "./routes";
import { RouterProvider } from "react-router-dom";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
