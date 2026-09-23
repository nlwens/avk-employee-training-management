import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from "@playwright/test";

import { loginAsAdmin } from "./auth";
import { createCourseThroughUI } from "./courses";

const API_URL = process.env.VITE_API_URL ?? "http://localhost:3000";

const firstQuestionText = "What should you do first in an emergency?";
const firstQuestionAnswers = [
  "Check that the area is safe",
  "Move the person immediately",
  "Ignore the hazard",
];

const secondQuestionText = "Which number do you call in an emergency?";
const secondQuestionAnswers = ["112", "0900"];

interface ApiQuestion {
  id: string;
  correctAnswerId: string;
  translations: { localeCode: string; text: string }[];
}

/** Reads the admin JWT that the UI login stored in localStorage. */
const getAccessToken = async (page: Page): Promise<string> => {
  const token = await page.evaluate(() => localStorage.getItem("accessToken"));

  expect(token, "expected an access token after logging in").toBeTruthy();

  return token!;
};

/**
 * Submits the correct answer to the question with the given text through the
 * real API, acting as the authenticated admin. The admin's own answers are
 * returned by the summary endpoint, so this gives the page genuine data.
 *
 * We hit the API instead of the UI because employees submit answers in the
 * separate client-app; the dashboard under test has no screen to do it. This is
 * a real backend write, not a mocked response, so the page still fetches for real.
 */
const submitCorrectAnswerTo = async (
  request: APIRequestContext,
  token: string,
  courseId: string,
  questionText: string,
) => {
  const headers = { Authorization: `Bearer ${token}` };

  const questionsResponse = await request.get(
    `${API_URL}/courses/${courseId}/questions`,
    { headers },
  );
  expect(questionsResponse.ok()).toBeTruthy();

  // Match by text rather than position: the API order is not part of this
  // test's contract, so find the exact question we want to answer.
  const questions = (await questionsResponse.json()) as ApiQuestion[];
  const question = questions.find((q) =>
    q.translations.some((t) => t.text === questionText),
  );
  expect(question, `question "${questionText}" not found`).toBeDefined();

  const submission = await request.post(
    `${API_URL}/courses/${courseId}/questions/${question!.id}/user-answers`,
    {
      headers,
      data: { answerId: question!.correctAnswerId },
    },
  );
  expect(submission.ok()).toBeTruthy();
};

/**
 * Deletes the course so the test can be re-run without colliding with its own
 * leftover data. There is no UI to delete a course, so this goes through the
 * API. Deleting the course cascades to its questions, answers, and the
 * submitted user answer, so this single call cleans up everything created here.
 */
const deleteCourse = async (
  request: APIRequestContext,
  token: string,
  courseId: string,
) => {
  const response = await request.delete(`${API_URL}/courses/${courseId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  expect(response.ok()).toBeTruthy();
};

test.describe("Quiz summary questions page", () => {
  let createdCourseId: string | undefined;

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test.afterEach(async ({ page }) => {
    if (!createdCourseId) return;

    const token = await getAccessToken(page);
    await deleteCourse(page.request, token, createdCourseId);

    createdCourseId = undefined;
  });

  test("shows the created quiz questions and a submitted answer on the summary page", async ({
    page,
  }) => {
    const { courseId } = await createCourseThroughUI(page);
    createdCourseId = courseId;

    await page.goto(`/courses/${courseId}/quiz/questions`);

    await page.getByRole("button", { name: "Add question" }).click();

    const firstQuestion = page
      .locator("article")
      .filter({ hasText: "Question 1" });

    await firstQuestion.locator("input").first().fill(firstQuestionText);

    const firstAnswerInputs = firstQuestion.locator('input[placeholder="..."]');
    await firstAnswerInputs.nth(0).fill(firstQuestionAnswers[0]);
    await firstAnswerInputs.nth(1).fill(firstQuestionAnswers[1]);

    await firstQuestion
      .getByRole("button", { name: "Add choice", exact: true })
      .click();

    await firstAnswerInputs.nth(2).fill(firstQuestionAnswers[2]);

    // Mark the first option as the correct answer.
    await firstQuestion.getByLabel("Mark option 1 as correct").click();

    await page.getByRole("button", { name: "Add question" }).click();

    const secondQuestion = page
      .locator("article")
      .filter({ hasText: "Question 2" });

    await secondQuestion.locator("input").first().fill(secondQuestionText);

    const secondAnswerInputs = secondQuestion.locator(
      'input[placeholder="..."]',
    );
    await secondAnswerInputs.nth(0).fill(secondQuestionAnswers[0]);
    await secondAnswerInputs.nth(1).fill(secondQuestionAnswers[1]);

    await secondQuestion.getByLabel("Mark option 1 as correct").click();

    await page.getByRole("button", { name: "Save" }).click();

    await expect(
      page.getByText("Quiz questions updated successfully.", { exact: true }),
    ).toBeVisible();

    // Submit the correct answer to the first question through the real API
    const token = await getAccessToken(page);
    await submitCorrectAnswerTo(
      page.request,
      token,
      courseId,
      firstQuestionText,
    );

    await page.goto(`/courses/${courseId}/quiz/summary/questions`);

    await expect(
      page.getByText(`Question 1: [${firstQuestionText}]`),
    ).toBeVisible();
    await expect(
      page.getByText(`Question 2: [${secondQuestionText}]`),
    ).toBeVisible();

    // The correct answer option is highlighted in semibold. Each answer text is
    // unique on the page, so we can target it directly without scoping.
    const correctOption = page
      .locator("li")
      .filter({ hasText: firstQuestionAnswers[0] })
      .locator("p");

    await expect(correctOption).toHaveClass(/font-semibold/);

    // Expand the first question's answers accordion (rendered first on the page)
    // and verify the submitted answer was fetched and summarized.
    await page
      .getByRole("button", { name: "View all users' answers" })
      .first()
      .click();

    await expect(page.getByText("1/1 answered correctly")).toBeVisible();
  });
});
