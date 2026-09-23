import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@ui/components/ui/button";
import { useToast } from "@ui/hooks/use-toast";
import {
  groupsQueryOptions,
  useSuspenseQueries,
  QueryBoundary,
  userQueryOptionsWithCache,
  removeUserFromUsersListQueries,
  useHandleApiError,
  type ApiError,
} from "@api/src";

import DashboardLayout from "../components/dashboard/DashboardLayout";
import EmployeeAccountForm from "../components/employees/EmployeeAccountForm";
import { DeleteConfirmationPopover } from "../components/common/DeleteConfirmationPopover";
import {
  getEditEmployeeAccountFormDefaultValues,
  type EmployeeAccountFormValues,
} from "../components/employees/employeeAccountFormValues";
import { useDeleteUser } from "../hooks/mutations/useDeleteUser";
import { useUpdateUser } from "../hooks/mutations/useUpdateUser";

const EditEmployeeForm: React.FC<{ userId: string }> = ({ userId }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { t } = useTranslation(["employees", "errors", "common"]);
  const { toast } = useToast();
  const { handleApiError } = useHandleApiError();

  const [{ data: user }, { data: groups }] = useSuspenseQueries({
    queries: [
      userQueryOptionsWithCache(userId, queryClient),
      groupsQueryOptions,
    ],
  });

  const { mutate: updateUser, isPending: isUpdating } = useUpdateUser();
  const deleteUser = useDeleteUser();
  const isSubmitting = isUpdating || deleteUser.isPending;
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const defaultValues = getEditEmployeeAccountFormDefaultValues({
    name: user.name,
    surname: user.surname,
    email: user.email ?? "",
    admin: user.admin ?? false,
    groups: user.groups.map((group) => group.id),
  });

  const handleSubmit = (values: EmployeeAccountFormValues) => {
    updateUser(
      { userId: user.id, values },
      {
        onSuccess: () => {
          toast({
            variant: "success",
            title: t(($) => $.common.status.success),
            description: t(($) => $.employees.form.messages.success.updated),
          });

          navigate("/employees");
        },
        onError: (error) =>
          handleApiError(error, {
            messages: {
              conflict: t(($) => $.employees.messages.error.email_taken),
              unexpectedError: t(
                ($) => $.employees.form.messages.error.update_failed,
              ),
            },
          }),
      },
    );
  };

  const removeUserFromCache = () => {
    removeUserFromUsersListQueries(queryClient, userId);
  };

  const handleDelete = () => {
    deleteUser.mutate(user.id, {
      onSuccess: () => {
        toast({
          variant: "success",
          title: t(($) => $.common.status.success),
          description: t(($) => $.employees.form.messages.success.deleted),
        });
        navigate("/employees");
      },
      onError: (error: ApiError) => {
        handleApiError(error, {
          messages: {
            unexpectedError: t(
              ($) => $.employees.form.messages.error.delete_failed,
            ),
          },
          onNotFound: () => {
            removeUserFromCache();
            navigate("/employees");
          },
        });
      },
    });
  };

  return (
    <section className="mx-auto w-full max-w-3xl pb-10">
      <h1 className="text-center text-3xl font-medium mt-10">
        {t(($) => $.employees.form.edit_heading)}
      </h1>

      <EmployeeAccountForm
        groups={groups}
        defaultValues={defaultValues}
        submitLabel={t(($) => $.common.actions.save)}
        isSubmitting={isSubmitting}
        onCancel={() => navigate("/employees")}
        onSubmit={handleSubmit}
      />

      <div className="flex justify-center">
        <Button
          type="button"
          variant="outline"
          className="min-w-36 rounded-lg border-gray-400 bg-white text-red-600 hover:bg-red-50 hover:text-red-700"
          disabled={deleteUser.isPending}
          onClick={() => setShowDeleteConfirmation(true)}
        >
          {t(($) => $.employees.form.actions.delete_user)}
        </Button>
      </div>

      {showDeleteConfirmation && (
        <DeleteConfirmationPopover
          open
          onOpenChange={(open) => {
            if (!open) {
              setShowDeleteConfirmation(false);
            }
          }}
          title={t(($) => $.employees.form.confirm.delete.title)}
          description={t(($) => $.employees.form.confirm.delete.description, {
            name: `${user.name} ${user.surname}`,
          })}
          deleteLabel={t(($) => $.employees.form.actions.delete_user)}
          cancelLabel={t(($) => $.common.actions.cancel)}
          onConfirm={handleDelete}
          isPending={deleteUser.isPending}
        />
      )}
    </section>
  );
};

const EditEmployeePage: React.FC = () => {
  const { userId } = useParams() as { userId: string };

  const { t } = useTranslation(["employees"]);

  return (
    <DashboardLayout>
      <QueryBoundary
        errorMessage={t(($) => $.employees.messages.error.loading)}
      >
        <EditEmployeeForm userId={userId} />
      </QueryBoundary>
    </DashboardLayout>
  );
};

export default EditEmployeePage;
