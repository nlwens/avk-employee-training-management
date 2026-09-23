import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { UserActivationForm } from "../src/components/user-activation/UserActivationForm";

describe("UserActivationForm", () => {
  it("renders the password fields and submit button", () => {
    const onSubmit = vi.fn();

    render(<UserActivationForm onSubmit={onSubmit} />);

    expect(screen.getByText("auth.form.password_label")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("auth.form.password_placeholder"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("auth.form.confirm_password_label"),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("auth.form.confirm_password_placeholder"),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "auth.activation.actions.submit" }),
    ).toBeInTheDocument();
  });

  it("shows validation errors when required fields are empty", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(<UserActivationForm onSubmit={onSubmit} />);

    await user.click(
      screen.getByRole("button", { name: "auth.activation.actions.submit" }),
    );

    await waitFor(() => {
      expect(screen.getByText("validation:password.required")).toBeVisible();
      expect(
        screen.getByText("validation:confirm_password.required"),
      ).toBeVisible();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows an error when the confirmation password does not match", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(<UserActivationForm onSubmit={onSubmit} />);

    await user.type(
      screen.getByPlaceholderText("auth.form.password_placeholder"),
      "password123",
    );
    await user.type(
      screen.getByPlaceholderText("auth.form.confirm_password_placeholder"),
      "password456",
    );

    await user.click(
      screen.getByRole("button", { name: "auth.activation.actions.submit" }),
    );

    await waitFor(() => {
      expect(
        screen.getByText("validation:confirm_password.match"),
      ).toBeVisible();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("calls onSubmit when the form is valid", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(<UserActivationForm onSubmit={onSubmit} />);

    await user.type(
      screen.getByPlaceholderText("auth.form.password_placeholder"),
      "password123",
    );
    await user.type(
      screen.getByPlaceholderText("auth.form.confirm_password_placeholder"),
      "password123",
    );

    await user.click(
      screen.getByRole("button", { name: "auth.activation.actions.submit" }),
    );

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    expect(onSubmit).toHaveBeenCalledWith(
      {
        password: "password123",
        confirmPassword: "password123",
      },
      expect.anything(),
    );
  });
});
