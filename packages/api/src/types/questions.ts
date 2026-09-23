import type { LocaleCode } from "./index";

export interface AnswerTranslation {
  localeCode: LocaleCode;
  text: string;
}

export interface Answer {
  id: string;
  questionId: string;
  translations: AnswerTranslation[];
}

export interface QuestionTranslation {
  localeCode: LocaleCode;
  text: string;
  explanation?: string | null;
}

export interface Question {
  id: string;
  order: number;
  courseId: string;
  correctAnswerId?: string | null;
  translations: QuestionTranslation[];
  answers: Answer[];
}

export type QuestionTranslationInput = {
  locale: LocaleCode;
  text: string;
  explanation?: string | null;
};

export type AnswerTranslationInput = {
  locale: LocaleCode;
  text: string;
};

export type CreateQuestionInput = {
  order?: number;
  translations: QuestionTranslationInput[];
};

export type UpdateQuestionInput = Partial<CreateQuestionInput> & {
  correctAnswerId?: string;
};

export type CreateAnswerInput = {
  translations: AnswerTranslationInput[];
};

export type UpdateAnswerInput = Partial<CreateAnswerInput>;
