import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "@ui/components/forms/LoginForm";
import { describe, expect, it, vi } from "vitest";

describe("LoginForm", () => {
  it("renders correctly", () => {
    const onSubmit = vi.fn();
    render(<LoginForm onSubmit={onSubmit} />);

    expect(screen.getByText("auth.form.title")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("auth.form.email_placeholder"),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("auth.form.password_placeholder"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "auth.actions.submit" }),
    ).toBeInTheDocument();
  });

  it("shows validation errors when fields are empty", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<LoginForm onSubmit={onSubmit} />);

    const submitButton = screen.getByRole("button", {
      name: "auth.actions.submit",
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("validation:email.invalid")).toBeVisible();
      expect(screen.getByText("validation:password.required")).toBeVisible();
    });
  });

  it("calls onSubmit with correct data when form is valid", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<LoginForm onSubmit={onSubmit} />);

    const emailInput = screen.getByPlaceholderText(
      "auth.form.email_placeholder",
    );
    const passwordInput = screen.getByPlaceholderText(
      "auth.form.password_placeholder",
    );
    const submitButton = screen.getByRole("button", {
      name: "auth.actions.submit",
    });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.click(submitButton);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(
      {
        email: "test@example.com",
        password: "password123",
      },
      expect.anything(),
    );
  });

  it("displays server error message when error prop is provided", () => {
    const onSubmit = vi.fn();
    render(<LoginForm onSubmit={onSubmit} error="Invalid credentials" />);

    expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
  });

  it("toggles password visibility", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<LoginForm onSubmit={onSubmit} />);

    const passwordInput = screen.getByPlaceholderText(
      "auth.form.password_placeholder",
    );
    expect(passwordInput).toHaveAttribute("type", "password");

    const buttons = screen.getAllByRole("button");
    const toggle = buttons.find((btn) => btn.getAttribute("type") === "button");

    if (toggle) {
      await user.click(toggle);
      expect(passwordInput).toHaveAttribute("type", "text");

      await user.click(toggle);
      expect(passwordInput).toHaveAttribute("type", "password");
    }
  });
});
