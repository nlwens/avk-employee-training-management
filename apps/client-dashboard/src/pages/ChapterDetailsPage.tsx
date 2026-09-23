import React from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLocalize } from "i18n";
import {
  buildFileUrl,
  chapterQueryOptionsWithCache,
  QueryBoundary,
  segmentsQueryOptions,
  useQueryClient,
  useSuspenseQueries,
} from "api/src";
import { Button } from "ui/components/ui/button";
import Segments from "ui/components/segments/Segments";

const ChapterDetailsPage: React.FC = () => {
  const { courseId, chapterId } = useParams() as {
    courseId: string;
    chapterId: string;
  };

  const queryClient = useQueryClient();
  const { t } = useTranslation(["courses", "chapters"]);
  const { localize } = useLocalize();

  const [{ data: chapter }, { data: segments }] = useSuspenseQueries({
    queries: [
      chapterQueryOptionsWithCache(courseId, chapterId, queryClient),
      segmentsQueryOptions(courseId, chapterId),
    ],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 border-b border-gray-300 pb-3">
        <span className="text-lg font-medium">
          {localize(chapter.translations, "title")}
        </span>

        <Link to={`/courses/${courseId}/chapters/${chapterId}/edit`}>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-7 rounded-md bg-avk-blue-light px-5 text-xs text-black hover:bg-avk-blue-light/80"
            aria-label={t(($) => $.chapters.actions.edit)}
          >
            {t(($) => $.courses.actions.edit)}
          </Button>
        </Link>
      </div>

      <div className="space-y-6 p-1">
        <QueryBoundary
          errorMessage={t(($) => $.chapters.messages.error.loading)}
        >
          <Segments
            segments={segments.map((segment) => ({
              ...segment,
              url: buildFileUrl({
                filename: localize(segment.files, "name"),
                provider: localize(segment.files, "provider"),
              }),
            }))}
          />
        </QueryBoundary>
      </div>
    </div>
  );
};

export default ChapterDetailsPage;
