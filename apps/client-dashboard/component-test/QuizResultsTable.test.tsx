import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import QuizResultsTable, {
  type QuizResultRow,
} from "../src/components/quizzes/QuizResultsTable";

const results: QuizResultRow[] = [
  {
    userId: "1",
    name: "Jane",
    surname: "Lee",
    score: 5,
    total: 5,
    submittedAt: "2026-04-12T10:00:00.000Z",
  },
  {
    userId: "2",
    name: "John",
    surname: "Doe",
    score: 3,
    total: 5,
    submittedAt: "2026-04-10T10:00:00.000Z",
  },
  {
    userId: "3",
    name: "Brian",
    surname: "Smith",
    score: 4,
    total: 5,
    submittedAt: "2026-04-11T10:00:00.000Z",
  },
];

const renderTable = (rows: QuizResultRow[] = results) =>
  render(
    <MemoryRouter>
      <QuizResultsTable results={rows} />
    </MemoryRouter>,
  );

const dataRows = () => screen.getAllByRole("row").slice(1);

// Reading the order in which employees appear lets us assert sorting results.
const nameOrder = () =>
  dataRows().map((row) => within(row).getByRole("link").textContent);

describe("QuizResultsTable", () => {
  it("renders the column headers", () => {
    renderTable();

    expect(
      screen.getByRole("columnheader", { name: "quiz.summary.name_column" }),
    ).toBeVisible();
    expect(
      screen.getByRole("columnheader", { name: "quiz.summary.score" }),
    ).toBeVisible();
    expect(
      screen.getByRole("columnheader", {
        name: "quiz.summary.submission_date",
      }),
    ).toBeVisible();
  });

  it("renders a row per result with full name and score", () => {
    renderTable();

    const rows = dataRows();
    expect(rows).toHaveLength(results.length);

    results.forEach((result, index) => {
      const row = rows[index];
      expect(
        within(row).getByText(`${result.name} ${result.surname}`),
      ).toBeVisible();
      expect(
        within(row).getByText(`${result.score}/${result.total}`),
      ).toBeVisible();
    });
  });

  it("links each name to the employee detail page", () => {
    renderTable();

    expect(screen.getByRole("link", { name: "Jane Lee" })).toHaveAttribute(
      "href",
      "/employees/1",
    );
    expect(screen.getByRole("link", { name: "John Doe" })).toHaveAttribute(
      "href",
      "/employees/2",
    );
  });

  it("sorts by score ascending then descending when the score header is clicked", async () => {
    const user = userEvent.setup();
    renderTable();

    const scoreHeader = screen.getByRole("button", {
      name: "quiz.summary.score",
    });

    await user.click(scoreHeader);
    expect(nameOrder()).toEqual(["John Doe", "Brian Smith", "Jane Lee"]);

    await user.click(scoreHeader);
    expect(nameOrder()).toEqual(["Jane Lee", "Brian Smith", "John Doe"]);
  });

  it("sorts by submission date ascending then descending when the date header is clicked", async () => {
    const user = userEvent.setup();
    renderTable();

    const dateHeader = screen.getByRole("button", {
      name: "quiz.summary.submission_date",
    });

    await user.click(dateHeader);
    expect(nameOrder()).toEqual(["John Doe", "Brian Smith", "Jane Lee"]);

    await user.click(dateHeader);
    expect(nameOrder()).toEqual(["Jane Lee", "Brian Smith", "John Doe"]);
  });

  it("shows an empty state when there are no results", () => {
    renderTable([]);

    expect(screen.getByText("quiz.summary.no_submissions")).toBeVisible();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
