import type { ComponentProps } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import QuizForm from "../src/components/quizzes/QuizForm";
import type { QuizFormValues } from "@ui/components/forms/validators";

const createAnswer = (en: string, nl = en) => ({
  translations: {
    en: { text: en },
    nl: { text: nl },
  },
});

const quizFormValues: QuizFormValues = {
  questions: [
    {
      id: "question-1",
      order: 0,
      translations: {
        en: {
          question: "What should you do before giving first aid?",
          explanation:
            "Always check the scene first so you do not put yourself or others in danger.",
        },
        nl: {
          question: "Wat moet je doen voordat je eerste hulp verleent?",
          explanation:
            "Controleer altijd eerst de omgeving zodat je jezelf of anderen niet in gevaar brengt.",
        },
      },
      answers: [
        createAnswer(
          "Check that the area is safe",
          "Controleren of de omgeving veilig is",
        ),
        createAnswer(
          "Move the person immediately",
          "De persoon onmiddellijk verplaatsen",
        ),
        createAnswer("Give water to the person", "De persoon water geven"),
      ],
      correctAnswerIndex: 0,
    },
    {
      id: "question-2",
      order: 1,
      translations: {
        en: {
          question: "When should you call emergency services?",
          explanation:
            "Call emergency services immediately when there is serious injury, danger, or uncertainty.",
        },
        nl: {
          question: "Wanneer moet je de hulpdiensten bellen?",
          explanation:
            "Bel onmiddellijk de hulpdiensten bij ernstig letsel, gevaar of twijfel.",
        },
      },
      answers: [
        createAnswer(
          "Only after the person wakes up",
          "Pas nadat de persoon wakker wordt",
        ),
        createAnswer(
          "When there is serious injury or danger",
          "Bij ernstig letsel of gevaar",
        ),
      ],
      correctAnswerIndex: 1,
    },
  ],
};

const renderQuizForm = (
  props: Partial<ComponentProps<typeof QuizForm>> = {},
) => {
  const onSubmit = vi.fn();
  const onCancel = vi.fn();
  const onEdit = vi.fn();

  render(
    <QuizForm
      initialData={quizFormValues}
      onSubmit={onSubmit}
      onCancel={onCancel}
      onEdit={onEdit}
      {...props}
    />,
  );

  return { onSubmit, onCancel, onEdit };
};

describe("QuizForm", () => {
  it("renders the header with the content language switch", () => {
    renderQuizForm();

    const languageSwitch = screen.getByRole("switch", {
      name: "quiz.editor.toggle_language",
    });

    expect(languageSwitch).toBeInTheDocument();
    expect(languageSwitch).toHaveTextContent("EN");
  });

  it("renders initial question data in English by default", () => {
    renderQuizForm();

    expect(
      screen.getByDisplayValue("What should you do before giving first aid?"),
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("When should you call emergency services?"),
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("Check that the area is safe"),
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("When there is serious injury or danger"),
    ).toBeInTheDocument();
  });

  it("renders 'Add question' button", () => {
    renderQuizForm({ isEditing: true });

    const addButton = screen.getByRole("button", {
      name: "quiz.editor.add_question",
    });
    expect(addButton).toBeInTheDocument();
  });

  it("renders 'Save' and 'Cancel' buttons in edit mode", () => {
    renderQuizForm({ isEditing: true });

    expect(
      screen.getByRole("button", { name: "common.actions.save" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "common.actions.cancel" }),
    ).toBeInTheDocument();
  });

  it("calls onSubmit with form values when form is submitted", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderQuizForm({ isEditing: true });

    const submitButton = screen.getByRole("button", {
      name: "common.actions.save",
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });

    const submittedData = onSubmit.mock.calls[0]?.[0];
    expect(submittedData?.questions).toBeDefined();
    expect(submittedData?.questions.length).toBeGreaterThan(0);
  });

  it("switches to Dutch content when the language switch is clicked", async () => {
    const user = userEvent.setup();

    renderQuizForm();

    const languageSwitch = screen.getByRole("switch", {
      name: "quiz.editor.toggle_language",
    });

    await user.click(languageSwitch);

    expect(languageSwitch).toHaveTextContent("NL");
    expect(
      screen.getByDisplayValue(
        "Wat moet je doen voordat je eerste hulp verleent?",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("Wanneer moet je de hulpdiensten bellen?"),
    ).toBeInTheDocument();
  });

  it("preserves question data when switching languages", async () => {
    const user = userEvent.setup();

    renderQuizForm();

    const languageSwitch = screen.getByRole("switch", {
      name: "quiz.editor.toggle_language",
    });

    expect(
      screen.getByDisplayValue("What should you do before giving first aid?"),
    ).toBeInTheDocument();

    await user.click(languageSwitch);

    expect(
      screen.getByDisplayValue(
        "Wat moet je doen voordat je eerste hulp verleent?",
      ),
    ).toBeInTheDocument();

    await user.click(languageSwitch);

    expect(
      screen.getByDisplayValue("What should you do before giving first aid?"),
    ).toBeInTheDocument();
  });

  it("renders existing questions and answers in view mode", () => {
    renderQuizForm({ isEditing: false });

    expect(
      screen.getByDisplayValue("What should you do before giving first aid?"),
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("When should you call emergency services?"),
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("Check that the area is safe"),
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("When there is serious injury or danger"),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "quiz.editor.edit" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "quiz.editor.add_question" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "quiz.editor.add_choice" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "common.actions.save" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "common.actions.cancel" }),
    ).not.toBeInTheDocument();
  });

  it("calls onEdit from view mode without submitting", async () => {
    const user = userEvent.setup();
    const { onEdit, onSubmit } = renderQuizForm({
      isEditing: false,
    });

    await user.click(screen.getByRole("button", { name: "quiz.editor.edit" }));

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows edit-only controls in edit mode", () => {
    renderQuizForm({ isEditing: true });

    expect(
      screen.getByRole("button", { name: "common.actions.save" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "common.actions.cancel" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "quiz.editor.add_question" }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: "quiz.editor.add_choice" }),
    ).toHaveLength(2);
    expect(screen.getAllByLabelText("quiz.editor.drag_question")).toHaveLength(
      2,
    );
  });

  it("renders multiple questions correctly", () => {
    const multipleQuestions: QuizFormValues = {
      questions: [
        {
          id: "question-1",
          order: 0,
          translations: {
            en: {
              question: "First question?",
              explanation: "",
            },
            nl: {
              question: "Eerste vraag?",
              explanation: "",
            },
          },
          answers: [createAnswer("A", "A"), createAnswer("B", "B")],
          correctAnswerIndex: 0,
        },
        {
          id: "question-2",
          order: 1,
          translations: {
            en: {
              question: "Second question?",
              explanation: "",
            },
            nl: {
              question: "Tweede vraag?",
              explanation: "",
            },
          },
          answers: [createAnswer("C", "C"), createAnswer("D", "D")],
          correctAnswerIndex: 1,
        },
      ],
    };

    renderQuizForm({ initialData: multipleQuestions });

    expect(screen.getByDisplayValue("First question?")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Second question?")).toBeInTheDocument();
  });

  it("adds a question in edit mode", async () => {
    const user = userEvent.setup();

    renderQuizForm({ isEditing: true });

    expect(screen.getAllByLabelText("quiz.editor.drag_question")).toHaveLength(
      2,
    );

    await user.click(
      screen.getByRole("button", { name: "quiz.editor.add_question" }),
    );

    await waitFor(() => {
      expect(
        screen.getAllByLabelText("quiz.editor.drag_question"),
      ).toHaveLength(3);
    });
  });

  it("adds a choice to one question in edit mode", async () => {
    const user = userEvent.setup();

    renderQuizForm({ isEditing: true });

    expect(screen.getAllByPlaceholderText("...")).toHaveLength(5);

    await user.click(
      screen.getAllByRole("button", { name: "quiz.editor.add_choice" })[0],
    );

    await waitFor(() => {
      expect(screen.getAllByPlaceholderText("...")).toHaveLength(6);
    });
  });

  it("deletes a question in edit mode", async () => {
    const user = userEvent.setup();

    renderQuizForm({ isEditing: true });

    expect(
      screen.getByDisplayValue("When should you call emergency services?"),
    ).toBeInTheDocument();

    const deleteButtons = screen.getAllByRole("button", {
      name: "quiz.editor.delete_question",
    });
    await user.click(deleteButtons[1]);

    await waitFor(() => {
      expect(
        screen.queryByDisplayValue("When should you call emergency services?"),
      ).not.toBeInTheDocument();
    });
  });

  it("submits form with updated values in edit mode", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderQuizForm({ isEditing: true });

    const questionInput = screen.getByDisplayValue(
      "What should you do before giving first aid?",
    );

    await user.clear(questionInput);
    await user.type(questionInput, "Updated question?");
    await user.click(
      screen.getByRole("button", { name: "common.actions.save" }),
    );

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    expect(
      onSubmit.mock.calls[0]?.[0].questions[0]?.translations.en.question,
    ).toBe("Updated question?");
  });

  it("calls onCancel from edit mode", async () => {
    const user = userEvent.setup();
    const { onCancel } = renderQuizForm({ isEditing: true });

    await user.click(
      screen.getByRole("button", { name: "common.actions.cancel" }),
    );

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("shows required validation error when question is empty", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    renderQuizForm({
      isEditing: true,
      onSubmit,
      initialData: {
        questions: [
          {
            id: "question-1",
            order: 0,
            translations: {
              en: {
                question: "",
                explanation: "",
              },
              nl: {
                question: "",
                explanation: "",
              },
            },
            answers: [
              createAnswer("Option A", "Optie A"),
              createAnswer("Option B", "Optie B"),
            ],
            correctAnswerIndex: 0,
          },
        ],
      },
    });

    await user.click(
      screen.getByRole("button", { name: "common.actions.save" }),
    );

    await waitFor(() => {
      expect(
        screen.getByText("validation:question.required"),
      ).toBeInTheDocument();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits when only one language has question content", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    renderQuizForm({
      isEditing: true,
      onSubmit,
      initialData: {
        questions: [
          {
            id: "question-1",
            order: 0,
            translations: {
              en: {
                question: "",
                explanation: "",
              },
              nl: {
                question: "Nederlandse vraag?",
                explanation: "",
              },
            },
            answers: [createAnswer("", "Optie A"), createAnswer("", "Optie B")],
            correctAnswerIndex: 0,
          },
        ],
      },
    });

    await user.click(
      screen.getByRole("button", { name: "common.actions.save" }),
    );

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
  });

  it("allows editing question text", async () => {
    const user = userEvent.setup();
    renderQuizForm({ isEditing: true });

    const questionInput = screen.getByDisplayValue(
      "What should you do before giving first aid?",
    ) as HTMLInputElement;

    await user.clear(questionInput);
    await user.type(questionInput, "Updated question text?");

    expect(questionInput.value).toBe("Updated question text?");
  });

  it("allows editing option text", async () => {
    const user = userEvent.setup();
    renderQuizForm({ isEditing: true });

    const optionInput = screen.getByDisplayValue(
      "Check that the area is safe",
    ) as HTMLInputElement;

    await user.clear(optionInput);
    await user.type(optionInput, "Updated option text");

    expect(optionInput.value).toBe("Updated option text");
  });

  it("allows editing explanation text", async () => {
    const user = userEvent.setup();
    renderQuizForm({ isEditing: true });

    const explanationTextarea = screen.getByDisplayValue(
      "Always check the scene first so you do not put yourself or others in danger.",
    ) as HTMLTextAreaElement;

    await user.clear(explanationTextarea);
    await user.type(explanationTextarea, "Updated explanation text");

    expect(explanationTextarea.value).toBe("Updated explanation text");
  });

  it("shows validation error when option text is empty", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    renderQuizForm({
      isEditing: true,
      onSubmit,
      initialData: {
        questions: [
          {
            id: "question-1",
            order: 0,
            translations: {
              en: {
                question: "Valid question?",
                explanation: "",
              },
              nl: {
                question: "Geldige vraag?",
                explanation: "",
              },
            },
            answers: [
              createAnswer("", ""),
              createAnswer("Option B", "Optie B"),
            ],
            correctAnswerIndex: 1,
          },
        ],
      },
    });

    await user.click(
      screen.getByRole("button", { name: "common.actions.save" }),
    );

    await waitFor(() => {
      expect(
        screen.getByText("validation:option_text.required"),
      ).toBeInTheDocument();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("renders with one question by default when no initialData is provided", () => {
    render(
      <QuizForm
        initialData={undefined}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    const dragButtons = screen.queryAllByLabelText("quiz.editor.drag_question");
    expect(dragButtons.length).toBeGreaterThan(0);
  });

  it("maintains question order when adding new questions", async () => {
    const user = userEvent.setup();
    renderQuizForm({ isEditing: true });

    let dragButtons = screen.getAllByLabelText("quiz.editor.drag_question");
    expect(dragButtons).toHaveLength(2);

    await user.click(
      screen.getByRole("button", { name: "quiz.editor.add_question" }),
    );

    await waitFor(() => {
      dragButtons = screen.getAllByLabelText("quiz.editor.drag_question");
      expect(dragButtons).toHaveLength(3);
    });

    const questions = screen.getAllByLabelText("quiz.editor.drag_question");
    expect(questions).toHaveLength(3);
  });

  it("adds a new question when 'Add question' button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <QuizForm
        initialData={undefined}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        onEdit={vi.fn()}
        isEditing={true}
      />,
    );

    let dragButtons = screen.getAllByLabelText("quiz.editor.drag_question");
    expect(dragButtons).toHaveLength(1);

    const addButton = screen.getByRole("button", {
      name: "quiz.editor.add_question",
    });
    await user.click(addButton);

    await waitFor(() => {
      dragButtons = screen.getAllByLabelText("quiz.editor.drag_question");
      expect(dragButtons).toHaveLength(2);
    });
  });

  it("renders the quiz form with title and language switch", () => {
    renderQuizForm();

    expect(screen.getByText("quiz.title")).toBeInTheDocument();

    const languageSwitch = screen.getByRole("switch", {
      name: "quiz.editor.toggle_language",
    });
    expect(languageSwitch).toBeInTheDocument();
    expect(languageSwitch).toHaveTextContent("EN");
  });
});
