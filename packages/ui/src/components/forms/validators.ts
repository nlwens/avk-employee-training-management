import * as z from "zod";
import { type SegmentFile } from "api/src/types/segment-files";
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "i18n";

interface LocalizedTextRules {
  /** The translated field name, used to build the issue path (e.g. "title"). */
  field: string;
  requiredMessage: string;

  /** Minimum length enforced on any locale that is filled in. */
  min?: number;
  minMessage?: string;

  /** Maximum length enforced on any locale that is filled in. */
  max?: number;
  maxMessage?: string;
}

/**
 * Validates a single translatable text field across all supported locales.
 *
 * At least one locale must be provided. Any locale that *is* filled must also
 * satisfy the optional min/max bounds. Empty locales are skipped on purpose:
 * the client drops them before sending, so the backend never sees (and never
 * rejects) them.
 *
 * Issues are reported on every supported locale path so the error surfaces
 * regardless of which language is currently active.
 */
const validateLocalizedText = <T>(
  ctx: z.RefinementCtx,
  translations: Record<SupportedLanguage, T>,
  pick: (translation: T) => string,
  rules: LocalizedTextRules,
) => {
  const filledLocales = SUPPORTED_LANGUAGES.filter(
    (locale) => pick(translations[locale]).length > 0,
  );

  if (filledLocales.length === 0) {
    for (const locale of SUPPORTED_LANGUAGES) {
      ctx.addIssue({
        code: "custom",
        message: rules.requiredMessage,
        path: [locale, rules.field],
      });
    }
    return;
  }

  for (const locale of filledLocales) {
    const { length } = pick(translations[locale]);

    if (rules.min !== undefined && rules.minMessage && length < rules.min) {
      ctx.addIssue({
        code: "custom",
        message: rules.minMessage,
        path: [locale, rules.field],
      });
    } else if (
      rules.max !== undefined &&
      rules.maxMessage &&
      length > rules.max
    ) {
      ctx.addIssue({
        code: "custom",
        message: rules.maxMessage,
        path: [locale, rules.field],
      });
    }
  }
};

export const LoginSchema = z.object({
  email: z.string().email("validation:email.invalid"),
  password: z.string().trim().min(1, "validation:password.required"),
});

export const QuizQuestionTranslationSchema = z.object({
  question: z.string().trim(),
  explanation: z.string().optional(),
});

export const QuizAnswerTranslationSchema = z.object({
  text: z.string().trim(),
});

const quizQuestionTranslationsSchema = z
  .object({
    en: QuizQuestionTranslationSchema,
    nl: QuizQuestionTranslationSchema,
  })
  .superRefine((translations, ctx) => {
    validateLocalizedText(ctx, translations, (t) => t.question, {
      field: "question",
      requiredMessage: "validation:question.required",
      min: 3,
      minMessage: "validation:question.min_length",
      max: 500,
      maxMessage: "validation:question.max_length",
    });

    // Explanation is optional, but a provided explanation must be >= 5 chars to
    // match the backend. Only locales whose question is filled in are sent,
    // so locales without a question (and empty explanations) are skipped.
    for (const locale of SUPPORTED_LANGUAGES) {
      const { question, explanation } = translations[locale];
      const trimmedExplanation = (explanation ?? "").trim();

      if (question.length === 0 || trimmedExplanation.length === 0) continue;

      if (trimmedExplanation.length < 5) {
        ctx.addIssue({
          code: "custom",
          message: "validation:explanation.min_length",
          path: [locale, "explanation"],
        });
      }
    }
  });

const quizAnswerTranslationsSchema = z
  .object({
    en: QuizAnswerTranslationSchema,
    nl: QuizAnswerTranslationSchema,
  })
  .superRefine((translations, ctx) =>
    validateLocalizedText(ctx, translations, (t) => t.text, {
      field: "text",
      requiredMessage: "validation:option_text.required",
      min: 2,
      minMessage: "validation:option_text.min_length",
      max: 100,
      maxMessage: "validation:option_text.max_length",
    }),
  );

export const QuizAnswerSchema = z.object({
  id: z.string().optional(),
  translations: quizAnswerTranslationsSchema,
});

export const ChapterContentTypeSchema = z.enum([
  "text",
  "pdf",
  "pptx",
  "image",
  "video",
]);

/**
 * The file type differs based on context: a newly selected
 * file (not yet created) will be a native File instance. An
 * existing file fetched from the API will be a SegmentFile.
 */
const ChapterContentFileSchema = z.custom<SegmentFile | File | null>(
  (value) => value === null || typeof value === "object",
);

const ChapterBlockTranslationSchema = z.object({
  content: z.string(),
  file: ChapterContentFileSchema,
});

export const ChapterContentBlockSchema = z.object({
  id: z.string(),
  type: ChapterContentTypeSchema,
  order: z.number().int().nonnegative(),
  translations: z.object({
    en: ChapterBlockTranslationSchema,
    nl: ChapterBlockTranslationSchema,
  }),
});

const chapterTranslationsSchema = z
  .object({
    en: z.object({
      title: z.string().trim(),
    }),
    nl: z.object({
      title: z.string().trim(),
    }),
  })
  .superRefine((translations, ctx) =>
    validateLocalizedText(ctx, translations, (t) => t.title, {
      field: "title",
      requiredMessage: "validation:chapter_title.required",
      min: 3,
      minMessage: "validation:chapter_title.min_length",
      max: 100,
      maxMessage: "validation:chapter_title.max_length",
    }),
  );

export const ChapterSchema = z
  .object({
    id: z.string(),
    order: z.number().int().nonnegative(),
    translations: chapterTranslationsSchema,
    contentBlocks: z.array(ChapterContentBlockSchema),
  })
  .superRefine((chapter, ctx) => {
    chapter.contentBlocks.forEach((block, index) => {
      if (block.type !== "text") return;

      const hasContent = SUPPORTED_LANGUAGES.some(
        (locale) => block.translations[locale].content.trim().length > 0,
      );

      if (hasContent) return;

      for (const locale of SUPPORTED_LANGUAGES) {
        ctx.addIssue({
          code: "custom",
          message: "validation:content.required",
          path: ["contentBlocks", index, "translations", locale, "content"],
        });
      }
    });
  });

export const QuizQuestionSchema = z.object({
  id: z.string(),
  order: z.number().int().nonnegative(),
  translations: quizQuestionTranslationsSchema,
  answers: z.array(QuizAnswerSchema).min(2),
  correctAnswerIndex: z.union([
    z.number().int().nonnegative(),
    z.null().refine(() => false, {
      message: "validation:correct_answer.required",
    }),
  ]),
});

export const QuizFormSchema = z.object({
  questions: z.array(QuizQuestionSchema),
});

const passwordSchema = z
  .string()
  .trim()
  .min(1, "validation:password.required")
  .min(8, "validation:password.min_length");

const confirmPasswordSchema = z
  .string()
  .trim()
  .min(1, "validation:confirm_password.required")
  .min(8, "validation:confirm_password.min_length");

export const NewPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: confirmPasswordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "validation:confirm_password.match",
    path: ["confirmPassword"],
  });

export const PasswordChangeSchema = z
  .object({
    currentPassword: z
      .string()
      .trim()
      .min(1, "validation:current_password.required")
      .min(8, "validation:current_password.min_length"),
    password: passwordSchema,
    confirmPassword: confirmPasswordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "validation:confirm_password.match",
    path: ["confirmPassword"],
  });

export type LoginFormValues = z.infer<typeof LoginSchema>;
export type NewPasswordFormValues = z.infer<typeof NewPasswordSchema>;
export type PasswordChangeFormValues = z.infer<typeof PasswordChangeSchema>;
export type ChapterContentType = z.infer<typeof ChapterContentTypeSchema>;
export type ChapterContentBlock = z.infer<typeof ChapterContentBlockSchema>;
export type QuizQuestionFormValues = z.infer<typeof QuizQuestionSchema>;
export type QuizFormValues = z.infer<typeof QuizFormSchema>;
export type ChapterFormValues = z.infer<typeof ChapterSchema>;
