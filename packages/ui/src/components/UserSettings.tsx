import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "auth-context/src/auth.context";
import { useTranslation } from "i18n";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@ui/components/ui/dropdown-menu";
import UserIdentity from "@ui/components/UserIdentity";
import { NavLink } from "react-router-dom";

const UserSettings = () => {
  const { t } = useTranslation("navigation");
  const { logout } = useAuth();
  const queryClient = useQueryClient();

  const onLogoutClick = () => {
    queryClient.clear();
    logout();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        asChild
        className="cursor-pointer hover:bg-[#f5f7f9] focus:[#f5f7f9]"
      >
        <div className="flex items-center gap-2 border border-[#e7ebee] px-3 py-1">
          <UserIdentity small={true} />
          <ChevronDown size={14} />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        style={{ width: "var(--radix-dropdown-menu-trigger-width)" }}
        className="rounded-none p-0"
      >
        <DropdownMenuGroup>
          <NavLink to="/settings">
            <DropdownMenuItem className="cursor-pointer">
              {t(($) => $.navigation.links.settings)}
            </DropdownMenuItem>
          </NavLink>

          <DropdownMenuItem onClick={onLogoutClick} className="cursor-pointer">
            {t(($) => $.navigation.links.logout)}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserSettings;
