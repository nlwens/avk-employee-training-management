import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { useId } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { TranslatedError } from "@ui/components/TranslatedError";
import { FormControl, FormField, FormItem } from "@ui/components/ui/form";
import { Input } from "@ui/components/ui/input";
import { Textarea } from "@ui/components/ui/textarea";
import { cn } from "@ui/lib/utils";
import type {
  ChapterContentBlock,
  ChapterContentType,
  ChapterFormValues,
} from "@ui/components/forms/validators";
import type { ContentLanguage } from "@ui/components/ContentLanguageSwitch";
import { type SegmentFile } from "@api/src";
import FilePreview from "./FilePreview";

interface SortableChapterContentBlockProps {
  block: ChapterContentBlock;
  blockIndex: number;
  onDeleteBlock: (blockId: string) => void;
  language: ContentLanguage;
  isEdit: boolean;
}

// https://www.iana.org/assignments/media-types/media-types.xhtml
// Validate file types on frontend based on content block type.
const getAccept = (type: ChapterContentType) => {
  switch (type) {
    case "pdf":
      return ".pdf,application/pdf";
    case "pptx":
      return ".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation";
    case "image":
      return "image/*";
    case "video":
      return "video/*";
    default:
      return undefined;
  }
};

const SortableChapterContentBlock = ({
  block,
  blockIndex,
  onDeleteBlock,
  language,
  isEdit,
}: SortableChapterContentBlockProps) => {
  const { t } = useTranslation(["courses", "chapters", "common"]);
  const fileInputId = useId();
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: "pan-y",
  };

  const { control } = useFormContext<ChapterFormValues>();

  const fileValue = useWatch({
    control,
    name: `contentBlocks.${blockIndex}.translations.${language}.file` as const,
  }) as SegmentFile | null | undefined;

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={cn(
        "overflow-hidden rounded-2xl border border-gray-300 bg-white shadow-sm transition-shadow",
        isDragging && "opacity-70 shadow-lg",
      )}
      {...attributes}
    >
      <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700">
            #{block.order + 1}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold uppercase tracking-wide text-gray-500">
              {t(($) => $.chapters.content_types[block.type])}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            ref={setActivatorNodeRef}
            type="button"
            aria-label={t(($) => $.chapters.actions.drag_content)}
            className="rounded-md p-2 text-gray-500 transition hover:bg-gray-100 hover:text-black active:cursor-grabbing"
            {...listeners}
          >
            <GripVertical size={18} />
          </button>

          <button
            type="button"
            aria-label={t(($) => $.chapters.actions.delete_content)}
            onClick={() => onDeleteBlock(block.id)}
            className={cn(
              "rounded-md p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-600",
            )}
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="px-4 py-4">
        {block.type === "text" ? (
          <FormField
            control={control}
            name={
              `contentBlocks.${blockIndex}.translations.${language}.content` as const
            }
            render={({ field, fieldState }) => (
              <FormItem className="space-y-2">
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder={t(($) => $.chapters.form.text_placeholder)}
                    className="min-h-32 resize-y rounded-xl border-gray-300"
                  />
                </FormControl>
                <TranslatedError message={fieldState.error?.message} />
              </FormItem>
            )}
          />
        ) : (
          <FormField
            control={control}
            name={
              `contentBlocks.${blockIndex}.translations.${language}.file` as const
            }
            render={({ field, fieldState }) => (
              <FormItem className="space-y-2 min-h-10">
                <div className="space-y-2">
                  <FormControl>
                    <Input
                      id={fileInputId}
                      type="file"
                      ref={field.ref}
                      name={field.name}
                      onBlur={field.onBlur}
                      accept={getAccept(block.type)}
                      aria-label={t(
                        ($) => $.chapters.actions.select_file_to_upload,
                      )}
                      onChange={(event) => {
                        field.onChange(event.target.files?.[0] ?? null);
                      }}
                      className="sr-only"
                    />
                  </FormControl>

                  <label
                    htmlFor={fileInputId}
                    className="flex cursor-pointer items-center justify-between rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-600 transition hover:border-gray-400 hover:bg-gray-100 hover:text-gray-900"
                  >
                    <span>
                      {t(($) => $.chapters.actions.select_file_to_upload)}
                    </span>
                    <span aria-hidden="true" className="text-base leading-none">
                      <Plus size={16} />
                    </span>
                  </label>
                </div>

                {fileValue && (
                  <>
                    {isEdit && !(fileValue instanceof File) ? (
                      <FilePreview fileValue={fileValue} type={block.type} />
                    ) : (
                      <div className="min-w-0 text-sm text-gray-500">
                        <span className="min-w-0 flex-1 truncate">
                          {fileValue?.name}
                        </span>
                      </div>
                    )}
                  </>
                )}

                <TranslatedError message={fieldState.error?.message} />
              </FormItem>
            )}
          />
        )}
      </div>
    </article>
  );
};

export default SortableChapterContentBlock;
