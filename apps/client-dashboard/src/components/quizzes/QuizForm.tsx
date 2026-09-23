import { useEffect, useRef, useState } from "react";
import { useContentLanguage } from "i18n";
import { useTranslation } from "react-i18next";
import { closestCenter, DndContext, type DragEndEvent } from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { zodResolver } from "@hookform/resolvers/zod";
import type { QuestionDraft } from "src/types/quiz";
import type { QuizFormValues } from "@ui/components/forms/validators";
import {
  useFieldArray,
  useForm,
  type FieldErrors,
  type SubmitHandler,
} from "react-hook-form";
import { Form } from "@ui/components/ui/form";
import { Button } from "@ui/components/ui/button";
import { Plus } from "lucide-react";
import { QuizFormSchema } from "@ui/components/forms/validators";
import { ContentLanguageSwitch } from "@ui/components/ContentLanguageSwitch";
import type { ContentLanguage } from "@ui/components/ContentLanguageSwitch";

import SortableQuestionCard from "./SortableQuestionCard";

interface QuizFormProps {
  initialData?: QuizFormValues;
  onSubmit: SubmitHandler<QuizFormValues>;
  onCancel?: () => void;
  onEdit?: () => void;
  isEditing?: boolean;
  isSubmitting?: boolean;
  showHeader?: boolean;
}

const createEmptyAnswer = () => ({
  translations: {
    en: { text: "" },
    nl: { text: "" },
  },
});

const createQuestionDraft = (id: string, order = 0): QuestionDraft => ({
  id,
  order,
  translations: {
    en: {
      question: "",
      explanation: "",
    },
    nl: {
      question: "",
      explanation: "",
    },
  },
  answers: [createEmptyAnswer(), createEmptyAnswer()],
  correctAnswerIndex: null,
});

const getNextQuestionNumber = (values?: QuizFormValues) => {
  if (!values) return 2;

  return (
    values.questions.reduce((highest, question) => {
      const match = question.id.match(/^question-(\d+)$/);

      if (!match) return highest;

      return Math.max(highest, Number(match[1]));
    }, 0) + 1
  );
};

const hasAnswerTranslationError = (
  questionError: NonNullable<FieldErrors<QuizFormValues>["questions"]>[number],
  language: ContentLanguage,
) => {
  const answerErrors = questionError?.answers;

  if (!Array.isArray(answerErrors)) return false;

  return answerErrors.some((answerError) =>
    Boolean(answerError?.translations?.[language]),
  );
};

const getErroredContentLanguage = (
  errors: FieldErrors<QuizFormValues>,
): ContentLanguage | null => {
  const questionErrors = errors.questions;

  if (!Array.isArray(questionErrors)) return null;

  const hasEnglishError = questionErrors.some(
    (questionError) =>
      Boolean(questionError?.translations?.en) ||
      hasAnswerTranslationError(questionError, "en"),
  );

  if (hasEnglishError) return "en";

  const hasDutchError = questionErrors.some(
    (questionError) =>
      Boolean(questionError?.translations?.nl) ||
      hasAnswerTranslationError(questionError, "nl"),
  );

  if (hasDutchError) return "nl";

  return null;
};

const QuizForm = ({
  initialData,
  onSubmit,
  onCancel,
  onEdit,
  isEditing = true,
  isSubmitting = false,
  showHeader = true,
}: QuizFormProps) => {
  const { t } = useTranslation(["quiz", "common"]);
  const defaultContentLanguage = useContentLanguage();
  const [currentLanguage, setCurrentLanguage] = useState<ContentLanguage>(
    defaultContentLanguage,
  );
  const nextQuestionId = useRef(getNextQuestionNumber(initialData));

  const form = useForm<QuizFormValues>({
    resolver: zodResolver(QuizFormSchema),
    defaultValues: initialData || {
      questions: [createQuestionDraft("question-1", 0)],
    },
  });

  const { fields, append, move, replace } = useFieldArray({
    control: form.control,
    name: "questions",
    keyName: "fieldId",
  });

  // Reset form when editing is finished and initial data is provided
  useEffect(() => {
    if (!isEditing && initialData) {
      form.reset(initialData);
      nextQuestionId.current = getNextQuestionNumber(initialData);
    }
  }, [form, initialData, isEditing]);

  const reorderQuestions = (fromIndex: number, toIndex: number) => {
    if (!isEditing) return;

    const nextQuestions = [...form.getValues("questions")];
    const [movedQuestion] = nextQuestions.splice(fromIndex, 1);

    nextQuestions.splice(toIndex, 0, movedQuestion);

    move(fromIndex, toIndex);

    nextQuestions.forEach((_question, index) => {
      form.setValue(`questions.${index}.order`, index, {
        shouldDirty: true,
        shouldTouch: true,
      });
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (!isEditing) return;

    const { active, over } = event;

    if (!over) return;

    const fromIndex = fields.findIndex((field) => field.id === active.id);
    const toIndex = fields.findIndex((field) => field.id === over.id);

    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;

    reorderQuestions(fromIndex, toIndex);
  };

  const handleAddQuestion = () => {
    const nextOrder = form.getValues("questions").length;

    append(
      createQuestionDraft(`question-${nextQuestionId.current++}`, nextOrder),
    );
  };

  const handleDeleteQuestion = (questionId: string) => {
    if (!isEditing) return;

    const nextQuestions = form
      .getValues("questions")
      .filter((question) => question.id !== questionId);

    replace(
      nextQuestions.map((question, index) => ({
        ...question,
        order: index,
      })),
    );
  };

  const handleInvalid = (errors: FieldErrors<QuizFormValues>) => {
    const erroredLanguage = getErroredContentLanguage(errors);

    if (erroredLanguage) {
      setCurrentLanguage(erroredLanguage);
    }
  };

  return (
    <>
      {showHeader && (
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-medium">{t(($) => $.quiz.title)}</h2>

          <ContentLanguageSwitch
            value={currentLanguage}
            onValueChange={setCurrentLanguage}
            size="sm"
            aria-label={t(($) => $.quiz.editor.toggle_language)}
          />
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit, handleInvalid)}>
          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis]}
          >
            <SortableContext
              items={fields.map((field) => field.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto no-scrollbar">
                {fields.map((question, index) => (
                  <SortableQuestionCard
                    key={question.fieldId}
                    questionIndex={index}
                    questionId={question.id}
                    language={currentLanguage}
                    onDeleteQuestion={handleDeleteQuestion}
                    canDelete={fields.length > 1}
                    isEditing={isEditing}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {isEditing && (
            <div className="mt-6 flex justify-center">
              <Button
                type="button"
                onClick={handleAddQuestion}
                variant="outline"
                className="min-w-80 border-2 border-black bg-white px-8 text-lg font-semibold text-black hover:bg-gray-50"
              >
                <Plus size={18} />
                {t(($) => $.quiz.editor.add_question)}
              </Button>
            </div>
          )}

          <div className="flex gap-6 pt-6">
            {isEditing ? (
              <>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? t(($) => $.common.actions.saving)
                    : t(($) => $.common.actions.save)}
                </Button>

                {onCancel && (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSubmitting}
                    onClick={() => {
                      if (initialData) {
                        form.reset(initialData);
                        nextQuestionId.current =
                          getNextQuestionNumber(initialData);
                      }
                      onCancel();
                    }}
                  >
                    {t(($) => $.common.actions.cancel)}
                  </Button>
                )}
              </>
            ) : (
              <Button key="edit" type="button" onClick={onEdit}>
                {t(($) => $.quiz.editor.edit)}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </>
  );
};

export default QuizForm;
