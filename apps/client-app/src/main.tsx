import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { router } from "./routes";
import { RouterProvider } from "react-router-dom";

// Initialize i18n translations.
import "i18n";

// Globally include our styles.
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
