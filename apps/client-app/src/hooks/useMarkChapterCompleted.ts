import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { completedChaptersQuery } from "@api/src";
import { useCompleteChapter } from "./mutations/useCompleteChapter";
import { useAuth } from "@auth-context/src";

export const useMarkChapterCompleted = (
  courseId: string,
  chapterId: string,
) => {
  const { mutate: completeChapter } = useCompleteChapter();
  const { user } = useAuth();

  const { data: completed = [], isPending } = useQuery(
    completedChaptersQuery(courseId),
  );

  // As an administrator may use the application as well; we have to scope the
  // completed chapters only to the current user.
  const isAlreadyCompleted = completed.some(
    (completedChapter) =>
      completedChapter.chapterId === chapterId &&
      completedChapter.userId === user!.id,
  );

  useEffect(() => {
    if (isPending || isAlreadyCompleted) {
      return;
    }

    completeChapter({ courseId, chapterId });
  }, [courseId, chapterId, isAlreadyCompleted, isPending, completeChapter]);
};
