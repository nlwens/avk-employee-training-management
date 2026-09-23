import React, { useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Link, NavLink } from "react-router-dom";
import { Plus } from "lucide-react";
import {
  closestCenter,
  DndContext,
  PointerSensor,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { SelectorKey } from "i18next";

import { cn } from "ui/lib/utils";
import type { Chapter } from "@api/src";
import SortableChapterNavItem from "./SortableChapterNavItem";

// Sidebar links for the course detail page. end goes straight into NavLink's end prop
// Use it when a link should only show as active on the exact route
// Otherwise it'll stay highlighted on nested routes too.
type SidebarItem = {
  to: string;
  label: string;
  end?: boolean;
};

const sidebarItems: SidebarItem[] = [
  { to: "overview", label: "navigation:links.overview", end: true },
  { to: "quiz", label: "navigation:links.quiz" },
  { to: "groups", label: "navigation:links.groups" },
];

interface CourseDetailSidebarProps {
  chapters: Chapter[];
  onReorderChapters: (fromIndex: number, toIndex: number) => void;
  onPrefetchChapter: (chapter: Chapter) => void;
}

const CourseDetailSidebar: React.FC<CourseDetailSidebarProps> = ({
  chapters,
  onReorderChapters,
  onPrefetchChapter,
}) => {
  const { t } = useTranslation(["navigation", "courses", "chapters", "common"]);

  const sortedChapters = useMemo(
    () => [...chapters].sort((a, b) => a.order - b.order),
    [chapters],
  );

  // Need this to make sure mouseup after a drag doesn't open the chapter link
  const ignoreClickRef = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    ignoreClickRef.current = true;

    const { active, over } = event;

    // If the user dropped it outside the list, then we don't do the reorder
    if (!over) return;

    const fromIndex = sortedChapters.findIndex(
      (chapter) => chapter.id === active.id,
    );
    const toIndex = sortedChapters.findIndex(
      (chapter) => chapter.id === over.id,
    );

    // If the drag event is stale or the user dropped it back in the same position
    // then we don't do the reorder
    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;

    onReorderChapters(fromIndex, toIndex);
  };

  return (
    <aside className="w-full shrink-0 space-y-4 lg:w-72">
      <div className="space-y-1">
        {sidebarItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "block px-4 py-3 text-base font-medium transition",
                isActive
                  ? "rounded-r-lg border border-avk-silver bg-linear-to-r from-white to-avk-silver"
                  : "rounded-lg hover:bg-gray-100",
              )
            }
          >
            {t(item.label as SelectorKey)}
          </NavLink>
        ))}
      </div>

      <div className="border-t border-gray-400 pt-4">
        <span className="block px-5 pb-2 text-base text-black">
          {t(($) => $.courses.detail.table_of_contents)}
        </span>
        {sortedChapters.length === 0 ? (
          <p className="px-5 py-2 text-base text-gray-500">
            {t(($) => $.chapters.display.none_available)}
          </p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis]}
          >
            <SortableContext
              items={sortedChapters.map((chapter) => chapter.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul>
                {sortedChapters.map((chapter) => (
                  <SortableChapterNavItem
                    key={chapter.id}
                    chapter={chapter}
                    onPrefetch={onPrefetchChapter}
                    ignoreClickRef={ignoreClickRef}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </div>
      <div className="border-t border-gray-400 pt-6">
        <div className="space-y-3">
          <Link
            to={"chapters/create"}
            className="flex h-10 w-full cursor-pointer items-center justify-between rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 text-base font-medium text-gray-600 transition hover:border-gray-400 hover:bg-gray-100 hover:text-gray-900"
          >
            <span>{t(($) => $.chapters.actions.add_chapter)}</span>
            <span aria-hidden="true" className="text-base leading-none">
              <Plus size={16} />
            </span>
          </Link>
        </div>
      </div>
    </aside>
  );
};

export default CourseDetailSidebar;
