import type { Question as ApiQuestion, LocaleCode } from "@api/src";

import type { Question as EmployeeQuestion } from "../types/employeeCourse";

const EN_LOCALE = "en" as LocaleCode;

export function employeeQuestionToApi(
  question: EmployeeQuestion,
  courseId = "",
  order = 0,
): ApiQuestion {
  const answers = question.options.map((option, index) => ({
    id: `${question.id}-answer-${index}`,
    questionId: question.id,
    translations: [{ localeCode: EN_LOCALE, text: option.text }],
  }));

  const correctIndex = question.options.findIndex(
    (_, index) => getOptionLabel(index) === question.correctLabel,
  );

  return {
    id: question.id,
    order,
    courseId,
    translations: [{ localeCode: EN_LOCALE, text: question.text }],
    answers,
    correctAnswerId: correctIndex >= 0 ? answers[correctIndex].id : null,
  };
}

function getOptionLabel(index: number) {
  return String.fromCharCode(65 + index);
}
