import type { ReactNode } from "react";
import { NavLink, type To } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { cn } from "@ui/lib/utils";

export type TabsItem = {
  to: To;
  label: ReactNode;
  end?: boolean;
};

interface TabsProps {
  items: TabsItem[];
  className?: string;
}

const Tabs = ({ items, className }: TabsProps) => {
  const { t } = useTranslation("quiz");

  return (
    <nav
      className={cn(
        "flex items-center gap-8 border-b border-gray-200",
        className,
      )}
      aria-label={t(($) => $.quiz.summary.tabs_navigation)}
    >
      {items.map((item, idx) => (
        <NavLink
          key={idx}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            cn(
              "pb-3 text-sm font-medium transition-colors",
              isActive
                ? "border-b-2 border-black text-black"
                : "text-gray-600 hover:text-gray-900",
            )
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
};

export default Tabs;
