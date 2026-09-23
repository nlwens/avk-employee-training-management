import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./auth";

test.describe("Quiz form page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/quizzes/edit");
  });

  test("renders the quiz form", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Quiz" })).toBeVisible();
  });

  test("creates a quiz end-to-end: add questions, options, translations, and save as draft", async ({
    page,
  }) => {
    const firstQuestionInput = page.getByPlaceholder(
      "Write your question here...",
    );

    await firstQuestionInput.fill("What is the capital of France?");

    const addChoiceButton = page.getByRole("button", {
      name: "Add choice",
      exact: true,
    });

    await addChoiceButton.click();

    const optionInputs = page.locator("input[placeholder*='...']");
    await optionInputs.nth(0).fill("Paris");
    await optionInputs.nth(1).fill("London");
    await optionInputs.nth(2).fill("Berlin");

    // Mark Paris as correct
    const markButtons = page.locator("button[aria-label*='Mark option']");
    await markButtons.nth(0).click();
    await expect(markButtons.nth(0)).toHaveAttribute("aria-pressed", "true");

    // Add a second question
    const addQuestionButton = page.getByRole("button", {
      name: "Add question",
    });
    await addQuestionButton.click();

    // Fill second question and one option
    const questionInputs = page.locator(
      "input[placeholder*='Write your question']",
    );
    await questionInputs.nth(1).fill("What is 2 + 2?");

    // For the second question, ensure at least two options exist
    const addChoiceButtons = page.getByRole("button", { name: "Add choice" });
    await addChoiceButtons.nth(1).click();
    const optionInputsForSecond = page
      .locator("div")
      .filter({ has: page.locator("text=Question 2").locator("..") })
      .locator("input[placeholder*='...']");

    // (Fallback) if the above selector doesn't find inputs, use global locator
    if ((await optionInputsForSecond.count()) < 2) {
      await page.locator("input[placeholder*='...']").nth(3).fill("4");
      await page.locator("input[placeholder*='...']").nth(4).fill("5");
    } else {
      await optionInputsForSecond.nth(0).fill("4");
      await optionInputsForSecond.nth(1).fill("5");
    }

    // Write explanations for both questions
    const explanationTextareas = page.locator("textarea");
    const count = await explanationTextareas.count();

    // Fill explanation for the first question
    if (count > 0) {
      await explanationTextareas
        .first()
        .fill("Paris is the capital city of France.");
    }

    // Fill explanation for the second question if it exists
    if (count > 1) {
      await explanationTextareas.nth(1).fill("2 + 2 equals 4.");
    }

    // Switch language to Dutch and add translations for the first question
    const languageSwitch = page.getByRole("switch", {
      name: "Switch quiz content language",
    });
    await languageSwitch.click();
    await expect(languageSwitch).toContainText("NL");

    const firstQuestionInputNL = page
      .locator("input[placeholder*='Write your question']")
      .first();
    await firstQuestionInputNL.fill("Wat is de hoofdstad van Frankrijk?");

    // Switch back to English
    await languageSwitch.click();

    // Save the quiz
    const saveButton = page.getByRole("button", { name: "Save" });
    await saveButton.click();

    // After saving as draft the app redirects back to ... (todo)
  });
});
