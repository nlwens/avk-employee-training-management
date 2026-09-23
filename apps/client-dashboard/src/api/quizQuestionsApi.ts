import type {
  Answer,
  AnswerTranslationInput,
  CreateAnswerInput,
  CreateQuestionInput,
  LocaleCode,
  Question,
  QuestionTranslationInput,
  UpdateQuestionInput,
} from "@api/src";
import type { QuizFormValues } from "@ui/components/forms/validators";

const LOCALES = ["en", "nl"] as const satisfies readonly LocaleCode[];

type QuestionFormDraft = QuizFormValues["questions"][number];

export type SyncCourseQuestionsResult = {
  completed: number;
  failed: number;
  errors: unknown[];
};

/**
 * API operations needed to sync the quiz form with the backend.
 *
 * They are injected by the page so this file can focus on diffing form state
 * against the original API state.
 */
export type QuizQuestionsMutations = {
  createQuestion: (variables: {
    courseId: string;
    body: CreateQuestionInput;
  }) => Promise<Question>;

  updateQuestion: (variables: {
    courseId: string;
    questionId: string;
    body: UpdateQuestionInput;
  }) => Promise<Question>;

  deleteQuestion: (variables: {
    courseId: string;
    questionId: string;
  }) => Promise<void>;

  createAnswer: (variables: {
    courseId: string;
    questionId: string;
    body: CreateAnswerInput;
  }) => Promise<Answer>;

  updateAnswer: (variables: {
    courseId: string;
    questionId: string;
    answerId: string;
    body: CreateAnswerInput;
  }) => Promise<Answer>;

  deleteAnswer: (variables: {
    courseId: string;
    questionId: string;
    answerId: string;
  }) => Promise<void>;
};

const getQuestionTranslation = (question: Question, locale: LocaleCode) =>
  question.translations.find(
    (translation) => translation.localeCode === locale,
  );

const getAnswerTranslation = (
  answer: Question["answers"][number],
  locale: LocaleCode,
) =>
  answer.translations.find((translation) => translation.localeCode === locale);

const buildQuestionTranslations = (
  draft: QuestionFormDraft,
): QuestionTranslationInput[] =>
  LOCALES.filter(
    (locale) => draft.translations[locale].question.trim().length > 0,
  ).map((locale) => ({
    locale,
    text: draft.translations[locale].question,
    explanation: draft.translations[locale].explanation || null,
  }));

const buildAnswerTranslations = (
  draft: QuestionFormDraft,
  answerIndex: number,
): AnswerTranslationInput[] =>
  LOCALES.filter(
    (locale) =>
      (draft.answers[answerIndex]?.translations[locale].text ?? "").trim()
        .length > 0,
  ).map((locale) => ({
    locale,
    text: draft.answers[answerIndex]?.translations[locale].text ?? "",
  }));

const buildQuestionBody = (
  draft: QuestionFormDraft,
  order: number,
): CreateQuestionInput => ({
  order,
  translations: buildQuestionTranslations(draft),
});

const buildAnswerBody = (
  draft: QuestionFormDraft,
  answerIndex: number,
): CreateAnswerInput => ({
  translations: buildAnswerTranslations(draft, answerIndex),
});

const sameQuestionTranslations = (
  question: Question,
  nextTranslations: QuestionTranslationInput[],
) =>
  nextTranslations.every((nextTranslation) => {
    const currentTranslation = getQuestionTranslation(
      question,
      nextTranslation.locale,
    );

    return (
      currentTranslation?.text === nextTranslation.text &&
      (currentTranslation?.explanation ?? null) ===
        (nextTranslation.explanation ?? null)
    );
  });

const sameAnswerTranslations = (
  answer: Question["answers"][number],
  nextTranslations: AnswerTranslationInput[],
) =>
  nextTranslations.every((nextTranslation) => {
    const currentTranslation = getAnswerTranslation(
      answer,
      nextTranslation.locale,
    );

    return currentTranslation?.text === nextTranslation.text;
  });

const getCorrectAnswerIndex = (question: Question) => {
  if (!question.correctAnswerId) return null;

  const correctAnswerIndex = question.answers.findIndex(
    (answer) => answer.id === question.correctAnswerId,
  );

  return correctAnswerIndex === -1 ? null : correctAnswerIndex;
};

const runSyncOperation = async <T>(
  result: SyncCourseQuestionsResult,
  operation: () => Promise<T>,
): Promise<T | undefined> => {
  try {
    const value = await operation();

    result.completed += 1;

    return value;
  } catch (error) {
    result.failed += 1;
    result.errors.push(error);

    return undefined;
  }
};

/**
 * Converts backend questions into the form shape used by `QuizForm`.
 *
 * The backend stores the correct answer as an answer ID, while the form tracks
 * it as an answer index because the UI works with the visible answer list.
 */
export const mapQuestionsToQuizFormValues = (
  questions: Question[],
): QuizFormValues => ({
  questions: [...questions]
    .sort((a, b) => a.order - b.order)
    .map((question, index) => ({
      id: question.id,
      order: question.order ?? index,
      translations: {
        en: {
          question: getQuestionTranslation(question, "en")?.text ?? "",
          explanation:
            getQuestionTranslation(question, "en")?.explanation ?? "",
        },
        nl: {
          question: getQuestionTranslation(question, "nl")?.text ?? "",
          explanation:
            getQuestionTranslation(question, "nl")?.explanation ?? "",
        },
      },
      answers: question.answers.map((answer) => ({
        id: answer.id,
        translations: {
          en: {
            text: getAnswerTranslation(answer, "en")?.text ?? "",
          },
          nl: {
            text: getAnswerTranslation(answer, "nl")?.text ?? "",
          },
        },
      })),
      correctAnswerIndex: getCorrectAnswerIndex(question),
    })),
});

/**
 * Creates, updates, and deletes answers for one question.
 *
 * Each request is tracked separately so a failed answer request does not stop
 * later independent answer/question operations from running.
 */
const syncQuestionAnswers = async ({
  courseId,
  question,
  draft,
  mutations,
  result,
}: {
  courseId: string;
  question: Question;
  draft: QuestionFormDraft;
  mutations: QuizQuestionsMutations;
  result: SyncCourseQuestionsResult;
}) => {
  const originalAnswerById = new Map(
    question.answers.map((answer) => [answer.id, answer]),
  );

  const nextAnswerIds = new Set(
    draft.answers
      .map((answer) => answer.id)
      .filter((answerId): answerId is string => Boolean(answerId)),
  );

  const savedAnswerIdsByIndex = new Map<number, string>();

  for (const [answerIndex, answerDraft] of draft.answers.entries()) {
    const originalAnswer = answerDraft.id
      ? originalAnswerById.get(answerDraft.id)
      : undefined;

    const answerBody = buildAnswerBody(draft, answerIndex);

    if (!originalAnswer) {
      const createdAnswer = await runSyncOperation(result, () =>
        mutations.createAnswer({
          courseId,
          questionId: question.id,
          body: answerBody,
        }),
      );

      if (createdAnswer) {
        savedAnswerIdsByIndex.set(answerIndex, createdAnswer.id);
      }

      continue;
    }

    savedAnswerIdsByIndex.set(answerIndex, originalAnswer.id);

    if (!sameAnswerTranslations(originalAnswer, answerBody.translations)) {
      await runSyncOperation(result, () =>
        mutations.updateAnswer({
          courseId,
          questionId: question.id,
          answerId: originalAnswer.id,
          body: answerBody,
        }),
      );
    }
  }

  const nextCorrectAnswerId =
    draft.correctAnswerIndex === null
      ? undefined
      : savedAnswerIdsByIndex.get(draft.correctAnswerIndex);

  if (nextCorrectAnswerId && question.correctAnswerId !== nextCorrectAnswerId) {
    await runSyncOperation(result, () =>
      mutations.updateQuestion({
        courseId,
        questionId: question.id,
        body: {
          correctAnswerId: nextCorrectAnswerId,
        },
      }),
    );
  }

  for (const originalAnswer of question.answers) {
    if (!nextAnswerIds.has(originalAnswer.id)) {
      await runSyncOperation(result, () =>
        mutations.deleteAnswer({
          courseId,
          questionId: question.id,
          answerId: originalAnswer.id,
        }),
      );
    }
  }
};

const syncExistingQuestion = async ({
  courseId,
  originalQuestion,
  draft,
  order,
  mutations,
  result,
}: {
  courseId: string;
  originalQuestion: Question;
  draft: QuestionFormDraft;
  order: number;
  mutations: QuizQuestionsMutations;
  result: SyncCourseQuestionsResult;
}) => {
  const questionBody = buildQuestionBody(draft, order);

  if (
    originalQuestion.order !== order ||
    !sameQuestionTranslations(originalQuestion, questionBody.translations)
  ) {
    await runSyncOperation(result, () =>
      mutations.updateQuestion({
        courseId,
        questionId: originalQuestion.id,
        body: questionBody,
      }),
    );
  }

  await syncQuestionAnswers({
    courseId,
    question: originalQuestion,
    draft,
    mutations,
    result,
  });
};

/**
 * Creates a new question and then syncs its answers.
 *
 * If creating the question fails, its answers cannot be created because they
 * depend on the new question ID. Other questions still continue syncing.
 */
const syncNewQuestion = async ({
  courseId,
  draft,
  order,
  mutations,
  result,
}: {
  courseId: string;
  draft: QuestionFormDraft;
  order: number;
  mutations: QuizQuestionsMutations;
  result: SyncCourseQuestionsResult;
}) => {
  const createdQuestion = await runSyncOperation(result, () =>
    mutations.createQuestion({
      courseId,
      body: buildQuestionBody(draft, order),
    }),
  );

  if (!createdQuestion) return;

  await syncQuestionAnswers({
    courseId,
    question: createdQuestion,
    draft,
    mutations,
    result,
  });
};

/**
 * Syncs the submitted quiz form with the original backend state.
 *
 * The sync keeps going when individual requests fail, then returns completed
 * and failed counts so the page can show clear feedback and refetch the data.
 */
export const syncCourseQuestions = async ({
  courseId,
  originalQuestions,
  nextValues,
  mutations,
}: {
  courseId: string;
  originalQuestions: Question[];
  nextValues: QuizFormValues;
  mutations: QuizQuestionsMutations;
}): Promise<SyncCourseQuestionsResult> => {
  const result: SyncCourseQuestionsResult = {
    completed: 0,
    failed: 0,
    errors: [],
  };

  const originalQuestionById = new Map(
    originalQuestions.map((question) => [question.id, question]),
  );

  const nextPersistedQuestionIds = new Set(
    nextValues.questions
      .map((question) => question.id)
      .filter((questionId) => originalQuestionById.has(questionId)),
  );

  for (const [questionIndex, draft] of nextValues.questions.entries()) {
    const originalQuestion = originalQuestionById.get(draft.id);
    const order = draft.order ?? questionIndex;

    if (originalQuestion) {
      await syncExistingQuestion({
        courseId,
        originalQuestion,
        draft,
        order,
        mutations,
        result,
      });
      continue;
    }

    await syncNewQuestion({
      courseId,
      draft,
      order,
      mutations,
      result,
    });
  }

  for (const originalQuestion of originalQuestions) {
    if (!nextPersistedQuestionIds.has(originalQuestion.id)) {
      await runSyncOperation(result, () =>
        mutations.deleteQuestion({
          courseId,
          questionId: originalQuestion.id,
        }),
      );
    }
  }

  return result;
};
