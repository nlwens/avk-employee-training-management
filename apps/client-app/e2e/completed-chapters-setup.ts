import { type APIRequestContext } from "@playwright/test";
import { getAdminToken } from "./auth";
import { deleteE2EQuizCourse } from "./quiz-setup";

const API_URL = process.env.VITE_API_URL ?? "http://localhost:3000";

const LOCALES = ["en", "nl"] as const;

export type E2ECompletionCourse = {
  courseId: string;
  chapterId: string;
  chapterTitle: string;
};

async function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

/**
 * Creates a published course with one chapter via the admin API.
 *
 * The suite shares this course across all tests.
 */
export async function createE2ECompletionCourse(
  request: APIRequestContext,
  token: string,
): Promise<E2ECompletionCourse> {
  const suffix = Date.now();
  const courseTitle = `E2E Completion Course ${suffix}`;
  const chapterTitle = `E2E Completion Chapter ${suffix}`;

  const courseResponse = await request.post(`${API_URL}/courses`, {
    headers: await authHeaders(token),
    data: {
      translations: LOCALES.map((locale) => ({
        locale,
        title: courseTitle,
        content: "E2E completion course description.",
      })),
      groups: [],
    },
  });

  if (!courseResponse.ok()) {
    throw new Error(
      `Failed to create E2E completion course: ${courseResponse.status()}`,
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
      `Failed to publish E2E completion course: ${publishResponse.status()}`,
    );
  }

  const chapterResponse = await request.post(
    `${API_URL}/courses/${course.id}/chapters`,
    {
      headers: await authHeaders(token),
      data: {
        order: 1,
        translations: LOCALES.map((locale) => ({
          locale,
          title: chapterTitle,
        })),
      },
    },
  );

  if (!chapterResponse.ok()) {
    throw new Error(
      `Failed to create E2E completion chapter: ${chapterResponse.status()}`,
    );
  }

  const chapter: { id: string } = await chapterResponse.json();

  return {
    courseId: course.id,
    chapterId: chapter.id,
    chapterTitle,
  };
}

/** The wrapper function used by completed-chapters.spec.ts beforeAll. */
export async function prepareCompletionCourse(
  request: APIRequestContext,
  token?: string,
): Promise<E2ECompletionCourse> {
  const authToken = token ?? (await getAdminToken(request));
  return createE2ECompletionCourse(request, authToken);
}

/** Removes the temporary course created for the completion E2E suite. */
export async function deleteE2ECompletionCourse(
  request: APIRequestContext,
  token: string,
  courseId: string,
): Promise<void> {
  await deleteE2EQuizCourse(request, token, courseId);
}
