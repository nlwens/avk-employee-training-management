import { Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import UserNavLink from "./UserNavLink.tsx";
import Navbar from "./Navbar";

export const NavbarLayout = () => {
  const { t } = useTranslation("navigation");

  return (
    <div className="relative flex min-h-dvh flex-col">
      <Navbar />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 sm:px-12">
        <div className="flex items-center gap-5 pt-5 pb-7">
          <UserNavLink name={t(($) => $.navigation.links.overview)} path="/" />
          <UserNavLink
            name={t(($) => $.navigation.links.my_courses)}
            path="/courses"
          />
          <UserNavLink
            name={t(($) => $.navigation.links.completed_courses)}
            path="/courses/completed"
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
