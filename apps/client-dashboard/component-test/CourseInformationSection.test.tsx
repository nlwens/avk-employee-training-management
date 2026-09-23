import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import CourseInformationSection from "../src/components/courses/CourseInformationSection";

const defaultDescription = "This course explains safe forklift operation.";

const renderCourseInformationSection = ({
  description = defaultDescription,
  onEdit = vi.fn(),
}: {
  description?: string;
  onEdit?: () => void;
} = {}) => {
  render(
    <CourseInformationSection description={description} onEdit={onEdit} />,
  );

  return { onEdit };
};

describe("CourseInformationSection", () => {
  it("renders the static course description", () => {
    renderCourseInformationSection();

    expect(screen.getByText("courses.detail.information")).toBeVisible();

    expect(screen.getByText(defaultDescription)).toBeVisible();
  });

  it("renders the edit button next to the course information label", () => {
    renderCourseInformationSection();

    const label = screen.getByText("courses.detail.information");

    const editButton = screen.getByRole("button", {
      name: "courses.actions.edit",
    });

    expect(editButton).toBeVisible();
    expect(label.parentElement).toContainElement(editButton);
  });

  it("calls onEdit when the edit button is clicked", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();

    renderCourseInformationSection({ onEdit });

    await user.click(
      screen.getByRole("button", { name: "courses.actions.edit" }),
    );

    expect(onEdit).toHaveBeenCalledTimes(1);
  });
});
