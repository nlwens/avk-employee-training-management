import type { ComponentProps } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import EmployeeAccountForm from "../src/components/employees/EmployeeAccountForm";
import type { Group } from "@api/src";

const groups: Group[] = [
  { id: "group-a", name: "Group A" },
  { id: "group-b", name: "Group B" },
];

const openGroupsCombobox = async (user: ReturnType<typeof userEvent.setup>) => {
  // The groups combobox is a complex component. The real label points to a
  // hidden input used for holding the actual values; the combobox has none.
  await user.click(screen.getByRole("combobox", { name: "" }));
};

const closeGroupsCombobox = async (
  user: ReturnType<typeof userEvent.setup>,
) => {
  await user.keyboard("{Escape}");
};

const selectGroup = async (
  user: ReturnType<typeof userEvent.setup>,
  groupName: string,
) => {
  await openGroupsCombobox(user);
  await user.click(screen.getByRole("option", { name: groupName }));
  await closeGroupsCombobox(user);
};

const renderEmployeeAccountForm = (
  props: Partial<ComponentProps<typeof EmployeeAccountForm>> = {},
) => {
  const onCancel = vi.fn();
  const onSubmit = vi.fn();

  render(
    <EmployeeAccountForm
      groups={groups}
      onCancel={onCancel}
      onSubmit={onSubmit}
      {...props}
    />,
  );

  return { onCancel, onSubmit };
};

describe("EmployeeAccountForm", () => {
  it("renders the employee account fields and actions", () => {
    renderEmployeeAccountForm();

    expect(
      screen.getByPlaceholderText("employees.form.name_placeholder"),
    ).toBeVisible();
    expect(
      screen.getByPlaceholderText("employees.form.surname_placeholder"),
    ).toBeVisible();
    expect(
      screen.getByPlaceholderText("employees.form.email_placeholder"),
    ).toBeVisible();

    expect(
      screen.getByRole("combobox", { name: "employees.form.locale_label" }),
    ).toHaveTextContent("Nederlands");

    expect(
      screen.getByPlaceholderText("employees.form.search_groups_placeholder"),
    ).toBeVisible();
    expect(
      screen.getByRole("checkbox", { name: "employees.form.is_administrator" }),
    ).toBeVisible();

    expect(
      screen.getByRole("button", { name: "common.actions.cancel" }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "common.actions.save" }),
    ).toBeVisible();
  });

  it("disables save button and shows loading label while submitting", () => {
    renderEmployeeAccountForm({ isSubmitting: true });

    expect(
      screen.getByRole("button", { name: "common.actions.saving" }),
    ).toBeDisabled();
  });

  it("calls onCancel when the cancel button is clicked", async () => {
    const user = userEvent.setup();
    const { onCancel } = renderEmployeeAccountForm();

    await user.click(
      screen.getByRole("button", { name: "common.actions.cancel" }),
    );

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("shows validation errors when required fields are missing", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderEmployeeAccountForm();

    await user.click(
      screen.getByRole("button", { name: "common.actions.save" }),
    );

    expect(await screen.findByText("validation:name.required")).toBeVisible();
    expect(screen.getByText("validation:surname.required")).toBeVisible();
    expect(screen.getByText("validation:email.required")).toBeVisible();

    expect(
      screen.queryByText("validation:group.required"),
    ).not.toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits entered values", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderEmployeeAccountForm();

    await user.type(
      screen.getByPlaceholderText("employees.form.name_placeholder"),
      "John",
    );
    await user.type(
      screen.getByPlaceholderText("employees.form.surname_placeholder"),
      "Doe",
    );
    await user.type(
      screen.getByPlaceholderText("employees.form.email_placeholder"),
      "john.doe@example.com",
    );

    await selectGroup(user, "Group A");
    await selectGroup(user, "Group B");
    await user.click(
      screen.getByRole("checkbox", { name: "employees.form.is_administrator" }),
    );

    await user.click(
      screen.getByRole("button", { name: "common.actions.save" }),
    );

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    expect(onSubmit).toHaveBeenCalledWith(
      {
        name: "John",
        surname: "Doe",
        email: "john.doe@example.com",
        groups: ["group-a", "group-b"],
        admin: true,
        locale: "nl",
      },
      expect.anything(),
    );
  });

  it("renders edit mode with default values, optional password, and delete action", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();

    renderEmployeeAccountForm({
      defaultValues: {
        name: "John",
        surname: "Doe",
        email: "john.doe@example.com",
        password: "",
        groups: ["group-a"],
        admin: true,
      },
      showDeleteButton: true,
      onDelete,
    });

    expect(
      screen.getByPlaceholderText("employees.form.name_placeholder"),
    ).toHaveValue("John");
    expect(
      screen.getByPlaceholderText("employees.form.surname_placeholder"),
    ).toHaveValue("Doe");
    expect(
      screen.getByPlaceholderText("employees.form.email_placeholder"),
    ).toHaveValue("john.doe@example.com");
    expect(
      screen.getByPlaceholderText("employees.form.password_placeholder"),
    ).toHaveValue("");

    expect(screen.getByText("Group A")).toBeVisible();
    expect(screen.queryByText("Group B")).not.toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: "employees.form.is_administrator" }),
    ).toBeChecked();

    await user.click(
      screen.getByRole("button", {
        name: "employees.form.actions.delete_user",
      }),
    );

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("submits edit values with an empty password", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderEmployeeAccountForm({
      defaultValues: {
        name: "John",
        surname: "Doe",
        email: "john.doe@example.com",
        password: "",
        groups: ["group-a"],
        admin: false,
      },
    });

    await user.clear(
      screen.getByPlaceholderText("employees.form.name_placeholder"),
    );
    await user.type(
      screen.getByPlaceholderText("employees.form.name_placeholder"),
      "Johnny",
    );
    await selectGroup(user, "Group B");
    await user.click(
      screen.getByRole("button", { name: "common.actions.save" }),
    );

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    expect(onSubmit).toHaveBeenCalledWith(
      {
        name: "Johnny",
        surname: "Doe",
        email: "john.doe@example.com",
        password: "",
        groups: ["group-a", "group-b"],
        admin: false,
      },
      expect.anything(),
    );
  });

  it("submits edit values with a changed password", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderEmployeeAccountForm({
      defaultValues: {
        name: "John",
        surname: "Doe",
        email: "john.doe@example.com",
        password: "",
        groups: ["group-a"],
        admin: false,
      },
    });

    await user.type(
      screen.getByPlaceholderText("employees.form.password_placeholder"),
      "newpassword123",
    );

    await user.click(
      screen.getByRole("button", { name: "common.actions.save" }),
    );

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    expect(onSubmit).toHaveBeenCalledWith(
      {
        name: "John",
        surname: "Doe",
        email: "john.doe@example.com",
        password: "newpassword123",
        groups: ["group-a"],
        admin: false,
      },
      expect.anything(),
    );
  });
});
