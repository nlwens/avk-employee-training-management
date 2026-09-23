import { type LocaleCode } from ".";

export type ChapterTranslation = {
  localeCode: LocaleCode;
  title: string;
};

export type Chapter = {
  id: string;
  courseId: string;
  order: number;
  createdAt: string;
  updatedAt: string;
  translations: ChapterTranslation[];
};

type ChapterTranslationInput = {
  locale: LocaleCode | string;
  title: string;
};

export type CreateChapter = {
  order: number;
  translations: ChapterTranslationInput[];
};

export type UpdateChapter = Partial<CreateChapter>;
