import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { Chapter } from "@api/src";
import { describe, expect, it, vi } from "vitest";

import CourseDetailSidebar from "../src/components/courses/CourseDetailSidebar";

const mockChapters: Chapter[] = [
  {
    id: "chapter-1",
    courseId: "e2e-course-2",
    order: 1,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    translations: [
      {
        localeCode: "en",
        title: "Introduction",
      },
    ],
  },
  {
    id: "chapter-2",
    courseId: "e2e-course-2",
    order: 2,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    translations: [
      {
        localeCode: "en",
        title: "Safety Procedures",
      },
    ],
  },
];

const renderCourseDetailSidebar = ({
  chapters = [],
  onReorderChapters = vi.fn(),
  onPrefetchChapter = vi.fn(),
}: {
  chapters?: Chapter[];
  onReorderChapters?: (fromIndex: number, toIndex: number) => void;
  onPrefetchChapter?: (chapter: Chapter) => void;
} = {}) => {
  render(
    <MemoryRouter initialEntries={["/courses/e2e-course-2/overview"]}>
      <CourseDetailSidebar
        chapters={chapters}
        onReorderChapters={onReorderChapters}
        onPrefetchChapter={onPrefetchChapter}
      />
    </MemoryRouter>,
  );

  return { onReorderChapters, onPrefetchChapter };
};

describe("CourseDetailSidebar", () => {
  it("renders sidebar navigation links and the table of contents label", () => {
    renderCourseDetailSidebar();

    expect(
      screen.getByRole("link", { name: "navigation:links.overview" }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "navigation:links.quiz" }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "navigation:links.groups" }),
    ).toBeVisible();
    expect(screen.getByText("courses.detail.table_of_contents")).toBeVisible();
  });

  it("shows an empty state when the course has no chapters", () => {
    renderCourseDetailSidebar();

    expect(screen.getByText("chapters.display.none_available")).toBeVisible();
  });

  it("renders chapter titles below the table of contents section", () => {
    renderCourseDetailSidebar({ chapters: mockChapters });

    expect(screen.getByText("Introduction")).toBeVisible();
    expect(screen.getByText("Safety Procedures")).toBeVisible();
    expect(
      screen.queryByText("chapters.display.none_available"),
    ).not.toBeInTheDocument();
  });

  it("renders a drag handle for each chapter in the table of contents", () => {
    renderCourseDetailSidebar({ chapters: mockChapters });

    expect(
      screen.getAllByRole("button", {
        name: "chapters.actions.drag_chapter",
      }),
    ).toHaveLength(mockChapters.length);
  });
});
