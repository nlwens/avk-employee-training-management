import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import CourseAverageScores from "../src/components/dashboard/CourseAverageScores";
import PaginationControls from "@ui/components/PaginationControls";
import {
  mockCourseAverageScores,
  mockEmptyCourseAverageScores,
} from "./fixtures/dashboard";

const getPagination = () =>
  document.querySelector<HTMLElement>("nav[data-slot='pagination']");

describe("CourseAverageScores", () => {
  it("renders the widget title", () => {
    render(<CourseAverageScores courses={mockCourseAverageScores} />);

    expect(
      screen.getByText("courses.dashboard.average_quiz_score"),
    ).toBeVisible();
  });

  it("renders each course name and average score percentage", () => {
    render(<CourseAverageScores courses={mockCourseAverageScores} />);

    expect(screen.getByText("Forklift Safety")).toBeVisible();
    expect(screen.getByText("80%")).toBeVisible();
    expect(screen.getByText("First Aid Essentials")).toBeVisible();
    expect(screen.getByText("65%")).toBeVisible();
    expect(screen.getByText("Workplace Hygiene")).toBeVisible();
    expect(screen.getByText("92%")).toBeVisible();
  });

  it("renders a progress bar for each course with the correct score", () => {
    render(<CourseAverageScores courses={mockCourseAverageScores} />);

    const progressBars = screen.getAllByRole("progressbar");

    expect(progressBars).toHaveLength(mockCourseAverageScores.length);
    expect(progressBars[0]).toHaveAttribute("aria-valuenow", "80");
    expect(progressBars[1]).toHaveAttribute("aria-valuenow", "65");
    expect(progressBars[2]).toHaveAttribute("aria-valuenow", "92");
  });

  it("shows the empty state when no courses are provided", () => {
    render(<CourseAverageScores courses={mockEmptyCourseAverageScores} />);

    expect(
      screen.getByText("courses.dashboard.no_published_courses"),
    ).toBeVisible();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("renders pagination controls in the footer when provided", () => {
    render(
      <CourseAverageScores
        courses={mockCourseAverageScores}
        footer={
          <PaginationControls
            currentPage={1}
            totalPages={2}
            onPageChange={() => {}}
          />
        }
      />,
    );

    const pagination = getPagination();

    expect(pagination).toBeVisible();
    expect(within(pagination!).getByText("1")).toBeVisible();
    expect(within(pagination!).getByText("2")).toBeVisible();
  });

  it("does not render a footer when none is provided", () => {
    render(<CourseAverageScores courses={mockCourseAverageScores} />);

    expect(getPagination()).not.toBeInTheDocument();
  });
});
