import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@ui/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@ui/components/ui/popover";
import { cn } from "@ui/lib/utils";
import type { ChapterContentType } from "@ui/components/forms/validators";

type ContentTypeLabelKey = ChapterContentType;

const contentTypeOptions: Array<{
  type: ChapterContentType;
  labelKey: ContentTypeLabelKey;
}> = [
  {
    type: "text",
    labelKey: "text",
  },
  {
    type: "pdf",
    labelKey: "pdf",
  },
  {
    type: "pptx",
    labelKey: "pptx",
  },
  {
    type: "image",
    labelKey: "image",
  },
  {
    type: "video",
    labelKey: "video",
  },
];

interface ChapterContentMenuProps {
  onSelect: (type: ChapterContentType) => void;
}

const ChapterContentMenu = ({ onSelect }: ChapterContentMenuProps) => {
  const { t } = useTranslation(["courses", "chapters", "common"]);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="min-w-36 justify-between rounded-xl border-gray-300 bg-white px-4 font-medium text-black shadow-sm hover:bg-gray-50"
        >
          {t(($) => $.common.actions.add)}
          <ChevronDown size={16} />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-36 p-2 max-h-72 overflow-y-auto"
      >
        <div className="space-y-1">
          {contentTypeOptions.map((option) => (
            <button
              key={option.type}
              type="button"
              onClick={() => {
                onSelect(option.type);
                setIsOpen(false);
              }}
              className={cn(
                "flex w-full items-center justify-center rounded-xl px-3 py-2 text-center transition hover:bg-gray-100",
              )}
            >
              <span className="block text-sm font-medium text-black">
                {t(($) => $.chapters.content_types[option.labelKey])}
              </span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ChapterContentMenu;
