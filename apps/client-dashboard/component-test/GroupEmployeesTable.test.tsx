import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import GroupEmployeesTable from "../src/components/groups/GroupEmployeesTable";
import { mockUsersForGroupTable as mockUsers } from "./fixtures/employees";

describe("GroupEmployeesTable", () => {
  it("renders employee data", () => {
    render(
      <GroupEmployeesTable
        users={mockUsers}
        selectedUserIds={[]}
        onSelectionChange={vi.fn()}
      />,
    );

    expect(screen.getByText("John")).toBeVisible();
    expect(screen.getByText("Doe")).toBeVisible();
    expect(screen.getByText("john.doe@example.com")).toBeVisible();
    expect(screen.getByText("Group A")).toBeVisible();

    expect(screen.getByText("Jane")).toBeVisible();
    expect(screen.getByText("Lee")).toBeVisible();
    expect(screen.getByText("jane.lee@example.com")).toBeVisible();
    expect(screen.getByText("Group B, Group C")).toBeVisible();
  });

  it("checks employees that are already selected", () => {
    render(
      <GroupEmployeesTable
        users={mockUsers}
        selectedUserIds={["user-2"]}
        onSelectionChange={vi.fn()}
      />,
    );

    const checkboxes = screen.getAllByRole("checkbox");

    expect(checkboxes[0]).not.toBeChecked();
    expect(checkboxes[1]).toBeChecked();
  });

  it("calls onSelectionChange when an employee is selected", async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();

    render(
      <GroupEmployeesTable
        users={mockUsers}
        selectedUserIds={[]}
        onSelectionChange={onSelectionChange}
      />,
    );

    await user.click(screen.getAllByRole("checkbox")[0]);

    expect(onSelectionChange).toHaveBeenCalledWith("user-1", true);
  });

  it("calls onSelectionChange when an employee is unselected", async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();

    render(
      <GroupEmployeesTable
        users={mockUsers}
        selectedUserIds={["user-1"]}
        onSelectionChange={onSelectionChange}
      />,
    );

    await user.click(screen.getAllByRole("checkbox")[0]);

    expect(onSelectionChange).toHaveBeenCalledWith("user-1", false);
  });

  it("shows empty state when no users are provided", () => {
    render(
      <GroupEmployeesTable
        users={[]}
        selectedUserIds={[]}
        onSelectionChange={vi.fn()}
      />,
    );

    expect(screen.getByText("employees.table.none_found")).toBeVisible();
  });
});
