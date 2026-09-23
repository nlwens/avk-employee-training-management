import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { Group } from "@api/src";
import CourseGroupsSection from "../src/components/courses/CourseGroupsSection";

const mockGroups: Group[] = [
  { id: "group-a", name: "Group A" },
  { id: "group-b", name: "Group B" },
  { id: "group-c", name: "Group C" },
];

const renderCourseGroupsSection = ({
  groups = mockGroups,
  selectedGroupIds = [],
  isSaving = false,
  onSave = vi.fn(),
  onCancel = vi.fn(),
}: {
  groups?: Group[];
  selectedGroupIds?: string[];
  isSaving?: boolean;
  onSave?: (selectedGroupIds: string[]) => void;
  onCancel?: () => void;
} = {}) => {
  render(
    <CourseGroupsSection
      groups={groups}
      selectedGroupIds={selectedGroupIds}
      isSaving={isSaving}
      onSave={onSave}
      onCancel={onCancel}
    />,
  );

  return { onSave, onCancel };
};

describe("CourseGroupsSection", () => {
  it("renders the groups heading and assignment label", () => {
    renderCourseGroupsSection();

    expect(screen.getByText("navigation.links.groups")).toBeVisible();
    expect(screen.getByText("courses.groups.assign_heading")).toBeVisible();
  });

  it("explains that a course with no groups is accessible to everyone", () => {
    renderCourseGroupsSection();

    expect(screen.getByText("courses.groups.public_description")).toBeVisible();
  });

  it("renders a checkbox for each available group", () => {
    renderCourseGroupsSection();

    expect(screen.getByRole("checkbox", { name: "Group A" })).toBeVisible();
    expect(screen.getByRole("checkbox", { name: "Group B" })).toBeVisible();
    expect(screen.getByRole("checkbox", { name: "Group C" })).toBeVisible();
  });

  it("renders save and cancel buttons", () => {
    renderCourseGroupsSection();

    expect(
      screen.getByRole("button", { name: "common.actions.save" }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "common.actions.cancel" }),
    ).toBeVisible();
  });

  it("toggles group selection when a checkbox is clicked", async () => {
    const user = userEvent.setup();

    renderCourseGroupsSection();

    const groupACheckbox = screen.getByRole("checkbox", { name: "Group A" });

    expect(groupACheckbox).not.toBeChecked();

    await user.click(groupACheckbox);
    expect(groupACheckbox).toBeChecked();

    await user.click(groupACheckbox);
    expect(groupACheckbox).not.toBeChecked();
  });

  it("calls onSave with the current selection when save is clicked", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    renderCourseGroupsSection({ onSave });

    await user.click(screen.getByRole("checkbox", { name: "Group A" }));
    await user.click(screen.getByRole("checkbox", { name: "Group C" }));
    await user.click(
      screen.getByRole("button", { name: "common.actions.save" }),
    );

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(["group-a", "group-c"]);
  });

  it("disables save and cancel while saving", () => {
    renderCourseGroupsSection({ isSaving: true });

    expect(
      screen.getByRole("button", { name: "common.actions.saving" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "common.actions.cancel" }),
    ).toBeDisabled();
  });

  it("calls onCancel when cancel is clicked", async () => {
    const user = userEvent.setup();
    const { onCancel } = renderCourseGroupsSection();

    await user.click(
      screen.getByRole("button", { name: "common.actions.cancel" }),
    );

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
