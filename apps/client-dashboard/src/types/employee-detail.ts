import type { Course, Question } from "@api/src";

export type EmployeeCourseCompletionStatus =
  | "completed"
  | "in_progress"
  | "not_started";

export type EmployeeDetailQuestion = Question & {
  selectedAnswerId: string | null;
  selectedAnswerSubmittedAt: string | null;
  answers: Array<
    Question["answers"][number] & {
      isSelected: boolean;
    }
  >;
};

export type EmployeeDetailSubmission = {
  submittedAt: string;
  score: string;
  questions: EmployeeDetailQuestion[];
};

export type EmployeeDetailCourse = Course & {
  status: EmployeeCourseCompletionStatus;
  score: string;
  submission: EmployeeDetailSubmission | null;
};
