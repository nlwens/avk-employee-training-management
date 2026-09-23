import { expect, test } from "@playwright/test";

import { loginAsAdmin } from "./auth";
import { courseIdFromUrl } from "./chapters";
import { createCourseThroughUI } from "./courses";

let courseId: string;

test.describe.configure({ mode: "serial" });

test.describe("Quiz questions pages", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("creates quiz questions and shows them after reload", async ({
    page,
  }) => {
    await createCourseThroughUI(page);

    const createdCourseId = courseIdFromUrl(page.url());
    expect(createdCourseId).toBeTruthy();

    courseId = createdCourseId!;

    await page.goto(`/courses/${courseId}/quiz/questions`);

    await expect(
      page.getByRole("button", { name: "Add question" }),
    ).toBeVisible();

    const languageSwitch = page.getByRole("switch", {
      name: "Switch quiz content language",
    });

    // Create the initial English quiz questions.
    await page.getByRole("button", { name: "Add question" }).click();

    const firstQuestion = page
      .locator("article")
      .filter({ hasText: "Question 1" });

    await firstQuestion
      .locator("input")
      .first()
      .fill("What should you do before giving first aid?");

    const firstQuestionEnglishAnswers = firstQuestion.locator(
      'input[placeholder="..."]',
    );

    await firstQuestionEnglishAnswers
      .nth(0)
      .fill("Check that the area is safe");
    await firstQuestionEnglishAnswers
      .nth(1)
      .fill("Move the person immediately");

    await firstQuestion
      .getByRole("button", { name: "Add choice", exact: true })
      .click();

    await firstQuestionEnglishAnswers.nth(2).fill("Ignore the hazard");

    await firstQuestion.getByLabel("Mark option 1 as correct").click();

    await page.getByRole("button", { name: "Add question" }).click();

    const secondQuestion = page
      .locator("article")
      .filter({ hasText: "Question 2" });

    await secondQuestion
      .locator("input")
      .first()
      .fill("Which number do you call in an emergency?");

    const secondQuestionEnglishAnswers = secondQuestion.locator(
      'input[placeholder="..."]',
    );

    await secondQuestionEnglishAnswers.nth(0).fill("112");
    await secondQuestionEnglishAnswers.nth(1).fill("0900");

    await secondQuestion.getByLabel("Mark option 1 as correct").click();

    // Add Dutch translations for the same quiz questions.
    await languageSwitch.click();

    await firstQuestion
      .locator("input")
      .first()
      .fill("Wat moet je doen voordat je eerste hulp verleent?");

    const firstQuestionDutchAnswers = firstQuestion.locator(
      'input[placeholder="..."]',
    );

    await firstQuestionDutchAnswers
      .nth(0)
      .fill("Controleren of de omgeving veilig is");
    await firstQuestionDutchAnswers
      .nth(1)
      .fill("De persoon onmiddellijk verplaatsen");
    await firstQuestionDutchAnswers.nth(2).fill("Het gevaar negeren");

    await secondQuestion
      .locator("input")
      .first()
      .fill("Welk nummer bel je bij nood?");

    const secondQuestionDutchAnswers = secondQuestion.locator(
      'input[placeholder="..."]',
    );

    await secondQuestionDutchAnswers.nth(0).fill("112");
    await secondQuestionDutchAnswers.nth(1).fill("0900");

    await page.getByRole("button", { name: "Save" }).click();

    await expect(
      page.getByText("Quiz questions updated successfully.", { exact: true }),
    ).toBeVisible();

    await expect(
      page.getByRole("button", { name: "Edit", exact: true }),
    ).toBeVisible();

    // Reload the page to verify the questions were persisted and refetched.
    await page.reload();

    await expect(page.locator("article")).toHaveCount(2);

    await expect(
      page.locator(
        'input[value="What should you do before giving first aid?"]',
      ),
    ).toBeVisible();

    await expect(
      page.locator('input[value="Check that the area is safe"]'),
    ).toBeVisible();

    await expect(
      page.locator('input[value="Ignore the hazard"]'),
    ).toBeVisible();

    await expect(
      page.locator('input[value="Which number do you call in an emergency?"]'),
    ).toBeVisible();

    await expect(page.locator('input[value="112"]')).toBeVisible();

    await languageSwitch.click();

    await expect(
      page.locator(
        'input[value="Wat moet je doen voordat je eerste hulp verleent?"]',
      ),
    ).toBeVisible();

    await expect(
      page.locator('input[value="Controleren of de omgeving veilig is"]'),
    ).toBeVisible();

    await expect(
      page.locator('input[value="Welk nummer bel je bij nood?"]'),
    ).toBeVisible();
  });

  test("modifies quiz questions and shows the saved changes after reload", async ({
    page,
  }) => {
    await page.goto(`/courses/${courseId}/quiz/questions`);
    await page.getByRole("button", { name: "Edit", exact: true }).click();

    const languageSwitch = page.getByRole("switch", {
      name: "Switch quiz content language",
    });

    const firstQuestion = page
      .locator("article")
      .filter({ hasText: "Question 1" });

    // Update the existing first question and replace one answer.
    await firstQuestion
      .locator("input")
      .first()
      .fill("Updated first aid question?");

    await firstQuestion.getByLabel("Delete option 3").click();

    await firstQuestion
      .getByRole("button", { name: "Add choice", exact: true })
      .click();

    await firstQuestion
      .locator('input[placeholder="..."]')
      .last()
      .fill("Call 112");

    await firstQuestion.getByLabel("Mark option 3 as correct").click();

    // Add a completely new question through the editor.
    await page.getByRole("button", { name: "Add question" }).click();

    const newQuestion = page
      .locator("article")
      .filter({ hasText: "Question 3" });

    await newQuestion
      .locator("input")
      .first()
      .fill("What is the safest first action?");

    const newQuestionEnglishAnswers = newQuestion.locator(
      'input[placeholder="..."]',
    );

    await newQuestionEnglishAnswers.nth(0).fill("Call emergency services");
    await newQuestionEnglishAnswers.nth(1).fill("Run away");

    await newQuestion.getByLabel("Mark option 1 as correct").click();

    // Add Dutch translations for the changed and newly added content.
    await languageSwitch.click();

    await firstQuestion
      .locator("input")
      .first()
      .fill("Bijgewerkte eerstehulpvraag?");

    await firstQuestion
      .locator('input[placeholder="..."]')
      .last()
      .fill("Bel 112");

    await newQuestion
      .locator("input")
      .first()
      .fill("Wat is de veiligste eerste actie?");

    const newQuestionDutchAnswers = newQuestion.locator(
      'input[placeholder="..."]',
    );

    await newQuestionDutchAnswers.nth(0).fill("Bel hulpdiensten");
    await newQuestionDutchAnswers.nth(1).fill("Ren weg");

    // Remove the old second question before saving.
    const secondQuestion = page
      .locator("article")
      .filter({ hasText: "Question 2" });

    await secondQuestion.getByLabel("Delete question 2").click();

    await page.getByRole("button", { name: "Save" }).click();

    await expect(
      page.getByText("Quiz questions updated successfully.", { exact: true }),
    ).toBeVisible();

    await expect(
      page.getByRole("button", { name: "Edit", exact: true }),
    ).toBeVisible();

    // Reload the page to verify the saved changes are fetched from the API.
    await page.reload();

    await expect(page.locator("article")).toHaveCount(2);

    await expect(
      page.locator('input[value="Updated first aid question?"]'),
    ).toBeVisible();

    await expect(page.locator('input[value="Call 112"]')).toBeVisible();

    await expect(
      page.locator('input[value="What is the safest first action?"]'),
    ).toBeVisible();

    await expect(
      page.locator('input[value="Call emergency services"]'),
    ).toBeVisible();

    await expect(page.locator('input[value="Run away"]')).toBeVisible();

    await expect(
      page.locator('input[value="Which number do you call in an emergency?"]'),
    ).toHaveCount(0);

    await languageSwitch.click();

    await expect(
      page.locator('input[value="Bijgewerkte eerstehulpvraag?"]'),
    ).toBeVisible();

    await expect(page.locator('input[value="Bel 112"]')).toBeVisible();

    await expect(
      page.locator('input[value="Wat is de veiligste eerste actie?"]'),
    ).toBeVisible();

    await expect(page.locator('input[value="Bel hulpdiensten"]')).toBeVisible();

    await expect(page.locator('input[value="Ren weg"]')).toBeVisible();
  });
});
