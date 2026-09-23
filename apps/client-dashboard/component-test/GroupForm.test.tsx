import type { ComponentProps } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import GroupForm from "../src/components/groups/GroupForm";
import {
  getGroupFormDefaultValues,
  type GroupFormValues,
} from "../src/components/groups/groupFormValues";
import { mockUsers } from "./fixtures/employees";

const defaultValues: GroupFormValues = getGroupFormDefaultValues();

const renderGroupForm = (
  props: Partial<ComponentProps<typeof GroupForm>> = {},
) => {
  const onCancel = vi.fn();
  const onSubmit = vi.fn();

  render(
    <GroupForm
      users={mockUsers}
      defaultValues={defaultValues}
      submitLabel="common.actions.save"
      onCancel={onCancel}
      onSubmit={onSubmit}
      {...props}
    />,
  );

  return { onCancel, onSubmit };
};

describe("GroupForm", () => {
  it("renders the group name field, employees table, and actions", () => {
    renderGroupForm();

    expect(screen.getByLabelText("groups.form.name_label")).toHaveValue("");
    expect(
      screen.getByRole("searchbox", {
        name: "groups.form.search_placeholder",
      }),
    ).toBeVisible();

    expect(screen.getByText("John")).toBeVisible();
    expect(screen.getByText("Jane")).toBeVisible();

    expect(
      screen.getByRole("button", { name: "common.actions.cancel" }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "common.actions.save" }),
    ).toBeVisible();
  });

  it("renders default values when provided", () => {
    renderGroupForm({
      defaultValues: getGroupFormDefaultValues({
        name: "Managers",
        userIds: ["user-2"],
      }),
    });

    expect(screen.getByLabelText("groups.form.name_label")).toHaveValue(
      "Managers",
    );

    const checkboxes = screen.getAllByRole("checkbox");

    expect(checkboxes[0]).not.toBeChecked();
    expect(checkboxes[1]).toBeChecked();
  });

  it("calls onCancel when cancel is clicked", async () => {
    const user = userEvent.setup();
    const { onCancel } = renderGroupForm();

    await user.click(
      screen.getByRole("button", { name: "common.actions.cancel" }),
    );

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("shows inline required error when submitted without a group name", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderGroupForm();

    await user.click(
      screen.getByRole("button", { name: "common.actions.save" }),
    );

    expect(await screen.findByText("groups.form.name_label")).toBeVisible();

    expect(screen.getByLabelText("groups.form.name_label")).toHaveAttribute(
      "aria-invalid",
      "true",
    );

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits with an empty employee selection", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderGroupForm();

    await user.type(screen.getByLabelText("groups.form.name_label"), "HR");
    await user.click(
      screen.getByRole("button", { name: "common.actions.save" }),
    );

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: "HR",
        userIds: [],
      });
    });
  });

  it("submits selected employee ids", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderGroupForm();

    await user.type(
      screen.getByLabelText("groups.form.name_label"),
      "Managers",
    );

    await user.click(screen.getAllByRole("checkbox")[0]);
    await user.click(screen.getAllByRole("checkbox")[1]);

    await user.click(
      screen.getByRole("button", { name: "common.actions.save" }),
    );

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: "Managers",
        userIds: ["user-1", "user-2"],
      });
    });
  });

  it("does not submit when Enter is pressed in the search field", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderGroupForm();

    await user.type(
      screen.getByRole("searchbox", {
        name: "groups.form.search_placeholder",
      }),
      "Jane{Enter}",
    );

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("removes an employee id when a selected employee is unchecked", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderGroupForm({
      defaultValues: getGroupFormDefaultValues({
        name: "Managers",
        userIds: ["user-1", "user-2"],
      }),
    });

    await user.click(screen.getAllByRole("checkbox")[0]);
    await user.click(
      screen.getByRole("button", { name: "common.actions.save" }),
    );

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: "Managers",
        userIds: ["user-2"],
      });
    });
  });
});
