import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { FormControl, FormField, FormItem } from "@ui/components/ui/form";
import { Input } from "@ui/components/ui/input";
import { TranslatedError } from "@ui/components/TranslatedError";
import { cn } from "@ui/lib/utils";
import { GripVertical, Trash2 } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";

import type { QuizFormValues } from "@ui/components/forms/validators";
import QuestionOptions from "./QuestionOptions";
import type { LocaleCode } from "@api/src";
import { Textarea } from "@ui/components/ui/textarea";

interface SortableQuestionCardProps {
  questionIndex: number;
  questionId: string;
  language: LocaleCode;
  onDeleteQuestion: (questionId: string) => void;
  canDelete?: boolean;
  isEditing?: boolean;
}

const createEmptyAnswer = () => ({
  translations: {
    en: { text: "" },
    nl: { text: "" },
  },
});

const getNextCorrectAnswerIndex = (
  currentCorrectAnswerIndex: number | null,
  deletedAnswerIndex: number,
) => {
  if (currentCorrectAnswerIndex === deletedAnswerIndex) return null;

  if (
    currentCorrectAnswerIndex !== null &&
    currentCorrectAnswerIndex > deletedAnswerIndex
  ) {
    return currentCorrectAnswerIndex - 1;
  }

  return currentCorrectAnswerIndex;
};

const SortableQuestionCard = ({
  questionIndex,
  questionId,
  language,
  onDeleteQuestion,
  canDelete = true,
  isEditing = true,
}: SortableQuestionCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: questionId, disabled: !isEditing });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: "pan-y",
  };

  const { t } = useTranslation("quiz");
  const { control, getValues, setValue } = useFormContext<QuizFormValues>();

  const translationPath =
    `questions.${questionIndex}.translations.${language}` as const;
  const answersPath = `questions.${questionIndex}.answers` as const;
  const correctAnswerIndexPath =
    `questions.${questionIndex}.correctAnswerIndex` as const;

  const answers = useWatch({ control, name: answersPath }) ?? [];
  const correctAnswerIndex = useWatch({
    control,
    name: correctAnswerIndexPath,
  });

  const handleAddAnswer = () => {
    const currentAnswers = getValues(answersPath) ?? [];

    setValue(answersPath, [...currentAnswers, createEmptyAnswer()], {
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const handleDeleteAnswer = (answerIndex: number) => {
    if (!isEditing) return;

    const currentAnswers = getValues(answersPath) ?? [];

    if (currentAnswers.length <= 2) return;

    setValue(
      answersPath,
      currentAnswers.filter(
        (_answer, currentIndex) => currentIndex !== answerIndex,
      ),
      {
        shouldDirty: true,
        shouldTouch: true,
      },
    );

    setValue(
      correctAnswerIndexPath,
      getNextCorrectAnswerIndex(getValues(correctAnswerIndexPath), answerIndex),
      {
        shouldDirty: true,
        shouldTouch: true,
      },
    );
  };

  const handleSetCorrectAnswer = (answerIndex: number) => {
    if (!isEditing) return;

    setValue(correctAnswerIndexPath, answerIndex, {
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-xl border border-gray-300 bg-white shadow-sm transition-shadow",
        isDragging && "opacity-70 shadow-lg",
      )}
      {...attributes}
    >
      <div className="flex items-start justify-between gap-4 border-b border-gray-300 px-4 py-3">
        <div className="flex min-w-0 flex-1 gap-3">
          <span className="shrink-0 pt-2 text-xl font-semibold text-black">
            {t(($) => $.quiz.taking.question, { number: questionIndex + 1 })}
          </span>

          <FormField
            control={control}
            name={`${translationPath}.question`}
            render={({ field, fieldState }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input
                    {...field}
                    placeholder={t(($) => $.quiz.editor.write_question)}
                    readOnly={!isEditing}
                    className={cn(
                      "h-12 border-gray-300 text-base placeholder:text-gray-400",
                      !isEditing && "cursor-default bg-white",
                    )}
                  />
                </FormControl>

                <TranslatedError message={fieldState.error?.message} />
              </FormItem>
            )}
          />
        </div>

        {isEditing && (
          <button
            ref={setActivatorNodeRef}
            type="button"
            aria-label={t(($) => $.quiz.editor.drag_question)}
            className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-black active:cursor-grabbing"
            {...listeners}
          >
            <GripVertical size={20} />
          </button>
        )}

        <button
          type="button"
          aria-label={t(($) => $.quiz.editor.delete_question, {
            number: questionIndex + 1,
          })}
          onClick={() => onDeleteQuestion(questionId)}
          disabled={!isEditing || !canDelete}
          className={cn(
            "rounded-md p-2",
            isEditing && canDelete
              ? "text-gray-500 hover:bg-red-50 hover:text-red-600"
              : "cursor-not-allowed text-gray-300",
          )}
        >
          <Trash2 size={20} />
        </button>
      </div>

      <div className="space-y-3 px-4 py-3">
        <QuestionOptions
          answers={answers}
          correctAnswerIndex={correctAnswerIndex}
          questionIndex={questionIndex}
          language={language}
          onAddAnswer={handleAddAnswer}
          onDeleteAnswer={handleDeleteAnswer}
          onSetCorrectAnswer={handleSetCorrectAnswer}
          isEditing={isEditing}
        />
      </div>

      <div className="border-t border-gray-200 px-4 py-4">
        <FormField
          control={control}
          name={`${translationPath}.explanation`}
          render={({ field, fieldState }) => (
            <FormItem className="w-full space-y-2">
              <FormControl>
                <Textarea
                  {...field}
                  placeholder={t(($) => $.quiz.editor.write_explanation)}
                  readOnly={!isEditing}
                  className={cn(
                    "min-h-28 w-full resize-y",
                    !isEditing && "cursor-default bg-white",
                  )}
                />
              </FormControl>

              <TranslatedError message={fieldState.error?.message} />
            </FormItem>
          )}
        />
      </div>
    </article>
  );
};

export default SortableQuestionCard;
