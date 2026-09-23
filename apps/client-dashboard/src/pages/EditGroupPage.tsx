import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useToast } from "ui/hooks/use-toast";
import ToastAndNavigate from "ui/components/ToastAndNavigate";
import {
  groupsQueryOptions,
  usersQueryOptions,
  useSuspenseQueries,
  useQueryClient,
  QueryBoundary,
  type ApiError,
  type Group,
  useHandleApiError,
} from "api/src";

import DashboardLayout from "../components/dashboard/DashboardLayout";
import GroupForm from "../components/groups/GroupForm";
import {
  getGroupFormDefaultValues,
  type GroupFormValues,
} from "../components/groups/groupFormValues";
import { useUpdateGroup } from "../hooks/mutations/useUpdateGroup";

const EditGroupForm: React.FC<{ groupId: string }> = ({ groupId }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { t } = useTranslation(["employees", "groups", "errors", "common"]);
  const { toast } = useToast();
  const { handleApiError } = useHandleApiError();

  const [{ data: groups }, { data: users }] = useSuspenseQueries({
    queries: [groupsQueryOptions, usersQueryOptions()],
  });

  const { mutate: updateGroup, isPending } = useUpdateGroup();

  const group = groups.find((item) => item.id === groupId);

  if (!group) {
    return (
      <ToastAndNavigate
        message={t(($) => $.errors.resource_not_found)}
        to="/employees"
      />
    );
  }

  const defaultValues = getGroupFormDefaultValues({
    name: group.name,
    userIds: users
      .filter((user) =>
        user.groups.some((userGroup) => userGroup.id === group.id),
      )
      .map((user) => user.id),
  });

  const handleSubmit = (values: GroupFormValues) => {
    updateGroup(
      { groupId: group.id, values },
      {
        onSuccess: () => {
          toast({
            variant: "success",
            title: t(($) => $.common.status.success),
            description: t(($) => $.groups.messages.success.updated),
          });
          navigate("/employees");
        },
        onError: (error: ApiError) => {
          handleApiError(error, {
            onNotFound: () => {
              queryClient.setQueryData<Group[]>(
                groupsQueryOptions.queryKey,
                (groups) => groups?.filter((group) => group.id !== groupId),
              );
              navigate("/employees");
            },
          });
        },
      },
    );
  };

  return (
    <section className="mx-auto w-full min-w-0 max-w-4xl">
      <h2 className="text-center text-3xl font-medium mt-10">
        {t(($) => $.groups.actions.edit)}
      </h2>

      <GroupForm
        users={users}
        defaultValues={defaultValues}
        submitLabel={t(($) => $.common.actions.save)}
        onCancel={() => navigate("/employees")}
        onSubmit={handleSubmit}
        isSubmitting={isPending}
      />
    </section>
  );
};

const EditGroupPage: React.FC = () => {
  const { groupId } = useParams() as { groupId: string };

  const { t } = useTranslation(["employees", "errors"]);

  return (
    <DashboardLayout>
      <QueryBoundary
        errorMessage={t(($) => $.employees.messages.error.loading)}
      >
        <EditGroupForm groupId={groupId} />
      </QueryBoundary>
    </DashboardLayout>
  );
};

export default EditGroupPage;
