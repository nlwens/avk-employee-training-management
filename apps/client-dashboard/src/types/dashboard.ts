export type DashboardMetric = {
  label: string;
  value: number;
};

export type CourseAverageScore = {
  courseName: string;
  averageScorePercentage: number;
};

export type DashboardData = {
  metrics: DashboardMetric[];
  courseAverageScores: CourseAverageScore[];
};
