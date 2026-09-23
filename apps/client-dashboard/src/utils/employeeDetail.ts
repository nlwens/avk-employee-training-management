import type { Course, Question, UserAnswer } from "@api/src";

import type {
  EmployeeCourseCompletionStatus,
  EmployeeDetailCourse,
  EmployeeDetailQuestion,
} from "../types/employee-detail";

/**
 * Course progress in the employee detail table is based on chapter completion
 * A user can complete a course with wrong quiz answers
 */
const getCourseStatus = (course: Course): EmployeeCourseCompletionStatus => {
  if (course.completedChaptersCount === 0) {
    return "not_started";
  }

  if (course.completedChaptersCount >= course.chaptersCount) {
    return "completed";
  }

  return "in_progress";
};

/**
 * Shows quiz score only after the employee has started the course.
 */
const getCourseScore = (course: Course): string => {
  if (course.questionsCount === 0 || course.completedChaptersCount === 0) {
    return "-";
  }

  return `${course.correctAnswersCount}/${course.questionsCount}`;
};

/**
 * Converts the real API course-stats response into the dashboard row shape.
 * Submission details stay null here because questions and user answers are
 * loaded lazily only after a course is selected.
 */
export const toEmployeeCourseSummary = (
  course: Course,
): EmployeeDetailCourse => ({
  ...course,
  status: getCourseStatus(course),
  score: getCourseScore(course),
  submission: null,
});

/**
 * Builds the selected course submission view from lazily fetched questions and
 * user answers. A submission exists as soon as the employee answered at least
 * one question.
 *
 * Unanswered questions are kept in the list with selectedAnswerId set to null.
 */
export const buildEmployeeCourseSubmission = (
  userId: string,
  course: EmployeeDetailCourse,
  questions: Question[],
  answerLists: UserAnswer[][],
): EmployeeDetailCourse => {
  const questionsWithAnswers = buildQuestionsWithSelectedAnswers(
    userId,
    questions,
    answerLists,
  );

  const questionCount = questionsWithAnswers.length;

  const answeredQuestionsCount = questionsWithAnswers.filter(
    (question) => question.selectedAnswerId !== null,
  ).length;

  const correctAnswersCount = questionsWithAnswers.filter(
    (question) =>
      question.selectedAnswerId !== null &&
      question.selectedAnswerId === question.correctAnswerId,
  ).length;

  const hasSubmittedAnswers = answeredQuestionsCount > 0;

  const submittedAt = hasSubmittedAnswers
    ? getLatestSubmittedAt(questionsWithAnswers)
    : null;

  const score =
    questionCount > 0 && course.completedChaptersCount > 0
      ? `${correctAnswersCount}/${questionCount}`
      : "-";

  return {
    ...course,
    status: getCourseStatus(course),
    score,
    submission:
      hasSubmittedAnswers && submittedAt !== null
        ? {
            submittedAt,
            score,
            questions: questionsWithAnswers,
          }
        : null,
  };
};

/**
 * The user-answer endpoint returns answers for all users for each question.
 * This keeps only the selected employee's answer and marks the matching answer
 * option so the UI can highlight it.
 */
const buildQuestionsWithSelectedAnswers = (
  userId: string,
  questions: Question[],
  answerLists: UserAnswer[][],
): EmployeeDetailQuestion[] => {
  const userAnswersByQuestionId = new Map<string, UserAnswer>();

  answerLists.forEach((answers, index) => {
    const question = questions[index];

    if (!question) {
      return;
    }

    const userAnswer = answers.find((answer) => answer.userId === userId);

    if (userAnswer) {
      userAnswersByQuestionId.set(question.id, userAnswer);
    }
  });

  return questions.map((question) => {
    const selectedAnswer = userAnswersByQuestionId.get(question.id);
    const selectedAnswerId = selectedAnswer?.answerId ?? null;

    return {
      ...question,
      selectedAnswerId,
      selectedAnswerSubmittedAt: selectedAnswer?.createdAt ?? null,
      answers: question.answers.map((answer) => ({
        ...answer,
        isSelected: answer.id === selectedAnswerId,
      })),
    };
  });
};

/**
 * Uses the latest answer timestamp as the submission time for the course.
 */
const getLatestSubmittedAt = (
  questions: EmployeeDetailQuestion[],
): string | null => {
  const submittedTimes = questions
    .map((question) => question.selectedAnswerSubmittedAt)
    .filter((submittedAt): submittedAt is string => submittedAt !== null)
    .map((submittedAt) => new Date(submittedAt).getTime());

  if (submittedTimes.length === 0) {
    return null;
  }

  return new Date(Math.max(...submittedTimes)).toISOString();
};
