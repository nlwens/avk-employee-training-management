import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Question, UserAnswer } from "@api/src";
import QuizStepper from "../src/components/quizzes/QuizStepper";

const q1: Question = {
  id: "q1",
  order: 0,
  courseId: "course-1",
  translations: [{ localeCode: "en", text: "What is the capital of France?" }],
  answers: [
    {
      id: "a1",
      questionId: "q1",
      translations: [{ localeCode: "en", text: "Paris" }],
    },
    {
      id: "a2",
      questionId: "q1",
      translations: [{ localeCode: "en", text: "London" }],
    },
    {
      id: "a3",
      questionId: "q1",
      translations: [{ localeCode: "en", text: "Berlin" }],
    },
  ],
};

const q2: Question = {
  id: "q2",
  order: 1,
  courseId: "course-1",
  translations: [{ localeCode: "en", text: "What is the largest planet?" }],
  answers: [
    {
      id: "a4",
      questionId: "q2",
      translations: [{ localeCode: "en", text: "Jupiter" }],
    },
    {
      id: "a5",
      questionId: "q2",
      translations: [{ localeCode: "en", text: "Saturn" }],
    },
  ],
};

const q3: Question = {
  id: "q3",
  order: 2,
  courseId: "course-1",
  translations: [{ localeCode: "en", text: "What is H2O?" }],
  answers: [
    {
      id: "a6",
      questionId: "q3",
      translations: [{ localeCode: "en", text: "Water" }],
    },
    {
      id: "a7",
      questionId: "q3",
      translations: [{ localeCode: "en", text: "Hydrogen" }],
    },
  ],
};

const mockUserAnswer: UserAnswer = {
  correctAnswerId: "a1",
  explanation: { en: "Paris is the capital of France." },
  answerId: "a1",
  userId: "user-1",
  createdAt: "2026-05-19T00:00:00.000Z",
};

const baseProps = {
  currentStep: 0,
  onGoToStep: vi.fn(),
  onComplete: vi.fn(),
  onSubmitAnswer: vi.fn(),
  userAnswer: null as UserAnswer | null,
  isPending: false,
  questions: [q1, q2, q3],
};

describe("QuizStepper", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders one step indicator per question", () => {
    render(<QuizStepper {...baseProps} />);

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("shows the current question text", () => {
    render(<QuizStepper {...baseProps} />);

    expect(
      screen.getByText("What is the capital of France?"),
    ).toBeInTheDocument();
  });

  it("shows all answer options for the current question", () => {
    render(<QuizStepper {...baseProps} />);

    expect(screen.getByText("Paris")).toBeInTheDocument();
    expect(screen.getByText("London")).toBeInTheDocument();
    expect(screen.getByText("Berlin")).toBeInTheDocument();
  });

  it("shows a different question when currentStep changes", () => {
    render(<QuizStepper {...baseProps} currentStep={1} />);

    expect(screen.getByText("What is the largest planet?")).toBeInTheDocument();
  });

  it("disables the action button when no option is selected", () => {
    render(<QuizStepper {...baseProps} />);

    expect(
      screen.getByRole("button", { name: "quiz.taking.check" }),
    ).toBeDisabled();
  });

  it("enables the action button when an option is clicked", async () => {
    render(<QuizStepper {...baseProps} />);

    await userEvent.click(screen.getByText("Paris"));

    expect(
      screen.getByRole("button", { name: "quiz.taking.check" }),
    ).not.toBeDisabled();
  });

  it("shows 'check' when the question is not yet answered", () => {
    render(<QuizStepper {...baseProps} currentStep={2} />);

    expect(
      screen.getByRole("button", { name: "quiz.taking.check" }),
    ).toBeInTheDocument();
  });

  it("calls onSubmitAnswer with the question and selected answer when check is clicked", async () => {
    render(<QuizStepper {...baseProps} />);

    await userEvent.click(screen.getByText("Paris"));
    await userEvent.click(
      screen.getByRole("button", { name: "quiz.taking.check" }),
    );

    expect(baseProps.onSubmitAnswer).toHaveBeenCalledWith("q1", "a1");
    expect(baseProps.onGoToStep).not.toHaveBeenCalled();
  });

  it("shows 'next' when the question has been answered", () => {
    render(<QuizStepper {...baseProps} userAnswer={mockUserAnswer} />);

    expect(
      screen.getByRole("button", { name: "quiz.taking.next" }),
    ).toBeInTheDocument();
  });

  it("shows 'submit' when the last question has been answered", () => {
    render(
      <QuizStepper
        {...baseProps}
        currentStep={2}
        userAnswer={mockUserAnswer}
      />,
    );

    expect(
      screen.getByRole("button", { name: "quiz.taking.submit" }),
    ).toBeInTheDocument();
  });

  it("calls onGoToStep when 'next' is clicked", async () => {
    render(<QuizStepper {...baseProps} userAnswer={mockUserAnswer} />);

    await userEvent.click(
      screen.getByRole("button", { name: "quiz.taking.next" }),
    );

    expect(baseProps.onGoToStep).toHaveBeenCalledTimes(1);
    expect(baseProps.onComplete).not.toHaveBeenCalled();
  });

  it("calls onComplete when 'submit' is clicked on the last answered question", async () => {
    render(
      <QuizStepper
        {...baseProps}
        currentStep={2}
        userAnswer={mockUserAnswer}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "quiz.taking.submit" }),
    );

    expect(baseProps.onComplete).toHaveBeenCalledTimes(1);
    expect(baseProps.onGoToStep).not.toHaveBeenCalled();
  });

  it("hides the back button on the first question", () => {
    render(<QuizStepper {...baseProps} />);

    expect(
      screen.queryByRole("button", { name: "quiz.taking.previous" }),
    ).not.toBeInTheDocument();
  });

  it("goes back to the previous question when the back button is clicked", async () => {
    render(
      <QuizStepper
        {...baseProps}
        currentStep={1}
        userAnswer={mockUserAnswer}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "quiz.taking.previous" }),
    );

    expect(baseProps.onGoToStep).toHaveBeenCalledWith(0);
  });

  it("warns the answer is locked when landing on an already-answered question", () => {
    render(<QuizStepper {...baseProps} userAnswer={mockUserAnswer} />);

    expect(screen.getByText("quiz.taking.locked")).toBeInTheDocument();
  });

  it("does not warn the answer is locked on an unanswered question", () => {
    render(<QuizStepper {...baseProps} />);

    expect(screen.queryByText("quiz.taking.locked")).not.toBeInTheDocument();
  });

  it("does not warn the answer is locked right after answering in place", () => {
    // The question is answered without remounting (same step), mirroring a
    // submission whose result arrives through the cache.
    const { rerender } = render(
      <QuizStepper {...baseProps} userAnswer={null} />,
    );

    rerender(<QuizStepper {...baseProps} userAnswer={mockUserAnswer} />);

    expect(screen.queryByText("quiz.taking.locked")).not.toBeInTheDocument();
  });
});
