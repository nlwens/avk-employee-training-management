import React, { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useToast } from "ui/hooks/use-toast";

import {
  type ApiError,
  courseQueryOptions,
  coursesListQueryKey,
  groupsQueryOptions,
  QueryBoundary,
  useHandleApiError,
  useSuspenseQueries,
  useQueryClient,
} from "api/src";
import CourseGroupsSection from "../components/courses/CourseGroupsSection";
import { useUpdateCourse } from "../hooks/mutations/useUpdateCourse";

const CourseGroupsContent: React.FC<{ courseId: string }> = ({ courseId }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation(["courses", "groups", "common"]);
  const { handleApiError } = useHandleApiError();

  useEffect(() => {
    // TODO: fix this with #180. Also remove the optional operators below.
    void queryClient.invalidateQueries({
      queryKey: courseQueryOptions(courseId).queryKey,
      exact: true,
    });
  }, [queryClient, courseId]);

  const [{ data: course }, { data: groups }] = useSuspenseQueries({
    queries: [courseQueryOptions(courseId), groupsQueryOptions],
  });

  const updateCourse = useUpdateCourse();
  const selectedGroupIds = course.groups?.map((group) => group.id) ?? [];

  const removeCourseFromCache = () => {
    queryClient.removeQueries(courseQueryOptions(courseId));
    void queryClient.invalidateQueries({ queryKey: coursesListQueryKey });
  };

  const handleSave = (groupIds: string[]) => {
    updateCourse.mutate(
      { courseId: course.id, body: { groups: groupIds } },
      {
        onSuccess: () => {
          toast({
            variant: "success",
            title: t(($) => $.common.status.success),
            description: t(($) => $.courses.messages.success.groups_saved),
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

  if (groups.length === 0) {
    return (
      <p className="py-20 text-center text-gray-500">
        {t(($) => $.groups.empty)}{" "}
        <Link
          to="/employees/groups/create"
          className="underline hover:text-gray-700"
        >
          {t(($) => $.groups.create_heading)}
        </Link>
      </p>
    );
  }

  return (
    <CourseGroupsSection
      key={selectedGroupIds.join(",")}
      groups={groups}
      selectedGroupIds={selectedGroupIds}
      isSaving={updateCourse.isPending}
      onSave={handleSave}
      onCancel={() => navigate(`/courses/${courseId}/overview`)}
    />
  );
};

const CourseGroupsPage: React.FC = () => {
  const { courseId } = useParams() as { courseId: string };
  const { t } = useTranslation(["groups"]);

  return (
    <QueryBoundary errorMessage={t(($) => $.groups.messages.error.loading)}>
      <CourseGroupsContent courseId={courseId} />
    </QueryBoundary>
  );
};

export default CourseGroupsPage;
