import type { EmployeeDetailCourse } from "../../src/types/employee-detail";
export const mockCourseCompleted: EmployeeDetailCourse = {
  id: "c1",
  published: true,
  priority: 0,
  createdAt: "2026-05-20T10:00:00.000Z",
  updatedAt: "2026-05-20T10:00:00.000Z",
  translations: [
    {
      localeCode: "en",
      title: "Forklift Safety",
      content: null,
    },
  ],
  chaptersCount: 1,
  questionsCount: 2,
  completedChaptersCount: 1,
  correctAnswersCount: 2,
  status: "completed",
  score: "2/2",
  submission: {
    submittedAt: "2026-05-20T10:30:00.000Z",
    score: "2/2",
    questions: [
      {
        id: "q1",
        order: 1,
        courseId: "c1",
        correctAnswerId: "a2",
        selectedAnswerId: "a2",
        selectedAnswerSubmittedAt: "2026-05-20T10:25:00.000Z",
        translations: [
          {
            localeCode: "en",
            text: "What is the maximum safe load capacity?",
          },
        ],
        answers: [
          {
            id: "a1",
            questionId: "q1",
            isSelected: false,
            translations: [{ localeCode: "en", text: "500 kg" }],
          },
          {
            id: "a2",
            questionId: "q1",
            isSelected: true,
            translations: [
              {
                localeCode: "en",
                text: "Rated capacity on the nameplate",
              },
            ],
          },
        ],
      },
      {
        id: "q2",
        order: 2,
        courseId: "c1",
        correctAnswerId: "a4",
        selectedAnswerId: "a4",
        selectedAnswerSubmittedAt: "2026-05-20T10:30:00.000Z",
        translations: [
          {
            localeCode: "en",
            text: "When should a pre-operation inspection be done?",
          },
        ],
        answers: [
          {
            id: "a3",
            questionId: "q2",
            isSelected: false,
            translations: [{ localeCode: "en", text: "Once a week" }],
          },
          {
            id: "a4",
            questionId: "q2",
            isSelected: true,
            translations: [{ localeCode: "en", text: "Before each shift" }],
          },
        ],
      },
    ],
  },
};

export const mockCourseIncomplete: EmployeeDetailCourse = {
  id: "c2",
  published: true,
  priority: 0,
  createdAt: "2026-05-20T10:00:00.000Z",
  updatedAt: "2026-05-20T10:00:00.000Z",
  translations: [
    {
      localeCode: "en",
      title: "First Aid Essentials",
      content: null,
    },
  ],
  chaptersCount: 1,
  questionsCount: 2,
  completedChaptersCount: 0,
  correctAnswersCount: 0,
  status: "not_started",
  score: "-",
  submission: null,
};

export const mockCourseCompletedWithoutSubmission: EmployeeDetailCourse = {
  ...mockCourseCompleted,
  id: "c3",
  submission: null,
};

export const mockCourses: EmployeeDetailCourse[] = [
  mockCourseCompleted,
  mockCourseIncomplete,
];
