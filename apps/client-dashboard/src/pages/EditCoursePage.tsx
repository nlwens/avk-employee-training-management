import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useToast } from "ui/hooks/use-toast";
import {
  type ApiError,
  courseQueryOptions,
  coursesListQueryKey,
  useCourse,
  useHandleApiError,
  useQueryClient,
} from "api/src";
import CourseForm from "../components/courses/CourseForm";
import {
  type CourseFormValues,
  getCourseFormDefaultValuesFromCourse,
  mapCourseFormValuesToUpdateCourse,
} from "../components/courses/courseFormValues";
import { useUpdateCourse } from "../hooks/mutations/useUpdateCourse";

const EditCoursePage: React.FC = () => {
  const { courseId } = useParams() as { courseId: string };

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { t } = useTranslation(["courses", "common"]);
  const { toast } = useToast();
  const { handleApiError } = useHandleApiError();

  const { data: course } = useCourse(courseId);
  const { mutate: updateCourse, isPending } = useUpdateCourse();

  const removeCourseFromCache = () => {
    queryClient.removeQueries(courseQueryOptions(courseId));
    void queryClient.invalidateQueries({ queryKey: coursesListQueryKey });
  };

  const handleSubmit = (values: CourseFormValues) => {
    updateCourse(
      {
        courseId: course.id,
        body: mapCourseFormValuesToUpdateCourse(values),
      },
      {
        onSuccess: () => {
          toast({
            variant: "success",
            title: t(($) => $.common.status.success),
            description: t(($) => $.courses.messages.success.updated),
          });
          navigate(`/courses/${courseId}/overview`);
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

  return (
    <section className="pb-10">
      <h1 className="mt-10 text-center text-3xl font-medium">
        {t(($) => $.courses.form.edit_heading)}
      </h1>

      <CourseForm
        defaultValues={getCourseFormDefaultValuesFromCourse(course)}
        submitLabel={t(($) => $.common.actions.save)}
        onCancel={() => navigate(`/courses/${course.id}/overview`)}
        onSubmit={handleSubmit}
        isSubmitting={isPending}
      />
    </section>
  );
};

export default EditCoursePage;
