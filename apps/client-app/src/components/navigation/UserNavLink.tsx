import React from "react";
import { cn } from "@ui/lib/utils";
import { NavLink } from "react-router-dom";

interface NavLinkProps {
  name: string;
  path: string;
  onMouseEnter?: () => void;
}

const UserNavLink: React.FC<NavLinkProps> = ({ name, path, onMouseEnter }) => (
  <NavLink
    to={path}
    end={true}
    onMouseEnter={onMouseEnter}
    className={({ isActive }) =>
      cn(
        "font-label text-xl font-normal text-brand-gray-900 transition-colors",
        isActive
          ? "underline decoration-brand-gray-600 decoration-1 underline-offset-8"
          : "hover:text-brand-gray-800",
      )
    }
  >
    {name}
  </NavLink>
);

export default UserNavLink;
