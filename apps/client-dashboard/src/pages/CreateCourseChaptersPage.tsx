import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { SubmitHandler } from "react-hook-form";
import type { ChapterFormValues } from "@ui/components/forms/validators";
import { useToast } from "ui/hooks/use-toast";
import { useHandleApiError } from "api/src";
import ChapterForm from "../components/chapters/ChapterForm";
import { useCreateChapter } from "../hooks/mutations/useCreateChapter";
import { useCreateSegment } from "../hooks/mutations/useCreateSegment";
import { blockToSegment } from "../api/segmentsApi";

const CreateCourseChaptersPage = () => {
  const { courseId } = useParams() as { courseId: string };

  const navigate = useNavigate();
  const { handleApiError } = useHandleApiError();
  const { toast } = useToast();
  const { t } = useTranslation(["courses", "chapters", "common"]);

  const { mutate: chapterMutate, isPending: isCreatingChapter } =
    useCreateChapter();
  const { mutateAsync: segmentMutateAsync } = useCreateSegment();
  const [isSavingSegments, setIsSavingSegments] = useState(false);

  const isSubmitting = isCreatingChapter || isSavingSegments;

  const handleSave: SubmitHandler<ChapterFormValues> = (values) => {
    chapterMutate(
      {
        courseId,
        chapter: values,
      },
      {
        onSuccess: async (chapter) => {
          setIsSavingSegments(true);

          try {
            await Promise.all(
              values.contentBlocks.map((block, index) =>
                segmentMutateAsync(
                  {
                    courseId,
                    chapterId: chapter.id,
                    segment: blockToSegment({ ...block, order: index + 1 }),
                  },
                  {
                    onError: (error) => handleApiError(error),
                  },
                ),
              ),
            );

            toast({
              variant: "success",
              title: t(($) => $.common.status.success),
              description: t(($) => $.chapters.messages.success.created),
            });

            navigate(`/courses/${chapter.courseId}/chapters/${chapter.id}`);
          } finally {
            setIsSavingSegments(false);
          }
        },
        onError: (error) => handleApiError(error),
      },
    );
  };

  return <ChapterForm onSubmit={handleSave} isSubmitting={isSubmitting} />;
};

export default CreateCourseChaptersPage;
