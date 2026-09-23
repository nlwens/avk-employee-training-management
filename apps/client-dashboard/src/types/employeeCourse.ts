export type QuestionOption = { label: string; text: string };

export type Question = {
  id: string;
  text: string;
  options: QuestionOption[];
  correctLabel: string;
};

export type Submission = {
  submittedAt: string;
  score: string;
  questions: Question[];
};

export type Course = {
  id: string;
  name: string;
  status: string;
  score: string;
  submission: Submission | null;
};
