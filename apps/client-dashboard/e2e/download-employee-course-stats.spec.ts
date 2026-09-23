import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./auth";
import {
  createEmployeeThroughUI,
  formatCourseStatsDownloadFilename,
  openEmployeeDetailsFromList,
} from "./employees";

const CSV_HEADER_COLUMNS_NL = [
  "Cursusnaam",
  "Voltooide hoofdstukken",
  "Hoofdstukken in cursus",
  "Correct beantwoorde vragen",
  "Vragen in cursus",
];

const CSV_HEADER_COLUMNS_EN = [
  "Course name",
  "Completed chapters",
  "Chapters in course",
  "Correctly answered questions",
  "Questions in course",
];

const CSV_HEADER_COLUMNS = [
  CSV_HEADER_COLUMNS_NL,
  CSV_HEADER_COLUMNS_EN,
] as const;

test.describe("Download employee course statistics", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);

    const employee = await createEmployeeThroughUI(page);
    await openEmployeeDetailsFromList(page, employee.viewDetailsButtonName);

    await expect(
      page.getByRole("button", { name: "Export results" }),
    ).toBeVisible();
  });

  test("downloads CSV from the real API with the expected filename and header row", async ({
    page,
  }) => {
    const fullName = (await page
      .getByText(/Employee\d+ Test/)
      .textContent())!.trim();
    const downloadPromise = page.waitForEvent("download");

    await page.getByRole("button", { name: "Export results" }).click();

    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe(
      formatCourseStatsDownloadFilename(fullName, "nl"),
    );

    const filePath = await download.path();
    expect(filePath).not.toBeNull();

    const content = await readFile(filePath!, "utf-8");
    const rows = content.trim().split("\n");
    const [headerLine, ...dataRows] = rows;

    expect(CSV_HEADER_COLUMNS).toContainEqual(headerLine.split(","));

    for (const row of dataRows) {
      expect(row.split(",")).toHaveLength(CSV_HEADER_COLUMNS_NL.length);
    }
  });
});
