import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { closestCenter, DndContext, type DragEndEvent } from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  useFieldArray,
  useForm,
  type FieldErrors,
  type SubmitHandler,
} from "react-hook-form";
import { useContentLanguage } from "i18n";
import { useTranslation } from "react-i18next";
import { TranslatedError } from "@ui/components/TranslatedError";
import { Button } from "@ui/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@ui/components/ui/form";
import { Label } from "@ui/components/ui/label";
import { Input } from "@ui/components/ui/input";
import {
  ChapterSchema,
  type ChapterContentBlock,
  type ChapterContentType,
  type ChapterFormValues,
} from "@ui/components/forms/validators";
import { DeleteConfirmationDialog } from "../common/DeleteConfirmationDialog";
import ChapterContentMenu from "./ChapterContentMenu";
import SortableChapterContentBlock from "./SortableChapterContentBlock";
import {
  ContentLanguageSwitch,
  type ContentLanguage,
} from "@ui/components/ContentLanguageSwitch";
import type { LocaleCode } from "@api/src";

interface ChapterFormProps {
  initialData?: ChapterFormValues;
  onSubmit: SubmitHandler<ChapterFormValues>;
  onDelete?: () => void;
  isSubmitting?: boolean;
  isDeleting?: boolean;
}

const createEmptyChapterFormValues = (): ChapterFormValues => ({
  id: "chapter-1",
  order: 0,
  translations: {
    en: { title: "" },
    nl: { title: "" },
  },
  contentBlocks: [],
});

const createContentBlock = (
  type: ChapterContentType,
  id: string,
  order: number,
): ChapterContentBlock => ({
  id,
  type,
  order,
  translations: {
    en: { content: "", file: null },
    nl: { content: "", file: null },
  },
});

const getNextContentBlockId = (initialData?: ChapterFormValues) => {
  const blockIds = (initialData?.contentBlocks ?? [])
    .map((block) => block.id)
    .map((id) => Number(id.split("-").at(-1)))
    .filter((value): value is number => Number.isFinite(value));

  return blockIds.length > 0 ? Math.max(...blockIds) + 1 : 1;
};

const ChapterForm = ({
  initialData,
  onSubmit,
  onDelete,
  isSubmitting = false,
  isDeleting = false,
}: ChapterFormProps) => {
  const navigate = useNavigate();
  const defaultContentLanguage = useContentLanguage();
  const [currentLanguage, setCurrentLanguage] = useState<ContentLanguage>(
    defaultContentLanguage,
  );
  const { t } = useTranslation(["courses", "chapters", "common"]);
  const nextBlockId = useRef(getNextContentBlockId(initialData));

  const form = useForm<ChapterFormValues>({
    resolver: zodResolver(ChapterSchema),
    defaultValues: initialData || createEmptyChapterFormValues(),
  });

  const isEdit = !!initialData;

  const contentBlocks = useFieldArray({
    control: form.control,
    name: "contentBlocks",
    keyName: "fieldId",
  });

  const syncOrders = () => {
    contentBlocks.fields.forEach((_block, index) => {
      form.setValue(`contentBlocks.${index}.order`, index, {
        shouldDirty: true,
        shouldTouch: true,
      });
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const fromIndex = contentBlocks.fields.findIndex(
      (field) => field.id === active.id,
    );
    const toIndex = contentBlocks.fields.findIndex(
      (field) => field.id === over.id,
    );

    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;

    contentBlocks.move(fromIndex, toIndex);
    syncOrders();
  };

  const handleAddBlock = (type: ChapterContentType) => {
    const order = form.getValues("contentBlocks").length;
    const blockId = `content-${nextBlockId.current++}`;

    contentBlocks.append(createContentBlock(type, blockId, order));
  };

  const handleDeleteBlock = (blockId: string) => {
    const nextBlocks = form
      .getValues("contentBlocks")
      .filter((block) => block.id !== blockId)
      .map((block, index) => ({
        ...block,
        order: index,
      }));

    contentBlocks.replace(nextBlocks);
  };

  const handleInvalid = (errors: FieldErrors<ChapterFormValues>) => {
    const erroredLocales = Object.keys(
      errors.translations ?? {},
    ) as LocaleCode[];

    if (erroredLocales.length > 0) {
      setCurrentLanguage(erroredLocales[0]);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, handleInvalid)}
        className="space-y-8"
      >
        <FormField
          control={form.control}
          name={
            currentLanguage === "en"
              ? "translations.en.title"
              : "translations.nl.title"
          }
          render={({ field, fieldState }) => (
            <FormItem className="space-y-2">
              <div className="flex items-center justify-between gap-4">
                <FormControl>
                  <Input
                    {...field}
                    placeholder={t(
                      ($) => $.chapters.form.add_title_placeholder,
                    )}
                    className="h-16 min-w-0 flex-1 rounded-none border-0 border-b border-gray-300 bg-transparent px-0 text-xxl font-normal shadow-none placeholder:text-gray-400"
                  />
                </FormControl>

                <ContentLanguageSwitch
                  value={currentLanguage}
                  onValueChange={setCurrentLanguage}
                  size="sm"
                  className="shrink-0"
                  aria-label={t(($) => $.courses.form.toggle_language)}
                />
              </div>

              <TranslatedError message={fieldState.error?.message} />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <Label className="text-lg font-base">
              {t(($) => $.chapters.form.content_label)}
            </Label>

            <ChapterContentMenu onSelect={handleAddBlock} />
          </div>

          <FormField
            control={form.control}
            name="contentBlocks"
            render={() => (
              <div className="space-y-4">
                <DndContext
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                  modifiers={[restrictToVerticalAxis]}
                >
                  <SortableContext
                    items={contentBlocks.fields.map((field) => field.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-4">
                      {contentBlocks.fields.map((block, index) => (
                        <SortableChapterContentBlock
                          key={block.fieldId}
                          block={block as ChapterContentBlock}
                          blockIndex={index}
                          onDeleteBlock={handleDeleteBlock}
                          language={currentLanguage}
                          isEdit={isEdit}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            )}
          />
        </div>

        <div className="flex items-center justify-between border-t border-gray-200 py-6">
          <div>
            {onDelete && (
              <DeleteConfirmationDialog
                triggerLabel={t(($) => $.courses.actions.delete)}
                title={t(($) => $.chapters.confirm.delete.title)}
                description={t(($) => $.chapters.confirm.delete.description)}
                confirmationLabel={t(($) => $.chapters.confirm.delete.label)}
                cancelLabel={t(($) => $.courses.actions.cancel)}
                deleteLabel={t(($) => $.courses.actions.delete)}
                onConfirm={onDelete}
                isPending={isDeleting}
              />
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              className="min-w-32 rounded-lg px-6 py-2 border"
              disabled={isSubmitting}
              onClick={() => navigate(-1)}
            >
              {t(($) => $.courses.actions.cancel)}
            </Button>
            <Button
              type="submit"
              className="min-w-32 rounded-lg bg-avk-blue-light px-6 py-2 text-black hover:bg-avk-blue-light/80"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? t(($) => $.common.actions.saving)
                : t(($) => $.common.actions.save)}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
};

export default ChapterForm;
