import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useToast } from "@ui/hooks/use-toast";
import { useUsers, useHandleApiError, type ApiError } from "@api/src";

import DashboardLayout from "../components/dashboard/DashboardLayout";
import GroupForm from "../components/groups/GroupForm";
import type { GroupFormValues } from "../components/groups/groupFormValues";
import { useCreateGroup } from "../hooks/mutations/useCreateGroup";

const CreateGroupPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(["groups", "errors", "common"]);
  const { toast } = useToast();
  const { handleApiError } = useHandleApiError();

  const { data: users = [] } = useUsers();
  const { mutate: createGroup, isPending } = useCreateGroup();

  const handleSubmit = (values: GroupFormValues) => {
    createGroup(values, {
      onSuccess: () => {
        toast({
          variant: "success",
          title: t(($) => $.common.status.success),
          description: t(($) => $.groups.messages.success.created),
        });
        navigate("/employees");
      },
      onError: (error: ApiError) =>
        handleApiError(error, {
          messages: {
            conflict: t(($) => $.groups.messages.error.name_taken),
            unexpectedError: t(($) => $.groups.messages.error.create_failed),
          },
        }),
    });
  };

  return (
    <DashboardLayout>
      <section className="mx-auto w-full min-w-0 max-w-4xl">
        <h2 className="text-center text-3xl font-medium mt-10">
          {t(($) => $.groups.create_heading)}
        </h2>

        <GroupForm
          users={users}
          submitLabel={t(($) => $.common.actions.save)}
          onCancel={() => navigate("/employees")}
          onSubmit={handleSubmit}
          isSubmitting={isPending}
        />
      </section>
    </DashboardLayout>
  );
};

export default CreateGroupPage;
