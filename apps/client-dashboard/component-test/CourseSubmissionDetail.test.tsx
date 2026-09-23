import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import CourseSubmissionDetail from "../src/components/employees/CourseSubmissionDetail";
import {
  mockCourseCompleted,
  mockCourseCompletedWithoutSubmission,
} from "./fixtures/courses";

function getAnswerText(label: string, text: string) {
  return `${label}: ${text}`;
}

describe("CourseSubmissionDetail", () => {
  it("shows a no-completed-courses message when the employee has no completed courses", () => {
    render(
      <CourseSubmissionDetail course={null} hasCompletedCourses={false} />,
    );

    expect(
      screen.getByText("employees.detail.no_completed_courses"),
    ).toBeVisible();
  });

  it("shows a prompt to select a course when no course is selected", () => {
    render(<CourseSubmissionDetail course={null} hasCompletedCourses />);

    expect(screen.getByText("employees.detail.select_course")).toBeVisible();
  });

  it("shows a no-submission message when the selected course has no submission", () => {
    render(
      <CourseSubmissionDetail
        course={mockCourseCompletedWithoutSubmission}
        hasCompletedCourses
      />,
    );

    expect(screen.getByText("employees.detail.no_submission")).toBeVisible();
  });

  it("renders the submission date and score", () => {
    render(
      <CourseSubmissionDetail
        course={mockCourseCompleted}
        hasCompletedCourses
      />,
    );

    expect(screen.getByText("employees.detail.submitted")).toBeVisible();
    expect(screen.getByText("2/2")).toBeVisible();
  });

  it("renders all questions", () => {
    render(
      <CourseSubmissionDetail
        course={mockCourseCompleted}
        hasCompletedCourses
      />,
    );

    const questionLabels = screen.getAllByText("quiz.summary.question_label");
    expect(questionLabels).toHaveLength(
      mockCourseCompleted.submission!.questions.length,
    );
  });

  it("renders all options for each question", () => {
    render(
      <CourseSubmissionDetail
        course={mockCourseCompleted}
        hasCompletedCourses
      />,
    );

    for (const question of mockCourseCompleted.submission!.questions) {
      for (const [index, answer] of question.answers.entries()) {
        const label = String.fromCharCode(65 + index);
        const [translation] = answer.translations;

        expect(
          screen.getByText(getAnswerText(label, translation.text)),
        ).toBeVisible();
      }
    }
  });

  it("applies semibold styling to the correct option", () => {
    render(
      <CourseSubmissionDetail
        course={mockCourseCompleted}
        hasCompletedCourses
      />,
    );

    const [firstQuestion] = mockCourseCompleted.submission!.questions;
    const correctAnswer = firstQuestion.answers.find(
      (answer) => answer.id === firstQuestion.correctAnswerId,
    )!;

    const correctAnswerIndex = firstQuestion.answers.indexOf(correctAnswer);
    const label = String.fromCharCode(65 + correctAnswerIndex);
    const [translation] = correctAnswer.translations;

    const correctAnswerText = screen
      .getByText(getAnswerText(label, translation.text))
      .closest("p");

    expect(correctAnswerText).toHaveClass("font-semibold");
  });

  it("does not apply semibold styling to incorrect options", () => {
    render(
      <CourseSubmissionDetail
        course={mockCourseCompleted}
        hasCompletedCourses
      />,
    );

    const [firstQuestion] = mockCourseCompleted.submission!.questions;
    const incorrectAnswer = firstQuestion.answers.find(
      (answer) => answer.id !== firstQuestion.correctAnswerId,
    )!;

    const incorrectAnswerIndex = firstQuestion.answers.indexOf(incorrectAnswer);
    const label = String.fromCharCode(65 + incorrectAnswerIndex);
    const [translation] = incorrectAnswer.translations;

    const incorrectAnswerText = screen
      .getByText(getAnswerText(label, translation.text))
      .closest("p");

    expect(incorrectAnswerText).not.toHaveClass("font-semibold");
  });

  it("renders the delete all answers button when a handler is provided", () => {
    render(
      <CourseSubmissionDetail
        course={mockCourseCompleted}
        hasCompletedCourses
        onDeleteAllAnswers={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", {
        name: "employees.detail.actions.delete_all_answers",
      }),
    ).toBeVisible();
  });

  it("calls onDeleteAllAnswers when the delete button is clicked", () => {
    const onDeleteAllAnswers = vi.fn();

    render(
      <CourseSubmissionDetail
        course={mockCourseCompleted}
        hasCompletedCourses
        onDeleteAllAnswers={onDeleteAllAnswers}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "employees.detail.actions.delete_all_answers",
      }),
    );

    expect(onDeleteAllAnswers).toHaveBeenCalledTimes(1);
  });

  it("disables the delete button while deletion is in progress", () => {
    render(
      <CourseSubmissionDetail
        course={mockCourseCompleted}
        hasCompletedCourses
        onDeleteAllAnswers={vi.fn()}
        isDeletingAllAnswers
      />,
    );

    expect(
      screen.getByRole("button", {
        name: "employees.detail.actions.delete_all_answers",
      }),
    ).toBeDisabled();
  });

  it("does not render the delete button when there is no submission", () => {
    render(
      <CourseSubmissionDetail
        course={mockCourseCompletedWithoutSubmission}
        hasCompletedCourses
        onDeleteAllAnswers={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("button", {
        name: "employees.detail.actions.delete_all_answers",
      }),
    ).not.toBeInTheDocument();
  });
});
