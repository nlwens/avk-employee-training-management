import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { ChapterFormValues } from "@ui/components/forms/validators";
import { useToast } from "ui/hooks/use-toast";
import {
  chapterQueryOptionsWithCache,
  courseChaptersQueryOptions,
  type ApiError,
  type Chapter,
  useHandleApiError,
  useQueryClient,
  useSuspenseQueries,
  segmentsQueryOptions,
  QueryBoundary,
  useMutation,
  type Segment,
  ErrorCode,
} from "api/src";
import ChapterForm from "../components/chapters/ChapterForm";
import { useDeleteChapter } from "../hooks/mutations/useDeleteChapter";
import { useUpdateChapter } from "../hooks/mutations/useUpdateChapter";
import type { SubmitHandler } from "react-hook-form";
import { segmentToBlock, syncChapterSegments } from "../api/segmentsApi";
import {
  createSegment,
  deleteSegment,
  updateSegment,
} from "@api/src/queries/segments.queries";

const EditChapterPage: React.FC = () => {
  const { courseId, chapterId } = useParams() as {
    courseId: string;
    chapterId: string;
  };

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation(["courses", "chapters", "common"]);
  const { toast } = useToast();
  const { handleApiError } = useHandleApiError();

  const chapterToFormValues = (
    chapter: Chapter,
    segments: Segment[],
  ): ChapterFormValues => ({
    id: chapter.id,
    order: chapter.order,
    translations: {
      en: {
        title:
          chapter.translations.find((t) => t.localeCode === "en")?.title ?? "",
      },
      nl: {
        title:
          chapter.translations.find((t) => t.localeCode === "nl")?.title ?? "",
      },
    },
    contentBlocks: segments
      .filter((segment) => segment.chapterId === chapter.id)
      .map(segmentToBlock),
  });

  const [{ data: chapter }, { data: segments }] = useSuspenseQueries({
    queries: [
      chapterQueryOptionsWithCache(courseId, chapterId, queryClient),
      segmentsQueryOptions(courseId, chapterId),
    ],
  });

  const deleteChapter = useDeleteChapter();
  const { mutateAsync: updateChapter } = useUpdateChapter();

  const removeChapterFromCache = () => {
    queryClient.setQueryData<Chapter[]>(
      courseChaptersQueryOptions(courseId).queryKey,
      (chapters) => chapters?.filter((c) => c.id !== chapterId),
    );
  };

  const saveSegmentsMutation = useMutation({
    mutationFn: (values: ChapterFormValues) =>
      syncChapterSegments({
        courseId,
        chapterId,
        originalSegments: segments,
        newFormValues: values,
        mutations: {
          createSegment: ({ courseId, chapterId, body }) =>
            createSegment(courseId, chapterId, body),
          updateSegment: ({ courseId, chapterId, segmentId, body }) =>
            updateSegment(courseId, chapterId, segmentId, body),
          deleteSegment: ({ courseId, chapterId, segmentId }) =>
            deleteSegment(courseId, chapterId, segmentId),
        },
      }),
    onError: (error: ApiError) => {
      handleApiError(error, {
        messages: {
          unexpectedError: t(($) => $.chapters.messages.error.mutating),
        },
      });
    },
  });

  const handleChapterDelete = () => {
    deleteChapter.mutate(
      { courseId, chapterId: chapter.id },
      {
        onSuccess: () => {
          toast({
            variant: "success",
            title: t(($) => $.common.status.success),
            description: t(($) => $.chapters.messages.success.deleted),
          });
          navigate(`/courses/${courseId}/overview`);
        },
        onError: (error: ApiError) => {
          handleApiError(error, {
            messages: {
              notFound: t(($) => $.chapters.messages.error.not_found),
              unexpectedError: t(($) => $.chapters.messages.error.deleting),
            },
            onNotFound: () => {
              removeChapterFromCache();
              navigate(`/courses/${courseId}/overview`);
            },
          });
        },
      },
    );
  };

  const handleSegmentErrors = (errors: unknown[]) => {
    const apiErrors = errors.map((error) => error as ApiError);

    for (const error of apiErrors) {
      if (error.code === ErrorCode.INVALID_FILE_TYPE) {
        return t(($) => $.chapters.messages.error.invalid_type);
      }

      if (error.code === ErrorCode.EXCEEDS_MAX_FILE_SIZE) {
        return t(($) => $.chapters.messages.error.exceeded_max_size);
      }
    }

    return t(($) => $.chapters.messages.error.partial_update_failed);
  };

  const handleSave: SubmitHandler<ChapterFormValues> = async (values) => {
    try {
      await updateChapter({
        courseId,
        chapterId,
        chapter: values,
      });
    } catch (error) {
      handleApiError(error as ApiError, {
        messages: {
          notFound: t(($) => $.chapters.messages.error.not_found),
          unexpectedError: t(($) => $.chapters.messages.error.mutating),
        },
      });
      // If the chapter didn't save. Either it got deleted or the input failed valid
      // In either case, return now and skip the segment sync below
      // the user's input is still there, so they can fix it and resubmit.
      return;
    }

    const result = await saveSegmentsMutation.mutateAsync(values);

    await queryClient.invalidateQueries({
      queryKey: segmentsQueryOptions(courseId, chapterId).queryKey,
    });

    if (result.failed > 0) {
      toast({
        variant: "destructive",
        title: t(($) => $.common.status.error),
        description: handleSegmentErrors(result.errors),
      });
      return;
    }

    toast({
      variant: "success",
      title: t(($) => $.common.status.success),
      description: t(($) => $.chapters.messages.success.updated),
    });

    navigate(`/courses/${courseId}/chapters/${chapterId}`);
  };

  return (
    <QueryBoundary errorMessage={t(($) => $.chapters.messages.error.loading)}>
      <ChapterForm
        initialData={chapterToFormValues(chapter, segments)}
        onSubmit={handleSave}
        onDelete={handleChapterDelete}
        isSubmitting={saveSegmentsMutation.isPending}
        isDeleting={deleteChapter.isPending}
      />
    </QueryBoundary>
  );
};

export default EditChapterPage;
