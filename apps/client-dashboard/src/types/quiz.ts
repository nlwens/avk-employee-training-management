import type { LocaleCode } from "@api/src";

export type QuizAnswerDraft = {
  id?: string;
  translations: Record<LocaleCode, { text: string }>;
};

export type QuizQuestionTranslationDraft = {
  question: string;
  explanation: string;
};

export type QuestionDraft = {
  id: string;
  order: number;
  translations: Record<LocaleCode, QuizQuestionTranslationDraft>;
  answers: QuizAnswerDraft[];
  correctAnswerIndex: number | null;
};

export type QuizFormValues = {
  questions: QuestionDraft[];
};
