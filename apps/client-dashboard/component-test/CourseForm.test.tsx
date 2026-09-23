import type { ComponentProps } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  COURSE_PRIORITY,
  getCourseFormDefaultValues,
  type CourseFormValues,
} from "../src/components/courses/courseFormValues";
import CourseForm from "../src/components/courses/CourseForm";
const defaultValues: CourseFormValues = getCourseFormDefaultValues({
  en: {
    localeCode: "en",
    title: "English course title",
    description: "English course description.",
  },
  nl: {
    localeCode: "nl",
    title: "",
    description: "",
  },
});

const translatedValues: CourseFormValues = getCourseFormDefaultValues({
  en: {
    localeCode: "en",
    title: "Fire safety",
    description: "English fire safety description.",
  },
  nl: {
    localeCode: "nl",
    title: "Brandveiligheid",
    description: "Nederlandse beschrijving over brandveiligheid.",
  },
});

const renderCourseForm = (
  props: Partial<ComponentProps<typeof CourseForm>> = {},
) => {
  const onCancel = vi.fn();
  const onSubmit = vi.fn();

  render(
    <CourseForm
      defaultValues={defaultValues}
      submitLabel="save"
      onCancel={onCancel}
      onSubmit={onSubmit}
      {...props}
    />,
  );

  return { onCancel, onSubmit };
};

describe("CourseForm", () => {
  it("renders the English course values by default", () => {
    renderCourseForm();

    const languageToggle = screen.getByRole("switch", {
      name: "courses.form.toggle_language",
    });

    expect(languageToggle).toHaveTextContent("EN");

    expect(screen.getByLabelText("courses.form.title")).toHaveValue(
      "English course title",
    );

    expect(screen.getByLabelText("courses.form.description")).toHaveValue(
      "English course description.",
    );

    expect(
      screen.getByRole("button", { name: "courses.actions.cancel" }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "save" })).toBeVisible();
  });

  it("shows empty Dutch fields when Dutch content has not been added yet", () => {
    renderCourseForm();

    const languageToggle = screen.getByRole("switch", {
      name: "courses.form.toggle_language",
    });

    fireEvent.click(languageToggle);

    expect(languageToggle).toHaveTextContent("NL");
    expect(screen.getByLabelText("courses.form.title")).toHaveValue("");
    expect(screen.getByLabelText("courses.form.description")).toHaveValue("");
  });

  it("switches between Dutch and English content without clearing values", () => {
    renderCourseForm();

    const languageToggle = screen.getByRole("switch", {
      name: "courses.form.toggle_language",
    });

    fireEvent.click(languageToggle);

    fireEvent.change(screen.getByLabelText("courses.form.title"), {
      target: { value: "Nieuwe Nederlandse titel" },
    });

    fireEvent.change(screen.getByLabelText("courses.form.description"), {
      target: { value: "Nieuwe Nederlandse beschrijving." },
    });

    fireEvent.click(languageToggle);

    expect(languageToggle).toHaveTextContent("EN");
    expect(screen.getByLabelText("courses.form.title")).toHaveValue(
      "English course title",
    );
    expect(screen.getByLabelText("courses.form.description")).toHaveValue(
      "English course description.",
    );

    fireEvent.click(languageToggle);

    expect(languageToggle).toHaveTextContent("NL");
    expect(screen.getByLabelText("courses.form.title")).toHaveValue(
      "Nieuwe Nederlandse titel",
    );
    expect(screen.getByLabelText("courses.form.description")).toHaveValue(
      "Nieuwe Nederlandse beschrijving.",
    );
  });

  it("renders existing Dutch values when they are available", () => {
    renderCourseForm({
      defaultValues: translatedValues,
    });

    const languageToggle = screen.getByRole("switch", {
      name: "courses.form.toggle_language",
    });

    fireEvent.click(languageToggle);

    expect(screen.getByLabelText("courses.form.title")).toHaveValue(
      "Brandveiligheid",
    );

    expect(screen.getByLabelText("courses.form.description")).toHaveValue(
      "Nederlandse beschrijving over brandveiligheid.",
    );
  });

  it("calls onCancel when the cancel button is clicked", () => {
    const { onCancel } = renderCourseForm();

    fireEvent.click(
      screen.getByRole("button", { name: "courses.actions.cancel" }),
    );

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("reflects the existing priority from the provided default values", () => {
    renderCourseForm({
      defaultValues: getCourseFormDefaultValues(
        undefined,
        COURSE_PRIORITY.high,
      ),
    });

    expect(
      screen.getByRole("combobox", { name: "courses.form.priority" }),
    ).toHaveTextContent("courses.form.priority_options.high");
  });

  it("submits the selected priority as its numeric value", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderCourseForm({ defaultValues: translatedValues });

    await user.click(
      screen.getByRole("combobox", { name: "courses.form.priority" }),
    );
    await user.click(
      screen.getByRole("option", {
        name: "courses.form.priority_options.high",
      }),
    );

    await user.click(screen.getByRole("button", { name: "save" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ priority: COURSE_PRIORITY.high }),
      );
    });
  });

  it("shows a required title error when submitted without a title", async () => {
    renderCourseForm({
      defaultValues: getCourseFormDefaultValues(),
    });

    fireEvent.click(screen.getByRole("button", { name: "save" }));

    expect(
      await screen.findByText("validation:course_title.required"),
    ).toBeVisible();

    expect(screen.getByLabelText("courses.form.title")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });
});
