import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import CourseCard from "../src/components/courses/CourseCard";
import type { DashboardCourse } from "../src/types/course";
import { mockT } from "./setup";

const defaultCourse: DashboardCourse = {
  id: "forklift-safety",
  published: true,
  priority: 0,
  chaptersCount: 5,
  questionsCount: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  translations: [
    {
      localeCode: "en",
      title: "Fire safety",
      content: "Advanced topics covered here.",
    },
  ],
};

const renderCourseCard = (course: Partial<DashboardCourse> = {}) => {
  render(<CourseCard course={{ ...defaultCourse, ...course }} />);
};

describe("CourseCard", () => {
  it("renders the course title and chapter count", () => {
    renderCourseCard();

    const card = screen.getByRole("article");

    expect(within(card).getByText("Fire safety")).toBeVisible();
    expect(within(card).getByText("chapters.display.count")).toBeVisible();
    expect(mockT).toHaveBeenCalledWith(expect.any(Function), { count: 5 });
  });
});
