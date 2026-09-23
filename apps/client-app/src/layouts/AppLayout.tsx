import React from "react";
import { Outlet } from "react-router-dom";

export const AppLayout: React.FC = () => (
  <div className="flex min-h-dvh w-full flex-col">
    <div className="flex min-h-0 flex-1 flex-col">
      <Outlet />
    </div>
  </div>
);
