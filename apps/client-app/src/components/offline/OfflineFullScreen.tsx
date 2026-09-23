import React from "react";
import { useTranslation } from "react-i18next";

import logo from "../../assets/logo.png";

export const OfflineFullScreen: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="flex h-dvh w-full items-center justify-center">
      <div className="text-center space-y-2">
        <div className="mb-10">
          <img src={logo} alt="AVK Logo" className="mx-auto h-24" />
        </div>

        <p className="text-xl font-semibold">
          {t(($) => $.common.offline.no_connection)}
        </p>

        <p className="text-sm text-muted-foreground">
          {t(($) => $.common.offline.no_connection_detail)}
        </p>
      </div>
    </div>
  );
};
