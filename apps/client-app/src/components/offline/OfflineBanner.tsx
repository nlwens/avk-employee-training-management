import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";
import { useAuth } from "@auth-context/src";

// Must match the height of the banner below.
const BANNER_HEIGHT = "2.25rem";

export const OfflineBanner: React.FC = () => {
  const isOnline = useOnlineStatus();
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();

  // --safe-bottom-inset is consumed by .safe-bottom and .safe-bottom-padding in
  // index.css. Layouts and fixed bottom elements opt in via those classes.
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--safe-bottom-inset",
      isOnline ? "0rem" : BANNER_HEIGHT,
    );
  }, [isOnline]);

  // Show the banner only if offline (duh) and the user is authenticated.
  if (isOnline || !isAuthenticated) {
    return null;
  }

  return (
    <div
      role="status"
      className="fixed bottom-0 left-0 right-0 z-60 bg-amber-700 text-white text-center text-sm py-2 px-4 shadow-md"
    >
      {t(($) => $.common.offline.banner)}
    </div>
  );
};
