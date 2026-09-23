import { buildFileUrl, type SegmentFile } from "@api/src";
import type { ChapterContentType } from "@ui/components/forms/validators";
import PDFSegment from "ui/components/segments/PDFSegment";
import PPTXSegment from "@ui/components/segments/PPTXSegment";
import VideoSegment from "ui/components/segments/VideoSegment";
import { cn } from "@ui/lib/utils";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "i18n";

interface FilePreviewProps {
  fileValue: SegmentFile;
  type: ChapterContentType;
}

const FilePreview = ({ fileValue, type }: FilePreviewProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const { t } = useTranslation(["courses", "chapters"]);

  const url = buildFileUrl({
    filename: fileValue.name,
    provider: fileValue.provider,
  });

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <span className="truncate min-w-0 pr-2">
          {t(($) => $.chapters.actions.open_file)}
        </span>
        <ChevronDown
          size={16}
          className={cn(
            "shrink-0 text-gray-400 transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen && (
        <div className="border-t border-gray-200">
          {type === "pdf" && (
            <div className="max-h-125 overflow-auto">
              <PDFSegment url={url} />
            </div>
          )}

          {type === "pptx" && (
            <div className="max-h-125 overflow-auto">
              <PPTXSegment url={url} />
            </div>
          )}

          {type === "video" && (
            <VideoSegment url={url} mimetype={fileValue.mimetype} />
          )}
          {type === "image" && (
            <div className="p-2">
              <img src={url} alt={fileValue.name} className="rounded-lg" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FilePreview;
