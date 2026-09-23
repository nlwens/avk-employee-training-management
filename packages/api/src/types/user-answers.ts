export interface AnswerSubmission {
  correctAnswerId: string | null;
  explanation: Record<string, string | null>;
}

export interface UserAnswer extends AnswerSubmission {
  answerId: string;
  userId: string;
  createdAt: string;
}
