import type { ComponentProps } from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

import ChapterForm from "../src/components/chapters/ChapterForm";
import type { ChapterFormValues } from "@ui/components/forms/validators";

const defaultValues: ChapterFormValues = {
  id: "chapter-1",
  order: 0,
  translations: {
    en: { title: "Introduction" },
    nl: { title: "Inleiding" },
  },
  contentBlocks: [
    {
      id: "content-1",
      type: "text",
      order: 0,
      translations: {
        en: { content: "English text", file: null },
        nl: { content: "Nederlandse tekst", file: null },
      },
    },
  ],
};

const renderChapterForm = (
  props: Partial<ComponentProps<typeof ChapterForm>> = {},
) => {
  const onSubmit = vi.fn();

  render(
    <MemoryRouter>
      <ChapterForm initialData={defaultValues} onSubmit={onSubmit} {...props} />
    </MemoryRouter>,
  );

  return { onSubmit };
};

describe("ChapterForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the chapter form with title input and language switch", () => {
    renderChapterForm();

    expect(screen.getByDisplayValue("Introduction")).toBeInTheDocument();

    const languageSwitch = screen.getByRole("switch", {
      name: "courses.form.toggle_language",
    });
    expect(languageSwitch).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "common.actions.save" }),
    ).toBeInTheDocument();
  });

  it("renders initial English chapter content by default", () => {
    renderChapterForm();

    expect(screen.getByText("chapters.form.content_label")).toBeInTheDocument();
    expect(
      screen.getAllByLabelText("chapters.actions.drag_content"),
    ).toHaveLength(1);
    expect(screen.getByDisplayValue("English text")).toBeInTheDocument();
  });

  it("switches to Dutch content when the language switch is clicked", async () => {
    const user = userEvent.setup();
    renderChapterForm();

    const languageSwitch = screen.getByRole("switch", {
      name: "courses.form.toggle_language",
    });

    await user.click(languageSwitch);

    expect(screen.getByDisplayValue("Inleiding")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Nederlandse tekst")).toBeInTheDocument();
  });

  it("adds a content block when the add menu is used", async () => {
    const user = userEvent.setup();
    renderChapterForm();

    expect(
      screen.getAllByLabelText("chapters.actions.drag_content"),
    ).toHaveLength(1);

    await user.click(
      screen.getByRole("button", { name: "common.actions.add" }),
    );
    await user.click(
      screen.getByRole("button", {
        name: "chapters.content_types.text",
      }),
    );

    await waitFor(() => {
      expect(
        screen.getAllByLabelText("chapters.actions.drag_content"),
      ).toHaveLength(2);
    });
  });

  it("removes a content block when delete is clicked", async () => {
    const user = userEvent.setup();
    renderChapterForm();

    await user.click(
      screen.getByRole("button", { name: "chapters.actions.delete_content" }),
    );

    await waitFor(() => {
      expect(
        screen.queryAllByLabelText("chapters.actions.drag_content"),
      ).toHaveLength(0);
    });
  });

  it("submits form values when save is clicked", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderChapterForm();

    await user.click(
      screen.getByRole("button", { name: "common.actions.save" }),
    );

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    const submittedData = onSubmit.mock.calls[0]?.[0] as ChapterFormValues;
    expect(submittedData.id).toBe("chapter-1");
    expect(submittedData.translations.en.title).toBe("Introduction");
    expect(submittedData.translations.nl.title).toBe("Inleiding");
  });

  it("submits when only one chapter title language is filled", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderChapterForm({
      initialData: {
        ...defaultValues,
        translations: {
          en: { title: "English only" },
          nl: { title: "" },
        },
      },
    });

    await user.click(
      screen.getByRole("button", { name: "common.actions.save" }),
    );

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    const submittedData = onSubmit.mock.calls[0]?.[0] as ChapterFormValues;
    expect(submittedData.translations.en.title).toBe("English only");
    expect(submittedData.translations.nl.title).toBe("");
  });

  it("does not call onDelete when the delete dialog cancel button is clicked", () => {
    const onDelete = vi.fn();
    renderChapterForm({ onDelete });

    fireEvent.click(
      screen.getByRole("button", { name: "courses.actions.delete" }),
    );

    const dialog = screen
      .getByText("chapters.confirm.delete.title")
      .closest(".fixed") as HTMLElement;
    fireEvent.click(
      within(dialog).getByRole("button", { name: "courses.actions.cancel" }),
    );

    expect(onDelete).not.toHaveBeenCalled();
  });

  it("calls onDelete when deletion is confirmed in the centered dialog", () => {
    const onDelete = vi.fn();
    renderChapterForm({ onDelete });

    fireEvent.click(
      screen.getByRole("button", { name: "courses.actions.delete" }),
    );

    fireEvent.change(screen.getByPlaceholderText("delete"), {
      target: { value: "delete" },
    });

    const dialog = screen
      .getByText("chapters.confirm.delete.title")
      .closest(".fixed") as HTMLElement;
    fireEvent.click(
      within(dialog).getByRole("button", { name: "courses.actions.delete" }),
    );

    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
