import { expect, test, type Page } from "@playwright/test";
import { getAdminToken, getUserIdFromToken, loginAsAdmin } from "./auth";
import {
  deleteE2EQuizCourse,
  prepareQuizCourse,
  resetQuizAnswers,
  submitQuizAnswer,
  type E2EQuizCourse,
} from "./quiz-setup";

async function navigateToQuiz(page: Page, courseId: string) {
  await page.goto(`/courses/${courseId}/quiz`);
  await expect(page).toHaveURL(new RegExp(`/courses/${courseId}/quiz`));
}

async function answerCurrentQuestion(page: Page, answerText: string) {
  await page.getByText(answerText, { exact: true }).click();
  await page.getByRole("button", { name: "Check" }).click();
}

test.describe("Quiz", () => {
  // Tests share one course; run serially so state stays predictable.
  test.describe.configure({ mode: "serial" });

  let quizSetup: E2EQuizCourse;
  let adminUserId: string;
  let adminToken: string;

  test.beforeAll(async ({ request }) => {
    test.setTimeout(60_000);

    adminToken = await getAdminToken(request);
    adminUserId = getUserIdFromToken(adminToken);
    quizSetup = await prepareQuizCourse(request, adminToken);
  });

  test.afterAll(async ({ request }) => {
    await deleteE2EQuizCourse(request, adminToken, quizSetup.courseId);
  });

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("quiz shows question text and answer options", async ({ page }) => {
    const [firstQuestion] = quizSetup.questions;

    await navigateToQuiz(page, quizSetup.courseId);

    await expect(page.locator("p.reading-text").first()).toContainText(
      firstQuestion.text,
    );
    await expect(page.locator("button.text-left")).toHaveCount(3);
  });

  test("user completes a full quiz by stepping through all questions and submitting", async ({
    page,
    request,
  }) => {
    const [firstQuestion, secondQuestion] = quizSetup.questions;
    const token = await getAdminToken(request);

    // Test setup: clear any answers left on the shared course by a prior test.
    await resetQuizAnswers(
      request,
      token,
      adminUserId,
      quizSetup.courseId,
      quizSetup.questions.map((question) => question.id),
    );

    await navigateToQuiz(page, quizSetup.courseId);

    await expect(
      page.getByText(firstQuestion.text, { exact: true }),
    ).toBeVisible();
    await answerCurrentQuestion(page, firstQuestion.answerText);
    await expect(page.getByText(firstQuestion.explanation)).toBeVisible();
    await page.getByRole("button", { name: "Next" }).click();

    await expect(
      page.getByText(secondQuestion.text, { exact: true }),
    ).toBeVisible();
    await answerCurrentQuestion(page, secondQuestion.answerText);
    await expect(page.getByText(secondQuestion.explanation)).toBeVisible();
    await page.getByRole("button", { name: "Submit" }).click();

    await expect(page).toHaveURL(
      new RegExp(`/courses/${quizSetup.courseId}/completed`),
    );
  });

  test("user reviews an already-answered question, then continues the quiz", async ({
    page,
    request,
  }) => {
    const token = await getAdminToken(request);
    const [firstQuestion, secondQuestion] = quizSetup.questions;

    // Test setup: start with a fresh quiz where only the first question is already answered.
    await resetQuizAnswers(
      request,
      token,
      adminUserId,
      quizSetup.courseId,
      quizSetup.questions.map((question) => question.id),
    );
    await submitQuizAnswer(
      request,
      token,
      quizSetup.courseId,
      firstQuestion.id,
      firstQuestion.correctAnswerId,
    );

    await navigateToQuiz(page, quizSetup.courseId);

    await expect(
      page.getByText(firstQuestion.text, { exact: true }),
    ).toBeVisible();
    await expect(page.getByText(firstQuestion.explanation)).toBeVisible();
    await expect(
      page.getByText("You can no longer change your answer."),
    ).toBeVisible();

    await page.getByRole("button", { name: "Next" }).click();

    await expect(
      page.getByText(secondQuestion.text, { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("You can no longer change your answer."),
    ).not.toBeVisible();

    await answerCurrentQuestion(page, secondQuestion.answerText);
    await page.getByRole("button", { name: "Submit" }).click();

    await expect(page).toHaveURL(
      new RegExp(`/courses/${quizSetup.courseId}/completed`),
    );
  });
});
