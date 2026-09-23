import type { RefObject } from "react";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { GripVertical } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useLocalize } from "i18n";
import { cn } from "ui/lib/utils";
import type { Chapter } from "@api/src";

interface SortableChapterNavItemProps {
  chapter: Chapter;
  onPrefetch: (chapter: Chapter) => void;
  ignoreClickRef: RefObject<boolean>;
}

const SortableChapterNavItem = ({
  chapter,
  onPrefetch,
  ignoreClickRef,
}: SortableChapterNavItemProps) => {
  const { t } = useTranslation(["courses", "chapters"]);
  const { localize } = useLocalize();
  const { pathname } = useLocation();

  const chapterPath = `chapters/${chapter.id}`;
  const isActive = pathname.endsWith(`/${chapter.id}`);

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: chapter.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: "pan-y",
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(isDragging && "opacity-70")}
      {...attributes}
    >
      <div
        className={cn(
          "flex items-center gap-2 px-5 py-2 text-base text-black transition",
          isActive
            ? "rounded-r-lg border border-avk-silver bg-linear-to-r from-white to-avk-silver"
            : "rounded-lg hover:bg-gray-100",
        )}
      >
        {/* drag handle stays out of the NavLink */}
        <button
          type="button"
          ref={setActivatorNodeRef}
          aria-label={t(($) => $.chapters.actions.drag_chapter)}
          className="shrink-0 cursor-grab border-0 bg-transparent p-0 text-gray-400 active:cursor-grabbing"
          {...listeners}
        >
          <GripVertical size={16} aria-hidden="true" />
        </button>

        <NavLink
          to={chapterPath}
          onMouseEnter={() => onPrefetch(chapter)}
          onClick={(event) => {
            if (!ignoreClickRef.current) return;

            event.preventDefault(); // drag ended on this link
            ignoreClickRef.current = false;
          }}
          className="min-w-0 flex-1 text-base text-black"
        >
          {localize(chapter.translations, "title")}
        </NavLink>
      </div>
    </li>
  );
};

export default SortableChapterNavItem;
