import { type APIRequestContext } from "@playwright/test";
import { getAdminToken } from "./auth";

const API_URL = process.env.VITE_API_URL ?? "http://localhost:3000";

const LOCALES = ["en", "nl"] as const;

export type E2EQuizQuestionData = {
  id: string;
  text: string;
  explanation: string;
  answerText: string;
  correctAnswerId: string;
};

export type E2EQuizCourse = {
  courseId: string;
  questions: E2EQuizQuestionData[];
};

async function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

/**
 * Creates one quiz question with answer options via the admin API.
 *
 * Answers are created in parallel because each POST is independent once the
 * question exists. We store both the correct answer id (for API setup) and a
 * separate answerText for UI tests so they can pick a wrong option and still
 * see the explanation after clicking Check.
 */
async function createQuestionWithAnswers(
  request: APIRequestContext,
  token: string,
  courseId: string,
  order: number,
  questionText: string,
  answerTexts: string[],
): Promise<E2EQuizQuestionData> {
  const headers = await authHeaders(token);
  const explanation = `${questionText} explanation.`;

  const questionResponse = await request.post(
    `${API_URL}/courses/${courseId}/questions`,
    {
      headers,
      data: {
        order,
        translations: LOCALES.map((locale) => ({
          locale,
          text: questionText,
          explanation,
        })),
      },
    },
  );

  if (!questionResponse.ok()) {
    throw new Error(
      `Failed to create E2E quiz question: ${questionResponse.status()}`,
    );
  }

  const question: { id: string } = await questionResponse.json();

  const answerResponses = await Promise.all(
    answerTexts.map((text) =>
      request.post(
        `${API_URL}/courses/${courseId}/questions/${question.id}/answers`,
        {
          headers,
          data: {
            translations: LOCALES.map((locale) => ({ locale, text })),
          },
        },
      ),
    ),
  );

  for (const answerResponse of answerResponses) {
    if (!answerResponse.ok()) {
      throw new Error(
        `Failed to create E2E quiz answer: ${answerResponse.status()}`,
      );
    }
  }

  const answers: { id: string }[] = await Promise.all(
    answerResponses.map((response) => response.json()),
  );

  const correctAnswerResponse = await request.patch(
    `${API_URL}/courses/${courseId}/questions/${question.id}`,
    {
      headers,
      data: { correctAnswerId: answers[0].id },
    },
  );

  if (!correctAnswerResponse.ok()) {
    throw new Error(
      `Failed to set E2E quiz correct answer: ${correctAnswerResponse.status()}`,
    );
  }

  return {
    id: question.id,
    text: questionText,
    explanation,
    answerText: answerTexts[1] ?? answerTexts[0],
    correctAnswerId: answers[0].id,
  };
}

/**
 * Creates a published course with two quiz questions.
 *
 * The course must be published so the logged-in admin can access it in the employee app.
 */
export async function createE2EQuizCourse(
  request: APIRequestContext,
  token: string,
): Promise<E2EQuizCourse> {
  const suffix = Date.now();
  const courseTitle = `E2E Quiz Course ${suffix}`;

  const courseResponse = await request.post(`${API_URL}/courses`, {
    headers: await authHeaders(token),
    data: {
      translations: LOCALES.map((locale) => ({
        locale,
        title: courseTitle,
        content: "E2E quiz course description.",
      })),
      groups: [],
    },
  });

  if (!courseResponse.ok()) {
    throw new Error(
      `Failed to create E2E quiz course: ${courseResponse.status()}`,
    );
  }

  const course: { id: string } = await courseResponse.json();

  const publishResponse = await request.patch(
    `${API_URL}/courses/${course.id}`,
    {
      headers: await authHeaders(token),
      data: { published: true },
    },
  );

  if (!publishResponse.ok()) {
    throw new Error(
      `Failed to publish E2E quiz course: ${publishResponse.status()}`,
    );
  }

  // Questions are independent once the course exists, we create them in parallel to speed up the test.
  const questions = await Promise.all([
    createQuestionWithAnswers(
      request,
      token,
      course.id,
      1,
      `E2E quiz question 1 ${suffix}`,
      ["Answer A1", "Answer B1", "Answer C1"],
    ),
    createQuestionWithAnswers(
      request,
      token,
      course.id,
      2,
      `E2E quiz question 2 ${suffix}`,
      ["Answer A2", "Answer B2", "Answer C2"],
    ),
  ]);

  return {
    courseId: course.id,
    questions,
  };
}

export async function submitQuizAnswer(
  request: APIRequestContext,
  token: string,
  courseId: string,
  questionId: string,
  answerId: string,
): Promise<void> {
  const response = await request.post(
    `${API_URL}/courses/${courseId}/questions/${questionId}/user-answers`,
    {
      headers: await authHeaders(token),
      data: { answerId },
    },
  );

  if (!response.ok()) {
    throw new Error(`Failed to submit E2E quiz answer: ${response.status()}`);
  }
}

/**
 * Clears all answers for a user on the shared E2E course.
 *
 * Tests reuse one course from beforeAll, so any test that needs a fresh quiz state calls this first.
 */
export async function resetQuizAnswers(
  request: APIRequestContext,
  token: string,
  userId: string,
  courseId: string,
  questionIds: string[],
): Promise<void> {
  await Promise.all(
    questionIds.map(async (questionId) =>
      request.delete(
        `${API_URL}/courses/${courseId}/questions/${questionId}/user-answers/${userId}`,
        { headers: await authHeaders(token) },
      ),
    ),
  );
}

/** Removes the temporary course created for the quiz E2E suite. */
export async function deleteE2EQuizCourse(
  request: APIRequestContext,
  token: string,
  courseId: string,
): Promise<void> {
  await request.delete(`${API_URL}/courses/${courseId}`, {
    headers: await authHeaders(token),
  });
}

/** The wrapper function used by quiz.spec.ts beforeAll. */
export async function prepareQuizCourse(
  request: APIRequestContext,
  token?: string,
): Promise<E2EQuizCourse> {
  const authToken = token ?? (await getAdminToken(request));
  return createE2EQuizCourse(request, authToken);
}
