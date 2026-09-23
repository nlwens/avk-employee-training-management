import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLocalize } from "i18n";
import { useToast } from "ui/hooks/use-toast";

import { useSuspenseQueries, useQueryClient } from "@tanstack/react-query";
import {
  type ApiError,
  courseQueryOptions,
  courseStatsQueryOptions,
  coursesListQueryKey,
  useHandleApiError,
  usePrefetchQuestions,
} from "api/src";
import { Button } from "ui/components/ui/button";
import CourseInformationSection from "../components/courses/CourseInformationSection";
import { ConfirmationPopover } from "../components/common/ConfirmationPopover";
import { useUpdateCourse } from "../hooks/mutations/useUpdateCourse";
import QuizStatisticsSection from "../components/courses/QuizStatisticsSection";

const actionButtonClassName = "bg-avk-blue text-white hover:bg-avk-blue/80";

type PublishStepType = "public_warning" | "confirm";

interface PublishConfirmationPopoverProps {
  hasNoGroups: boolean;
  disabled?: boolean;
  onConfirm: () => void;
}

const PublishConfirmationPopover: React.FC<PublishConfirmationPopoverProps> = ({
  hasNoGroups,
  disabled = false,
  onConfirm,
}) => {
  const { t } = useTranslation(["courses", "common"]);

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<PublishStepType>("confirm");

  const handleOpenChange = (nextOpen: boolean) => {
    // Start on the public-course warning when the course has no groups,
    // otherwise go straight to the regular publish confirmation.
    if (nextOpen) {
      setStep(hasNoGroups ? "public_warning" : "confirm");
    }

    setOpen(nextOpen);
  };

  const handleConfirm = () => {
    setOpen(false);
    onConfirm();
  };

  const publishButton = (
    <Button
      type="button"
      variant="secondary"
      className={actionButtonClassName}
      disabled={disabled}
    >
      {t(($) => $.courses.actions.publish)}
    </Button>
  );

  // First step, shown only when the course has no groups: warn that the course
  // will be public, then advance to the regular publish confirmation.
  if (step === "public_warning") {
    return (
      <ConfirmationPopover
        open={open}
        onOpenChange={handleOpenChange}
        trigger={publishButton}
        message={t(($) => $.courses.confirm.publish.public_message)}
        cancelLabel={t(($) => $.courses.actions.cancel)}
        confirmLabel={t(($) => $.common.actions.continue)}
        confirmClassName={actionButtonClassName}
        onConfirm={() => setStep("confirm")}
      />
    );
  }

  return (
    <ConfirmationPopover
      open={open}
      onOpenChange={handleOpenChange}
      trigger={publishButton}
      message={t(($) => $.courses.confirm.publish.message)}
      cancelLabel={t(($) => $.courses.actions.cancel)}
      confirmLabel={t(($) => $.courses.actions.publish)}
      confirmClassName={actionButtonClassName}
      onConfirm={handleConfirm}
    />
  );
};

const CourseDetailsPage: React.FC = () => {
  const { courseId } = useParams() as { courseId: string };

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { t } = useTranslation(["courses", "common"]);
  const { localize } = useLocalize();
  const { toast } = useToast();
  const { handleApiError } = useHandleApiError();

  const [{ data: course }, { data: stats }] = useSuspenseQueries({
    queries: [courseQueryOptions(courseId), courseStatsQueryOptions(courseId)],
  });

  const { mutate: updateCourse, isPending: isUpdating } = useUpdateCourse();

  const removeCourseFromCache = () => {
    queryClient.removeQueries(courseQueryOptions(courseId));
    queryClient.removeQueries(courseStatsQueryOptions(courseId));
    void queryClient.invalidateQueries({ queryKey: coursesListQueryKey });
  };

  const handlePublishStatusChange = (published: boolean) => {
    updateCourse(
      { courseId: course.id, body: { published } },
      {
        onSuccess: () => {
          toast({
            variant: "success",
            title: t(($) => $.common.status.success),
            description: published
              ? t(($) => $.courses.messages.success.published)
              : t(($) => $.courses.messages.success.archived),
          });
        },
        onError: (error: ApiError) => {
          handleApiError(error, {
            messages: {
              notFound: t(
                ($) => $.courses.messages.error.not_found_changes_not_saved,
              ),
              unexpectedError: t(($) => $.courses.messages.error.saving),
            },
            onNotFound: () => {
              removeCourseFromCache();
              navigate("/courses");
            },
          });
        },
      },
    );
  };

  // Prefetch the quiz information for editing.
  usePrefetchQuestions({ courseId });

  return (
    <div className="space-y-10">
      <CourseInformationSection
        description={localize(course.translations, "content")}
        onEdit={() => navigate(`/courses/${courseId}/edit`)}
      />

      <QuizStatisticsSection
        questionsCount={course.questionsCount}
        averageScorePercentage={stats.averageScore}
        showTitle
      />

      <div className="flex justify-end gap-3">
        {course.published ? (
          <Button
            type="button"
            variant="secondary"
            className={actionButtonClassName}
            disabled={isUpdating}
            onClick={() => handlePublishStatusChange(false)}
          >
            {t(($) => $.courses.actions.archive)}
          </Button>
        ) : (
          <PublishConfirmationPopover
            hasNoGroups={course.groups.length === 0}
            disabled={isUpdating}
            onConfirm={() => handlePublishStatusChange(true)}
          />
        )}
      </div>
    </div>
  );
};

export default CourseDetailsPage;
