import { Button } from "@ui/components/ui/button";
import { FormControl, FormField, FormItem } from "@ui/components/ui/form";
import { Input } from "@ui/components/ui/input";
import { TranslatedError } from "@ui/components/TranslatedError";
import { cn } from "@ui/lib/utils";
import { Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useFormContext } from "react-hook-form";

import type { QuizFormValues } from "@ui/components/forms/validators";
import type { LocaleCode } from "@api/src";
import type { QuizAnswerDraft } from "src/types/quiz";

interface QuestionOptionsEditorProps {
  answers: QuizAnswerDraft[];
  correctAnswerIndex: number | null;
  questionIndex: number;
  language: LocaleCode;
  onAddAnswer: () => void;
  onDeleteAnswer: (answerIndex: number) => void;
  onSetCorrectAnswer: (answerIndex: number) => void;
  isEditing?: boolean;
}

interface AnswerItemProps {
  answerIndex: number;
  answersLength: number;
  correctAnswerIndex: number | null;
  fieldPath: `questions.${number}.answers.${number}.translations.${LocaleCode}.text`;
  onSetCorrectAnswer: (answerIndex: number) => void;
  onDeleteAnswer: (answerIndex: number) => void;
  isEditing?: boolean;
}

const AnswerItem = ({
  answerIndex,
  answersLength,
  correctAnswerIndex,
  fieldPath,
  onSetCorrectAnswer,
  onDeleteAnswer,
  isEditing = true,
}: AnswerItemProps) => {
  const { t } = useTranslation("quiz");
  const { control } = useFormContext<QuizFormValues>();

  const isCorrect = correctAnswerIndex === answerIndex;
  const canDelete = answersLength > 2;

  return (
    <div className="flex items-start gap-3">
      <div className="flex h-12 items-center">
        <button
          type="button"
          aria-label={t(($) => $.quiz.editor.mark_option_correct, {
            number: answerIndex + 1,
          })}
          aria-pressed={isCorrect}
          onClick={() => onSetCorrectAnswer(answerIndex)}
          disabled={!isEditing}
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
            isCorrect
              ? "border-black bg-black"
              : isEditing
                ? "border-gray-700 bg-white hover:border-black"
                : "border-gray-700 bg-white",
          )}
        >
          <span
            className={cn(
              "h-2.5 w-2.5 rounded-full bg-white transition-opacity",
              isCorrect ? "opacity-100" : "opacity-0",
            )}
          />
        </button>
      </div>

      <FormField
        control={control}
        name={fieldPath}
        render={({ field, fieldState }) => (
          <FormItem className="flex-1 space-y-0">
            <FormControl>
              <Input
                {...field}
                placeholder="..."
                readOnly={!isEditing}
                className={cn(
                  "h-12 border-gray-300 text-base placeholder:text-gray-400",
                  !isEditing && "cursor-default bg-white",
                )}
              />
            </FormControl>

            <div className="pt-2">
              <TranslatedError message={fieldState.error?.message} />
            </div>
          </FormItem>
        )}
      />

      <div className="flex h-12 items-center">
        <button
          type="button"
          aria-label={t(($) => $.quiz.editor.delete_option, {
            number: answerIndex + 1,
          })}
          disabled={!isEditing || !canDelete}
          onClick={() => onDeleteAnswer(answerIndex)}
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-transparent text-gray-700 transition-colors",
            isEditing && canDelete
              ? "hover:border-gray-300 hover:bg-gray-100 hover:text-black"
              : "cursor-not-allowed text-gray-300",
          )}
        >
          <Trash2 size={22} />
        </button>
      </div>
    </div>
  );
};

const QuestionOptions = ({
  answers,
  correctAnswerIndex,
  questionIndex,
  language,
  onAddAnswer,
  onDeleteAnswer,
  onSetCorrectAnswer,
  isEditing = true,
}: QuestionOptionsEditorProps) => {
  const { t } = useTranslation("quiz");

  return (
    <div className="space-y-3">
      {answers.map((_answer, answerIndex) => (
        <AnswerItem
          key={answerIndex}
          answerIndex={answerIndex}
          answersLength={answers.length}
          correctAnswerIndex={correctAnswerIndex}
          fieldPath={`questions.${questionIndex}.answers.${answerIndex}.translations.${language}.text`}
          onSetCorrectAnswer={onSetCorrectAnswer}
          onDeleteAnswer={onDeleteAnswer}
          isEditing={isEditing}
        />
      ))}

      {isEditing && (
        <>
          <p className="pt-1 text-sm text-gray-700">
            {t(($) => $.quiz.editor.select_correct_answer)}
          </p>

          <div className="flex justify-center pt-3">
            <Button
              type="button"
              variant="outline"
              className="min-w-64 border-2 border-black bg-white px-8 text-lg font-semibold text-black hover:bg-gray-50"
              onClick={onAddAnswer}
            >
              <Plus size={18} />
              {t(($) => $.quiz.editor.add_choice)}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default QuestionOptions;
