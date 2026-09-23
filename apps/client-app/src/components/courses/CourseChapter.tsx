import { CircleCheck } from "lucide-react";
import { Link } from "react-router-dom";

interface CourseChapterProps {
  courseId: string;
  chapterId: string;
  title: string;
  prefetchSegments?: () => Awaited<void>;
  isCompleted?: boolean;
}

const CourseChapter = ({
  courseId,
  chapterId,
  title,
  isCompleted,
  prefetchSegments,
}: CourseChapterProps) => {
  return (
    <Link
      to={`/courses/${courseId}/chapters/${chapterId}`}
      onMouseEnter={prefetchSegments}
      onPointerDown={prefetchSegments}
      className="flex items-center justify-between gap-4 rounded-xl border border-solid border-brand-gray-400 bg-white p-5 shadow-md transition-colors hover:border-brand-primary-500"
    >
      <h3 className="text-base">{title}</h3>
      {isCompleted && (
        <CircleCheck className="size-6 shrink-0 text-brand-gray-900" />
      )}
    </Link>
  );
};

export default CourseChapter;
