import type { ComponentProps } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

import ChangePasswordForm from "@ui/components/forms/ChangePasswordForm";

const renderChangePasswordForm = (
  props: Partial<ComponentProps<typeof ChangePasswordForm>> = {},
) => {
  const onSubmit = vi.fn();

  render(
    <MemoryRouter>
      <ChangePasswordForm onSubmit={onSubmit} {...props} />
    </MemoryRouter>,
  );

  return { onSubmit };
};

describe("ChangePasswordForm", () => {
  it("renders the password fields and actions", () => {
    renderChangePasswordForm();

    expect(
      screen.getByPlaceholderText("auth.form.current_password_placeholder"),
    ).toBeVisible();
    expect(
      screen.getByPlaceholderText("auth.form.password_placeholder"),
    ).toBeVisible();
    expect(
      screen.getByPlaceholderText("auth.form.confirm_password_placeholder"),
    ).toBeVisible();

    expect(
      screen.getByRole("link", { name: "auth.actions.cancel" }),
    ).toHaveAttribute("href", "/");
    expect(
      screen.getByRole("button", { name: "auth.actions.save" }),
    ).toBeVisible();
  });

  it("shows the loading label while submitting", () => {
    renderChangePasswordForm({ isLoading: true });

    expect(
      screen.getByRole("button", { name: "auth.actions.saving" }),
    ).toBeVisible();
  });

  it("toggles visibility for each password field independently", async () => {
    const user = userEvent.setup();
    renderChangePasswordForm();

    const currentInput = screen.getByPlaceholderText(
      "auth.form.current_password_placeholder",
    );
    const newInput = screen.getByPlaceholderText(
      "auth.form.password_placeholder",
    );
    const confirmInput = screen.getByPlaceholderText(
      "auth.form.confirm_password_placeholder",
    );

    expect(currentInput).toHaveAttribute("type", "password");
    expect(newInput).toHaveAttribute("type", "password");
    expect(confirmInput).toHaveAttribute("type", "password");

    const [showCurrent, showNew, showConfirm] = screen.getAllByRole("button", {
      name: "auth.form.show_password",
    });

    await user.click(showCurrent);
    expect(currentInput).toHaveAttribute("type", "text");
    expect(newInput).toHaveAttribute("type", "password");

    await user.click(showNew);
    expect(newInput).toHaveAttribute("type", "text");

    await user.click(showConfirm);
    expect(confirmInput).toHaveAttribute("type", "text");

    await user.click(
      screen.getAllByRole("button", { name: "auth.form.hide_password" })[0],
    );
    expect(currentInput).toHaveAttribute("type", "password");
    expect(newInput).toHaveAttribute("type", "text");
    expect(confirmInput).toHaveAttribute("type", "text");
  });

  it("shows validation errors when required fields are missing", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderChangePasswordForm();

    await user.click(screen.getByRole("button", { name: "auth.actions.save" }));

    expect(
      await screen.findByText("validation:current_password.required"),
    ).toBeVisible();
    expect(screen.getByText("validation:password.required")).toBeVisible();
    expect(
      screen.getByText("validation:confirm_password.required"),
    ).toBeVisible();

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows a minimum length error when the new password is too short", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderChangePasswordForm();

    await user.type(
      screen.getByPlaceholderText("auth.form.current_password_placeholder"),
      "CurrentPassword123!",
    );
    await user.type(
      screen.getByPlaceholderText("auth.form.password_placeholder"),
      "short",
    );
    await user.type(
      screen.getByPlaceholderText("auth.form.confirm_password_placeholder"),
      "short",
    );

    await user.click(screen.getByRole("button", { name: "auth.actions.save" }));

    expect(
      await screen.findByText("validation:password.min_length"),
    ).toBeVisible();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows a mismatch error when the new passwords don't match", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderChangePasswordForm();

    await user.type(
      screen.getByPlaceholderText("auth.form.current_password_placeholder"),
      "CurrentPassword123!",
    );
    await user.type(
      screen.getByPlaceholderText("auth.form.password_placeholder"),
      "NewPassword123!",
    );
    await user.type(
      screen.getByPlaceholderText("auth.form.confirm_password_placeholder"),
      "SomethingElse123!",
    );

    await user.click(screen.getByRole("button", { name: "auth.actions.save" }));

    expect(
      await screen.findByText("validation:confirm_password.match"),
    ).toBeVisible();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("calls onSubmit with the entered values when the form is valid", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderChangePasswordForm();

    await user.type(
      screen.getByPlaceholderText("auth.form.current_password_placeholder"),
      "CurrentPassword123!",
    );
    await user.type(
      screen.getByPlaceholderText("auth.form.password_placeholder"),
      "NewPassword123!",
    );
    await user.type(
      screen.getByPlaceholderText("auth.form.confirm_password_placeholder"),
      "NewPassword123!",
    );

    await user.click(screen.getByRole("button", { name: "auth.actions.save" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    expect(onSubmit).toHaveBeenCalledWith(
      {
        currentPassword: "CurrentPassword123!",
        password: "NewPassword123!",
        confirmPassword: "NewPassword123!",
      },
      expect.anything(),
    );
  });
});
