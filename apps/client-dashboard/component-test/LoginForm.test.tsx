import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm, type LoginFormProps } from "@ui/components/forms/LoginForm";
import { describe, expect, it, vi } from "vitest";

const renderDashboardLoginForm = ({
  onSubmit = vi.fn(),
  error = "",
  isLoading = false,
}: Partial<Pick<LoginFormProps, "onSubmit" | "error" | "isLoading">> = {}) => {
  render(
    <LoginForm
      onSubmit={onSubmit}
      error={error}
      isLoading={isLoading}
      title="Administrator login"
      subtitle="Sign in to manage courses, employees and groups."
      footer="No password recovery is available for administrators yet."
    />,
  );

  return { onSubmit };
};

const getEmailInput = () => screen.getByLabelText("auth.form.email_label");
const getPasswordInput = () =>
  screen.getByPlaceholderText("auth.form.password_placeholder");

describe("LoginForm", () => {
  it("renders the dashboard login form", () => {
    renderDashboardLoginForm();

    expect(
      screen.getByRole("heading", { name: "Administrator login" }),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Sign in to manage courses, employees and groups."),
    ).toBeInTheDocument();

    expect(getEmailInput()).toBeInTheDocument();
    expect(getPasswordInput()).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "auth.actions.submit" }),
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "No password recovery is available for administrators yet.",
      ),
    ).toBeInTheDocument();
  });

  it("shows validation errors when submitted empty", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderDashboardLoginForm();

    await user.click(
      screen.getByRole("button", { name: "auth.actions.submit" }),
    );

    await waitFor(() => {
      expect(screen.getByText("validation:email.invalid")).toBeVisible();
      expect(screen.getByText("validation:password.required")).toBeVisible();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits the entered admin credentials", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderDashboardLoginForm();

    await user.type(getEmailInput(), "admin@example.com");
    await user.type(getPasswordInput(), "admin");
    await user.click(
      screen.getByRole("button", { name: "auth.actions.submit" }),
    );

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(
      {
        email: "admin@example.com",
        password: "admin",
      },
      expect.anything(),
    );
  });

  it("displays dashboard login errors", () => {
    renderDashboardLoginForm({ error: "Invalid administrator credentials" });

    expect(screen.getByText("Invalid administrator credentials")).toBeVisible();
  });

  it("disables form controls and shows the loading label while submitting", () => {
    renderDashboardLoginForm({ isLoading: true });

    expect(getEmailInput()).toBeDisabled();
    expect(getPasswordInput()).toBeDisabled();

    expect(
      screen.getByRole("button", { name: "auth.form.show_password" }),
    ).toBeDisabled();

    expect(
      screen.getByRole("button", { name: "auth.actions.submitting" }),
    ).toBeDisabled();
  });

  it("toggles password visibility", async () => {
    const user = userEvent.setup();

    renderDashboardLoginForm();

    const passwordInput = getPasswordInput();

    expect(passwordInput).toHaveAttribute("type", "password");

    await user.click(
      screen.getByRole("button", { name: "auth.form.show_password" }),
    );

    expect(passwordInput).toHaveAttribute("type", "text");
    expect(
      screen.getByRole("button", { name: "auth.form.hide_password" }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "auth.form.hide_password" }),
    );

    expect(passwordInput).toHaveAttribute("type", "password");
  });
});
