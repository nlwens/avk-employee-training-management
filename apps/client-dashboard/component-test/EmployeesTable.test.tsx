import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { mockT } from "./setup";

import EmployeesTable from "../src/components/employees/EmployeesTable";
import { mockUsers } from "./fixtures/employees";

describe("EmployeesTable", () => {
  it("renders user data in the table", () => {
    render(<EmployeesTable users={mockUsers} />);

    expect(screen.getByText("John")).toBeVisible();
    expect(screen.getByText("Doe")).toBeVisible();
    expect(screen.getByText("john.doe@example.com")).toBeVisible();
    expect(screen.getByText("Group A")).toBeVisible();
    expect(screen.getByText("employees.table.created_at")).toBeVisible();

    expect(screen.getByText("Jane")).toBeVisible();
    expect(screen.getByText("Lee")).toBeVisible();
    expect(screen.getByText("jane.lee@example.com")).toBeVisible();
    expect(screen.getByText("Group B")).toBeVisible();
  });

  it("sorts users by name A-Z when the name column header is clicked", async () => {
    const user = userEvent.setup();

    render(<EmployeesTable users={mockUsers} />);

    await user.click(
      screen.getByRole("button", { name: "employees.table.name" }),
    );

    const rows = screen.getAllByRole("row").slice(1);
    expect(rows[0]).toHaveTextContent("Jane");
    expect(rows[1]).toHaveTextContent("John");
  });

  it("sorts users by name Z-A when the name column header is clicked twice", async () => {
    const user = userEvent.setup();

    render(<EmployeesTable users={mockUsers} />);

    const nameHeader = screen.getByRole("button", {
      name: "employees.table.name",
    });
    await user.click(nameHeader);
    await user.click(nameHeader);

    const rows = screen.getAllByRole("row").slice(1);
    expect(rows[0]).toHaveTextContent("John");
    expect(rows[1]).toHaveTextContent("Jane");
  });

  it("sorts users by created date newest first when the created column header is clicked twice", async () => {
    const user = userEvent.setup();

    render(<EmployeesTable users={mockUsers} />);

    const createdHeader = screen.getByRole("button", {
      name: "employees.table.created_at",
    });
    await user.click(createdHeader);
    await user.click(createdHeader);

    const rows = screen.getAllByRole("row").slice(1);
    expect(rows[0]).toHaveTextContent("John");
    expect(rows[1]).toHaveTextContent("Jane");
  });

  it("renders one data row per user", () => {
    render(<EmployeesTable users={mockUsers} />);

    expect(screen.getAllByRole("row")).toHaveLength(mockUsers.length + 1);
  });

  it("shows empty state when no users are provided", () => {
    render(<EmployeesTable users={[]} />);

    expect(screen.getByText("employees.table.none_found")).toBeVisible();
  });

  it("renders an edit button for each user", () => {
    render(<EmployeesTable users={mockUsers} />);

    expect(
      screen.getAllByRole("button", { name: "employees.actions.edit" }),
    ).toHaveLength(mockUsers.length);

    expect(mockT).toHaveBeenCalledWith(expect.any(Function), {
      name: "John",
      surname: "Doe",
    });
    expect(mockT).toHaveBeenCalledWith(expect.any(Function), {
      name: "Jane",
      surname: "Lee",
    });
  });

  it("calls onEdit with the selected user id", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();

    render(<EmployeesTable users={mockUsers} onEdit={onEdit} />);

    await user.click(
      screen.getAllByRole("button", {
        name: "employees.actions.edit",
      })[1],
    );

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledWith("user-2");
  });

  it("uses pointer cursor on edit buttons", () => {
    render(<EmployeesTable users={mockUsers} />);

    expect(
      screen.getAllByRole("button", {
        name: "employees.actions.edit",
      })[0],
    ).toHaveClass("cursor-pointer");
  });

  it("renders a view details button for each user", () => {
    render(<EmployeesTable users={mockUsers} />);

    expect(
      screen.getAllByRole("button", { name: "employees.actions.view_details" }),
    ).toHaveLength(mockUsers.length);

    expect(mockT).toHaveBeenCalledWith(expect.any(Function), {
      name: "John",
      surname: "Doe",
    });
    expect(mockT).toHaveBeenCalledWith(expect.any(Function), {
      name: "Jane",
      surname: "Lee",
    });
  });

  it("calls onViewDetails with the selected user id", async () => {
    const user = userEvent.setup();
    const onViewDetails = vi.fn();

    render(<EmployeesTable users={mockUsers} onViewDetails={onViewDetails} />);

    await user.click(
      screen.getAllByRole("button", {
        name: "employees.actions.view_details",
      })[0],
    );

    expect(onViewDetails).toHaveBeenCalledTimes(1);
    expect(onViewDetails).toHaveBeenCalledWith("user-1");
  });
});
