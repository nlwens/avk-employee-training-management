import { useTranslation } from "react-i18next";
import { useLocalize } from "i18n";
import { prefetchQuestions, useQueryClient } from "@api/src";
import { cn } from "@ui/lib/utils";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@ui/components/ui/table";

import type { EmployeeDetailCourse } from "../../types/employee-detail";

type Props = {
  courses: EmployeeDetailCourse[];
  selectedCourseId: string | null;
  onSelect: (course: EmployeeDetailCourse | null) => void;
};

const CourseListTable = ({ courses, selectedCourseId, onSelect }: Props) => {
  const { t } = useTranslation(["employees"]);
  const { localize } = useLocalize();
  const queryClient = useQueryClient();

  const handlePrefetchQuestions = (courseId: string) => {
    void prefetchQuestions(queryClient, courseId);
  };

  const statusLabels = {
    completed: t(($) => $.employees.detail.status_completed),
    in_progress: t(($) => $.employees.detail.status_in_progress),
    not_started: t(($) => $.employees.detail.status_not_started),
  } satisfies Record<EmployeeDetailCourse["status"], string>;

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="font-normal text-gray-500">
            {t(($) => $.employees.detail.course_name)}
          </TableHead>
          <TableHead className="text-center font-normal text-gray-500">
            {t(($) => $.employees.detail.status)}
          </TableHead>
          <TableHead className="text-right font-normal text-gray-500">
            {t(($) => $.employees.detail.score)}
          </TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {courses.map((course) => {
          const isSelected = selectedCourseId === course.id;

          return (
            <TableRow
              key={course.id}
              onMouseEnter={() => handlePrefetchQuestions(course.id)}
              onFocus={() => handlePrefetchQuestions(course.id)}
              onClick={() => onSelect(isSelected ? null : course)}
              className={cn(
                "cursor-pointer hover:bg-gray-50",
                isSelected &&
                  "ring-1 ring-inset ring-gray-400 data-[state=selected]:bg-white",
              )}
              data-state={isSelected ? "selected" : undefined}
            >
              <TableCell>{localize(course.translations, "title")}</TableCell>
              <TableCell className="text-center">
                {statusLabels[course.status]}
              </TableCell>
              <TableCell className="text-right">{course.score}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default CourseListTable;
