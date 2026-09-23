import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useToast } from "ui/hooks/use-toast";
import { useGroups, useHandleApiError, type ApiError } from "api/src";

import DashboardLayout from "../components/dashboard/DashboardLayout";
import EmployeeAccountForm from "../components/employees/EmployeeAccountForm";
import type { EmployeeAccountFormValues } from "../components/employees/employeeAccountFormValues";
import { useCreateUser } from "../hooks/mutations/useCreateUser";

const CreateEmployeePage = () => {
  const navigate = useNavigate();

  const { t } = useTranslation(["employees", "errors", "common"]);
  const { toast } = useToast();
  const { handleApiError } = useHandleApiError();

  const { data: groups = [] } = useGroups();

  const { mutate: createUser, isPending } = useCreateUser();

  const handleSubmit = (values: EmployeeAccountFormValues) => {
    createUser(values, {
      onSuccess: () => {
        toast({
          variant: "success",
          title: t(($) => $.common.status.success),
          description: t(($) => $.employees.form.messages.success.created),
        });
        navigate("/employees");
      },
      onError: (error: ApiError) =>
        handleApiError(error, {
          messages: {
            conflict: t(($) => $.employees.messages.error.email_taken),
            unexpectedError: t(
              ($) => $.employees.form.messages.error.create_failed,
            ),
          },
        }),
    });
  };

  return (
    <DashboardLayout>
      <section className="mx-auto w-full max-w-3xl">
        <h2 className="text-center text-3xl font-medium mt-10">
          {t(($) => $.employees.form.create_heading)}
        </h2>

        <EmployeeAccountForm
          groups={groups}
          isSubmitting={isPending}
          onCancel={() => navigate("/employees")}
          onSubmit={handleSubmit}
        />
      </section>
    </DashboardLayout>
  );
};

export default CreateEmployeePage;
