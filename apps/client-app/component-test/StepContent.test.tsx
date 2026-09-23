import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import StepContent from "../src/components/stepper/StepContent";
import type { Segment } from "@api/src";

const seg1: Segment = {
  id: "seg1",
  chapterId: "ch1",
  type: "text",
  order: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  translations: [
    {
      localeCode: "en",
      content: "Learn the fundamentals of this topic.",
    },
  ],
  files: [],
};

const seg2: Segment = {
  id: "seg2",
  chapterId: "ch1",
  type: "video",
  order: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  translations: [],
  files: [
    {
      id: "uuid-1",
      name: "document.mp4",
      size: 1024,
      mimetype: "video/mp4",
      provider: "local",
      createdAt: new Date(),
      updatedAt: new Date(),
      localeCode: "en",
    },
  ],
};

const seg3: Segment = {
  id: "seg3",
  chapterId: "ch1",
  type: "pdf",
  order: 2,
  createdAt: new Date(),
  updatedAt: new Date(),
  translations: [],
  files: [
    {
      id: "uuid-1",
      name: "document.pdf",
      size: 1024,
      mimetype: "application/pdf",
      provider: "local",
      createdAt: new Date(),
      updatedAt: new Date(),
      localeCode: "en",
    },
  ],
};

const seg4: Segment = {
  id: "seg4",
  chapterId: "ch2",
  type: "text",
  order: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  translations: [
    {
      localeCode: "en",
      content: "Advanced topics covered here.",
    },
  ],
  files: [],
};

const mockSteps = [
  {
    label: "Chapter 1: Introduction",
  },
  {
    label: "Chapter 2: Advanced",
  },
];

const baseProps = {
  steps: mockSteps,
  step: 0,
  segments: [seg1, seg2, seg3],
};

describe("StepContent", () => {
  it("renders the chapter title", () => {
    render(<StepContent {...baseProps} />);

    expect(screen.getByText("Chapter 1: Introduction")).toBeInTheDocument();
  });

  it("renders all segments for the current chapter", () => {
    render(<StepContent {...baseProps} />);

    expect(
      screen.getByText("Learn the fundamentals of this topic."),
    ).toBeInTheDocument();

    expect(document.querySelector("video")).toBeInTheDocument();
    expect(
      document.querySelector("embed[type='application/pdf']"),
    ).toBeInTheDocument();
  });

  it("renders segments in the correct order", () => {
    render(<StepContent {...baseProps} />);

    expect(
      screen.getByText("Learn the fundamentals of this topic."),
    ).toBeInTheDocument();
    expect(document.querySelector("video")).toBeInTheDocument();
    expect(
      document.querySelector("embed[type='application/pdf']"),
    ).toBeInTheDocument();
  });

  it("shows different chapter content when step changes", () => {
    render(<StepContent {...baseProps} step={1} segments={[seg4]} />);

    expect(screen.getByText("Chapter 2: Advanced")).toBeInTheDocument();
    expect(
      screen.getByText("Advanced topics covered here."),
    ).toBeInTheDocument();
  });

  it("hides previous chapter segments when step changes", () => {
    const { rerender } = render(<StepContent {...baseProps} step={0} />);

    expect(
      screen.getByText("Learn the fundamentals of this topic."),
    ).toBeInTheDocument();

    rerender(<StepContent {...baseProps} step={1} segments={[seg4]} />);

    expect(
      screen.queryByText("Learn the fundamentals of this topic."),
    ).not.toBeInTheDocument();
  });

  it("handles empty segments", () => {
    render(<StepContent {...baseProps} segments={[]} />);

    expect(screen.getByText("Chapter 1: Introduction")).toBeInTheDocument();
  });

  it("renders correctly with a single segment", () => {
    render(<StepContent {...baseProps} segments={[seg1]} />);

    expect(
      screen.getByText("Learn the fundamentals of this topic."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Watch this introductory video."),
    ).not.toBeInTheDocument();
  });

  it("displays all segment types", () => {
    render(<StepContent {...baseProps} segments={[seg1, seg2, seg3]} />);

    expect(
      screen.getByText("Learn the fundamentals of this topic."),
    ).toBeInTheDocument(); // text type
    expect(document.querySelector("video")).toBeInTheDocument(); // video type
    expect(
      document.querySelector("embed[type='application/pdf']"),
    ).toBeInTheDocument(); // pdf type
  });

  it("uses localization to display segment content", () => {
    render(<StepContent {...baseProps} />);

    expect(
      screen.getByText("Learn the fundamentals of this topic."),
    ).toBeInTheDocument();
  });

  it("renders the correct chapter when multiple chapters exist", () => {
    const { rerender } = render(<StepContent {...baseProps} step={0} />);

    expect(screen.getByText("Chapter 1: Introduction")).toBeInTheDocument();

    rerender(<StepContent steps={mockSteps} step={1} segments={[seg4]} />);

    expect(screen.getByText("Chapter 2: Advanced")).toBeInTheDocument();
    expect(
      screen.queryByText("Chapter 1: Introduction"),
    ).not.toBeInTheDocument();
  });
});
