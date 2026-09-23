import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useToast } from "ui/hooks/use-toast";
import { useHandleApiError, type ApiError } from "api/src";

import CourseForm from "../components/courses/CourseForm";
import {
  getCourseFormDefaultValues,
  type CourseFormValues,
} from "../components/courses/courseFormValues";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import { useCreateCourse } from "../hooks/mutations/useCreateCourse";

const CreateCoursePage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(["courses", "errors", "common"]);
  const { toast } = useToast();
  const { handleApiError } = useHandleApiError();

  const { mutate: createCourse, isPending } = useCreateCourse();

  const handleSubmit = (values: CourseFormValues) => {
    createCourse(values, {
      onSuccess: (course) => {
        toast({
          variant: "success",
          title: t(($) => $.common.status.success),
          description: t(($) => $.courses.messages.success.created),
        });

        navigate(`/courses/${course.id}/overview`);
      },
      onError: (error: ApiError) =>
        handleApiError(error, {
          messages: {
            unexpectedError: t(($) => $.courses.messages.error.saving),
          },
        }),
    });
  };

  return (
    <DashboardLayout>
      <section className="pb-10">
        <h2 className="mt-10 text-center text-3xl font-medium">
          {t(($) => $.courses.form.create_heading)}
        </h2>

        <CourseForm
          defaultValues={getCourseFormDefaultValues()}
          submitLabel={t(($) => $.courses.actions.create)}
          onCancel={() => navigate("/courses")}
          onSubmit={handleSubmit}
          isSubmitting={isPending}
        />
      </section>
    </DashboardLayout>
  );
};

export default CreateCoursePage;
