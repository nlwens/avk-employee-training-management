import { z } from "zod";
import {
  LOCALE_CODES,
  type Course,
  type CourseTranslation,
  type CourseTranslationInput,
  type CreateCourse,
  type LocaleCode,
  type UpdateCourse,
} from "api/src";

const courseTranslationSchema = z.object({
  localeCode: z.enum(["en", "nl"]),
  title: z.string().trim(),
  description: z.string(),
});

const COURSE_TITLE_MIN_LENGTH = 3;
const COURSE_TITLE_MAX_LENGTH = 100;

const courseTranslationsSchema = z
  .object({
    en: courseTranslationSchema,
    nl: courseTranslationSchema,
  })
  .superRefine((translations, ctx) => {
    const filledLocales = LOCALE_CODES.filter(
      (locale) => translations[locale].title.length > 0,
    );

    if (filledLocales.length === 0) {
      for (const locale of LOCALE_CODES) {
        ctx.addIssue({
          code: "custom",
          message: "validation:course_title.required",
          path: [locale, "title"],
        });
      }
      return;
    }

    for (const locale of filledLocales) {
      const { length } = translations[locale].title;

      if (length < COURSE_TITLE_MIN_LENGTH) {
        ctx.addIssue({
          code: "custom",
          message: "validation:course_title.min_length",
          path: [locale, "title"],
        });
      } else if (length > COURSE_TITLE_MAX_LENGTH) {
        ctx.addIssue({
          code: "custom",
          message: "validation:course_title.max_length",
          path: [locale, "title"],
        });
      }
    }
  });

// Maps the priority dropdown labels to the numeric `courses.priority` column.
export const COURSE_PRIORITY = {
  low: 0,
  medium: 1,
  high: 2,
} as const;

export const courseFormSchema = z.object({
  translations: courseTranslationsSchema,
  priority: z.number().int().min(0),
});

export type CourseFormValues = z.infer<typeof courseFormSchema>;

type CourseFormTranslations = CourseFormValues["translations"];

const emptyTranslations: CourseFormTranslations = {
  en: {
    localeCode: "en",
    title: "",
    description: "",
  },
  nl: {
    localeCode: "nl",
    title: "",
    description: "",
  },
};

export const getCourseFormDefaultValues = (
  translations?: CourseFormTranslations,
  priority: number = COURSE_PRIORITY.medium,
): CourseFormValues => ({
  translations: translations ?? emptyTranslations,
  priority,
});

const mapToFormTranslation = (
  localeCode: LocaleCode,
  translation?: CourseTranslation,
): CourseFormTranslations[LocaleCode] => ({
  localeCode,
  title: translation?.title ?? "",
  description: translation?.content ?? "",
});

const toCourseTranslationInputs = (
  translations: CourseFormTranslations,
): CourseTranslationInput[] =>
  LOCALE_CODES.filter(
    (locale) => translations[locale].title.trim().length > 0,
  ).map((locale) => ({
    locale,
    title: translations[locale].title,
    content: translations[locale].description,
  }));

export const mapCourseFormValuesToCreateCourse = (
  values: CourseFormValues,
): CreateCourse => ({
  translations: toCourseTranslationInputs(values.translations),
  priority: values.priority,
});

export const mapCourseFormValuesToUpdateCourse = (
  values: CourseFormValues,
): UpdateCourse => mapCourseFormValuesToCreateCourse(values);

export const getCourseFormDefaultValuesFromCourse = (
  course: Course,
): CourseFormValues => {
  const translationsByLocale = Object.fromEntries(
    course.translations.map((translation) => [
      translation.localeCode,
      translation,
    ]),
  ) as Partial<Record<LocaleCode, CourseTranslation>>;

  return getCourseFormDefaultValues(
    {
      en: mapToFormTranslation("en", translationsByLocale.en),
      nl: mapToFormTranslation("nl", translationsByLocale.nl),
    },
    course.priority,
  );
};
