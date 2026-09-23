import { useTranslation } from "react-i18next";
import { MoreHorizontal, Plus } from "lucide-react";
import type { Group } from "@api/src";

import { cn } from "@ui/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@ui/components/ui/dropdown-menu";

interface GroupsSidebarProps {
  groups: Group[];
  selectedGroupId: string | null;
  onSelect: (groupId: string | null) => void;
  onAddGroup?: () => void;
  onEditGroup?: (groupId: string) => void;
  onDeleteGroup?: (groupId: string) => void;
}

const GroupsSidebar = ({
  groups,
  selectedGroupId,
  onSelect,
  onAddGroup,
  onEditGroup,
  onDeleteGroup,
}: GroupsSidebarProps) => {
  const { t } = useTranslation(["employees", "groups", "navigation"]);

  return (
    <aside className="mb-10 w-full shrink-0 self-start rounded border border-gray-300 bg-white lg:w-56">
      <div className="flex items-center justify-between border-b border-gray-300 px-4 py-3">
        <span className="font-semibold text-brand-gray-900">
          {t(($) => $.navigation.links.groups)}
        </span>

        <button
          type="button"
          aria-label={t(($) => $.groups.actions.add)}
          className="rounded p-0.5 hover:bg-gray-100"
          onClick={onAddGroup}
        >
          <Plus size={16} />
        </button>
      </div>

      <ul>
        <li>
          <button
            type="button"
            className={cn(
              "w-full px-4 py-3 text-left text-sm text-brand-gray-900",
              selectedGroupId === null
                ? "bg-brand-gray-100 font-medium"
                : "hover:bg-brand-gray-50",
            )}
            onClick={() => onSelect(null)}
          >
            {t(($) => $.employees.filters.all)}
          </button>
        </li>

        {groups.map((group) => (
          <li
            key={group.id}
            className={cn(
              "group flex items-center border-t border-gray-200",
              selectedGroupId === group.id
                ? "bg-brand-gray-100 font-medium"
                : "hover:bg-brand-gray-50",
            )}
          >
            <button
              type="button"
              className="flex-1 px-4 py-3 text-left text-sm text-brand-gray-900"
              onClick={() => onSelect(group.id)}
            >
              {group.name}
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="mr-3 rounded p-1 text-brand-gray-600 group-hover:text-brand-gray-900"
                  aria-label={t(($) => $.groups.actions.open_actions, {
                    group: group.name,
                  })}
                >
                  <MoreHorizontal size={14} />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="min-w-32">
                <DropdownMenuItem onClick={() => onEditGroup?.(group.id)}>
                  {t(($) => $.groups.actions.edit)}
                </DropdownMenuItem>

                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600"
                  onClick={() => onDeleteGroup?.(group.id)}
                >
                  {t(($) => $.groups.actions.delete)}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default GroupsSidebar;
