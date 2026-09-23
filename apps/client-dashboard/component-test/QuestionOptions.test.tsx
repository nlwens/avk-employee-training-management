import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormProvider, useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";

import QuestionOptions from "../src/components/quizzes/QuestionOptions";
import type { QuizAnswerDraft } from "../src/types/quiz";
import type { QuizFormValues } from "@ui/components/forms/validators";

interface RenderQuestionOptionsProps {
  answers?: QuizAnswerDraft[];
  correctAnswerIndex?: number | null;
  isEditing?: boolean;
  onAddAnswer?: () => void;
  onDeleteAnswer?: (answerIndex: number) => void;
  onSetCorrectAnswer?: (answerIndex: number) => void;
}

const createAnswer = (text: string): QuizAnswerDraft => ({
  translations: {
    en: { text },
    nl: { text },
  },
});

const defaultAnswers: QuizAnswerDraft[] = [
  createAnswer("Check that the area is safe"),
  createAnswer("Move the person immediately"),
  createAnswer("Give water to the person"),
];

const TestWrapper = ({
  children,
  answers = defaultAnswers,
  correctAnswerIndex = 0,
}: {
  children: ReactNode;
  answers?: QuizAnswerDraft[];
  correctAnswerIndex?: number | null;
}) => {
  const form = useForm<QuizFormValues>({
    defaultValues: {
      questions: [
        {
          id: "question-1",
          order: 0,
          translations: {
            en: {
              question: "What should you do before giving first aid?",
              explanation: "",
            },
            nl: {
              question: "Wat moet je doen voordat je eerste hulp verleent?",
              explanation: "",
            },
          },
          answers,
          correctAnswerIndex,
        },
      ],
    },
  });

  return <FormProvider {...form}>{children}</FormProvider>;
};

const renderQuestionOptions = ({
  answers = defaultAnswers,
  correctAnswerIndex = 0,
  isEditing = true,
  onAddAnswer = vi.fn(),
  onDeleteAnswer = vi.fn(),
  onSetCorrectAnswer = vi.fn(),
}: RenderQuestionOptionsProps = {}) => {
  render(
    <TestWrapper answers={answers} correctAnswerIndex={correctAnswerIndex}>
      <QuestionOptions
        answers={answers}
        correctAnswerIndex={correctAnswerIndex}
        questionIndex={0}
        language="en"
        onAddAnswer={onAddAnswer}
        onDeleteAnswer={onDeleteAnswer}
        onSetCorrectAnswer={onSetCorrectAnswer}
        isEditing={isEditing}
      />
    </TestWrapper>,
  );

  return { onAddAnswer, onDeleteAnswer, onSetCorrectAnswer };
};

describe("QuestionOptions", () => {
  it("renders answers and marks the correct answer", () => {
    renderQuestionOptions({ correctAnswerIndex: 1 });

    expect(
      screen.getByDisplayValue("Check that the area is safe"),
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("Move the person immediately"),
    ).toBeInTheDocument();

    const correctButtons = screen.getAllByRole("button", {
      name: "quiz.editor.mark_option_correct",
    });

    expect(correctButtons[0]).toHaveAttribute("aria-pressed", "false");
    expect(correctButtons[1]).toHaveAttribute("aria-pressed", "true");
  });

  it("calls edit callbacks with the selected answer index", async () => {
    const user = userEvent.setup();
    const { onAddAnswer, onDeleteAnswer, onSetCorrectAnswer } =
      renderQuestionOptions();

    await user.click(
      screen.getByRole("button", { name: "quiz.editor.add_choice" }),
    );
    expect(onAddAnswer).toHaveBeenCalledTimes(1);

    await user.click(
      screen.getAllByRole("button", {
        name: "quiz.editor.mark_option_correct",
      })[2],
    );
    expect(onSetCorrectAnswer).toHaveBeenCalledWith(2);

    await user.click(
      screen.getAllByRole("button", { name: "quiz.editor.delete_option" })[1],
    );
    expect(onDeleteAnswer).toHaveBeenCalledWith(1);
  });

  it("hides edit-only controls in view mode", async () => {
    const user = userEvent.setup();
    const { onAddAnswer, onDeleteAnswer, onSetCorrectAnswer } =
      renderQuestionOptions({ isEditing: false });

    expect(
      screen.queryByRole("button", { name: "quiz.editor.add_choice" }),
    ).not.toBeInTheDocument();

    const markButton = screen.getAllByRole("button", {
      name: "quiz.editor.mark_option_correct",
    })[0];
    const deleteButton = screen.getAllByRole("button", {
      name: "quiz.editor.delete_option",
    })[0];

    expect(markButton).toBeDisabled();
    expect(deleteButton).toBeDisabled();

    await user.click(markButton);
    await user.click(deleteButton);

    expect(onAddAnswer).not.toHaveBeenCalled();
    expect(onSetCorrectAnswer).not.toHaveBeenCalled();
    expect(onDeleteAnswer).not.toHaveBeenCalled();
  });

  it("keeps delete disabled when only two answers exist", () => {
    renderQuestionOptions({
      answers: [createAnswer("Option A"), createAnswer("Option B")],
    });

    const deleteButtons = screen.getAllByRole("button", {
      name: "quiz.editor.delete_option",
    });

    expect(deleteButtons[0]).toBeDisabled();
    expect(deleteButtons[1]).toBeDisabled();
  });
});
