import type { CourseAverageScore } from "../../src/types/dashboard";

export const mockCourseAverageScores: CourseAverageScore[] = [
  { courseName: "Forklift Safety", averageScorePercentage: 80 },
  { courseName: "First Aid Essentials", averageScorePercentage: 65 },
  { courseName: "Workplace Hygiene", averageScorePercentage: 92 },
];

export const mockEmptyCourseAverageScores: CourseAverageScore[] = [];
