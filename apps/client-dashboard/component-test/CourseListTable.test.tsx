import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import CourseListTable from "../src/components/employees/CourseListTable";
import type { EmployeeDetailCourse } from "../src/types/employee-detail";
import {
  mockCourseCompleted,
  mockCourseIncomplete,
  mockCourses,
} from "./fixtures/courses";

const renderCourseListTable = (
  props: {
    selectedCourseId?: string | null;
    onSelect?: (course: EmployeeDetailCourse | null) => void;
  } = {},
) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const onSelect =
    props.onSelect ?? vi.fn<(course: EmployeeDetailCourse | null) => void>();

  render(
    <QueryClientProvider client={queryClient}>
      <CourseListTable
        courses={mockCourses}
        selectedCourseId={props.selectedCourseId ?? null}
        onSelect={onSelect}
      />
    </QueryClientProvider>,
  );

  return { onSelect };
};

describe("CourseListTable", () => {
  it("renders column headers", () => {
    renderCourseListTable();

    expect(screen.getByText("employees.detail.course_name")).toBeVisible();
    expect(screen.getByText("employees.detail.status")).toBeVisible();
    expect(screen.getByText("employees.detail.score")).toBeVisible();
  });

  it("renders name, status, and score for each course", () => {
    renderCourseListTable();

    expect(screen.getByText("Forklift Safety")).toBeVisible();
    expect(screen.getByText("employees.detail.status_completed")).toBeVisible();
    expect(screen.getByText("2/2")).toBeVisible();

    expect(screen.getByText("First Aid Essentials")).toBeVisible();
    expect(
      screen.getByText("employees.detail.status_not_started"),
    ).toBeVisible();
    expect(screen.getByText("-")).toBeVisible();
  });

  it("renders one row per course plus the header row", () => {
    renderCourseListTable();

    expect(screen.getAllByRole("row")).toHaveLength(mockCourses.length + 1);
  });

  it("marks the selected course row with data-state selected", () => {
    renderCourseListTable({
      selectedCourseId: mockCourseCompleted.id,
    });

    const selectedRow = screen.getByText("Forklift Safety").closest("tr");
    const unselectedRow = screen
      .getByText("First Aid Essentials")
      .closest("tr");

    expect(selectedRow).toHaveAttribute("data-state", "selected");
    expect(unselectedRow).not.toHaveAttribute("data-state", "selected");
  });

  it("does not mark any row as selected when selectedCourseId is null", () => {
    renderCourseListTable({ selectedCourseId: null });

    for (const row of screen.getAllByRole("row")) {
      expect(row).not.toHaveAttribute("data-state", "selected");
    }
  });

  it("calls onSelect with the course when clicking a course", () => {
    const { onSelect } = renderCourseListTable();

    fireEvent.click(screen.getByText("Forklift Safety"));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(mockCourseCompleted);
  });

  it("calls onSelect with null when clicking the already-selected course", () => {
    const { onSelect } = renderCourseListTable({
      selectedCourseId: mockCourseCompleted.id,
    });

    fireEvent.click(screen.getByText("Forklift Safety"));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it("calls onSelect when clicking a course without a submission", () => {
    const { onSelect } = renderCourseListTable();

    fireEvent.click(screen.getByText("First Aid Essentials"));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(mockCourseIncomplete);
  });

  it("applies cursor-pointer styling to course rows", () => {
    renderCourseListTable();

    expect(screen.getByText("Forklift Safety").closest("tr")).toHaveClass(
      "cursor-pointer",
    );

    expect(screen.getByText("First Aid Essentials").closest("tr")).toHaveClass(
      "cursor-pointer",
    );
  });
});
