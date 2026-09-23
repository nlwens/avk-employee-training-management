import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import type { SelectorKey } from "i18next";
import {
  coursesQueryOptions,
  usersQueryOptions,
  groupsQueryOptions,
} from "api/src";

import DashboardNavbar from "./DashboardNavbar";
import DashboardNavLink from "./DashboardNavLink";

interface DashboardLayoutProps {
  children: ReactNode;
}

const navItems = [
  { name: "navigation:links.dashboard", path: "/" },
  {
    name: "navigation:links.employees",
    path: "/employees",
    prefetch: (queryClient: QueryClient) => {
      void queryClient.prefetchQuery(usersQueryOptions());
      void queryClient.prefetchQuery(groupsQueryOptions);
    },
  },
  {
    name: "navigation:links.courses",
    path: "/courses",
    prefetch: (queryClient: QueryClient) => {
      void queryClient.prefetchQuery(coursesQueryOptions({ published: true }));
      void queryClient.prefetchQuery(coursesQueryOptions({ published: false }));
    },
  },
];

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { t } = useTranslation("navigation");
  const queryClient = useQueryClient();

  return (
    <div className="relative flex min-h-dvh flex-col">
      <DashboardNavbar />

      <div className="w-full bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-5 px-6 pt-3 sm:px-12">
          {navItems.map((item) => (
            <DashboardNavLink
              key={item.name}
              name={t(item.name as SelectorKey)}
              path={item.path}
              onFocus={() => item.prefetch?.(queryClient)}
              onMouseEnter={() => item.prefetch?.(queryClient)}
            />
          ))}
        </div>
      </div>

      <main className="mx-auto flex w-full min-w-0 max-w-7xl flex-1 flex-col px-6 sm:px-12">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
