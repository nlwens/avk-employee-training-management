import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import ChapterContentMenu from "../src/components/chapters/ChapterContentMenu";

describe("ChapterContentMenu", () => {
  it("renders the add button", () => {
    const handleSelect = vi.fn();
    render(<ChapterContentMenu onSelect={handleSelect} />);

    expect(
      screen.getByRole("button", { name: "common.actions.add" }),
    ).toBeVisible();
  });

  it("opens popover when button is clicked", async () => {
    const handleSelect = vi.fn();
    const user = userEvent.setup();

    render(<ChapterContentMenu onSelect={handleSelect} />);

    const button = screen.getByRole("button", { name: "common.actions.add" });
    await user.click(button);

    // The popover should be open, showing content type options
    expect(
      screen.getByRole("button", {
        name: "chapters.content_types.text",
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", {
        name: "chapters.content_types.pdf",
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", {
        name: "chapters.content_types.pptx",
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", {
        name: "chapters.content_types.image",
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", {
        name: "chapters.content_types.video",
      }),
    ).toBeVisible();
  });

  it("calls onSelect with the correct type when a content type is selected", async () => {
    const handleSelect = vi.fn();
    const user = userEvent.setup();

    render(<ChapterContentMenu onSelect={handleSelect} />);

    const button = screen.getByRole("button", { name: "common.actions.add" });
    await user.click(button);

    const textOption = screen.getByRole("button", {
      name: "chapters.content_types.text",
    });
    await user.click(textOption);

    expect(handleSelect).toHaveBeenCalledWith("text");
    expect(handleSelect).toHaveBeenCalledTimes(1);
  });

  it("closes popover after selecting a content type", async () => {
    const handleSelect = vi.fn();
    const user = userEvent.setup();

    render(<ChapterContentMenu onSelect={handleSelect} />);

    const button = screen.getByRole("button", { name: "common.actions.add" });
    await user.click(button);

    const pdfOption = screen.getByRole("button", {
      name: "chapters.content_types.pdf",
    });
    await user.click(pdfOption);

    // After selecting, the popover should close
    expect(
      screen.queryByRole("button", {
        name: "chapters.content_types.text",
      }),
    ).not.toBeInTheDocument();
  });

  it("supports all content type options", async () => {
    const handleSelect = vi.fn();
    const user = userEvent.setup();

    render(<ChapterContentMenu onSelect={handleSelect} />);

    const button = screen.getByRole("button", { name: "common.actions.add" });
    await user.click(button);

    const contentTypes = ["text", "pdf", "pptx", "image", "video"];

    for (const type of contentTypes) {
      const option = screen.getByRole("button", {
        name: `chapters.content_types.${type}`,
      });
      expect(option).toBeVisible();
    }
  });
});
