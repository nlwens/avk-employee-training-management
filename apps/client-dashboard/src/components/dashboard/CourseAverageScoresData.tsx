import { useEffect } from "react";
import { useLocalize } from "i18n";
import {
  courseStatsQueryOptions,
  coursesQueryOptions,
  useSuspenseQueries,
  useSuspenseQuery,
} from "@api/src";
import type { CourseAverageScore } from "../../types/dashboard";
import CourseAverageScoresBody from "./CourseAverageScoresBody";

export const DASHBOARD_COURSES_LIMIT = 5;

interface CourseAverageScoresDataProps {
  page: number;
  onPagesLoaded: (totalPages: number) => void;
}

const CourseAverageScoresData = ({
  page,
  onPagesLoaded,
}: CourseAverageScoresDataProps) => {
  const { localize } = useLocalize();

  const { data: coursesPage } = useSuspenseQuery(
    coursesQueryOptions({
      page,
      limit: DASHBOARD_COURSES_LIMIT,
      published: true,
    }),
  );

  useEffect(() => {
    onPagesLoaded(coursesPage.pages);
  }, [coursesPage.pages, onPagesLoaded]);

  const courseStatsResults = useSuspenseQueries({
    queries: coursesPage.data.map((course) =>
      courseStatsQueryOptions(course.id),
    ),
  });

  const courseAverageScores: CourseAverageScore[] = coursesPage.data.map(
    (course, index) => ({
      courseName: localize(course.translations, "title"),
      averageScorePercentage: courseStatsResults[index].data.averageScore,
    }),
  );

  return <CourseAverageScoresBody courses={courseAverageScores} />;
};

export default CourseAverageScoresData;
