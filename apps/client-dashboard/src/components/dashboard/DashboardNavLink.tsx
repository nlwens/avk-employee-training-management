import { cn } from "@ui/lib/utils";
import React from "react";
import { NavLink } from "react-router-dom";

interface DashboardNavLinkProps {
  name: string;
  path: string;
  onFocus?: () => void;
  onMouseEnter?: () => void;
}

const DashboardNavLink: React.FC<DashboardNavLinkProps> = ({
  name,
  path,
  onFocus,
  onMouseEnter,
}) => (
  <NavLink
    to={path}
    prefetch="intent"
    onFocus={onFocus}
    onMouseEnter={onMouseEnter}
    className={({ isActive }) =>
      cn(
        "inline-grid border-b-2 pb-0.5 text-lg text-avk-blue",
        isActive ? "border-avk-blue" : "border-transparent",
      )
    }
  >
    {({ isActive }) => (
      <>
        <span className="invisible col-start-1 row-start-1 font-bold">
          {name}
        </span>
        <span
          className={cn(
            "col-start-1 row-start-1",
            isActive ? "font-bold" : "font-normal",
          )}
        >
          {name}
        </span>
      </>
    )}
  </NavLink>
);

export default DashboardNavLink;
