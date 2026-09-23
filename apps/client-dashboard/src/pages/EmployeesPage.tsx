import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import {
  groupsQueryOptions,
  usersQueryOptions,
  usePrefetchQuery,
  useSuspenseQuery,
  useQueryClient,
  QueryBoundary,
  type Group,
  type ApiError,
  useHandleApiError,
  ErrorCode,
} from "@api/src";
import { SearchInput } from "@ui/components/SearchInput";
import LoadingSpinner from "@ui/components/LoadingSpinner";
import { useToast } from "@ui/hooks/use-toast";
import { useUrlSearchParam } from "@ui/hooks/useUrlSearchParam";

import { Button } from "@ui/components/ui/button";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import GroupsSidebar from "../components/employees/GroupsSidebar";
import EmployeesTable from "../components/employees/EmployeesTable";
import { DeleteConfirmationPopover } from "../components/common/DeleteConfirmationPopover";
import { useDeleteGroup } from "../hooks/mutations/useDeleteGroup";

interface EmployeesTableContentProps {
  searchQuery: string;
  selectedGroupId: string | null;
  onEdit: (userId: string) => void;
  onViewDetails: (userId: string) => void;
}

const EmployeesTableContent: React.FC<EmployeesTableContentProps> = ({
  searchQuery,
  selectedGroupId,
  onEdit,
  onViewDetails,
}) => {
  const { data: users } = useSuspenseQuery(
    usersQueryOptions({ search: searchQuery }),
  );

  const filteredUsers = users.filter((user) => {
    return (
      selectedGroupId === null ||
      user.groups.some((group) => group.id === selectedGroupId)
    );
  });

  return (
    <EmployeesTable
      users={filteredUsers}
      onEdit={onEdit}
      onViewDetails={onViewDetails}
    />
  );
};

const EmployeesContent: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { t } = useTranslation(["employees", "groups", "common"]);
  const { toast } = useToast();
  const { handleApiError } = useHandleApiError();

  const searchQuery = useUrlSearchParam("search");

  usePrefetchQuery(usersQueryOptions({ search: searchQuery }));

  const { data: groups } = useSuspenseQuery(groupsQueryOptions);

  const {
    mutate: deleteGroup,
    reset: resetDeleteError,
    isPending: isDeletingGroup,
  } = useDeleteGroup();

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);

  const handleDeleteGroupRequest = (groupId: string) => {
    const group = groups.find((item) => item.id === groupId);

    if (!group) {
      return;
    }

    resetDeleteError();
    setGroupToDelete(group);
  };

  const handleDeleteGroupConfirm = () => {
    if (!groupToDelete) {
      return;
    }

    const deletedGroupId = groupToDelete.id;

    deleteGroup(deletedGroupId, {
      onSuccess: () => {
        toast({
          variant: "success",
          title: t(($) => $.common.status.success),
          description: t(($) => $.groups.messages.success.deleted),
        });

        if (selectedGroupId === deletedGroupId) {
          setSelectedGroupId(null);
        }

        setGroupToDelete(null);
      },
      onError: (error: ApiError) => {
        if (
          error.statusCode === 400 &&
          error.code === ErrorCode.GROUP_HAS_ASSIGNMENTS
        ) {
          toast({
            description: t(($) => $.groups.messages.error.delete_not_empty),
          });
        } else {
          handleApiError(error, {
            onNotFound: () => {
              queryClient.setQueryData<Group[]>(
                groupsQueryOptions.queryKey,
                (groups) => groups?.filter((g) => g.id !== groupToDelete?.id),
              );
            },
          });
        }
      },
    });
  };

  return (
    <>
      <div className="flex flex-col gap-6 pt-6 lg:flex-row lg:gap-8">
        <GroupsSidebar
          groups={groups}
          selectedGroupId={selectedGroupId}
          onSelect={setSelectedGroupId}
          onAddGroup={() => navigate("/employees/groups/create")}
          onEditGroup={(groupId) =>
            navigate(`/employees/groups/${groupId}/edit`)
          }
          onDeleteGroup={handleDeleteGroupRequest}
        />

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              className="w-full gap-2 bg-avk-blue uppercase text-white hover:bg-avk-blue/80 sm:w-auto"
              onClick={() => navigate("/employees/create")}
            >
              {t(($) => $.common.actions.add)}
              <Plus size={18} aria-hidden="true" />
            </Button>

            <SearchInput
              queryParamName="search"
              placeholder={t(($) => $.employees.filters.search_user)}
              className="w-full sm:w-44"
              inputClassName="text-sm"
            />
          </div>

          <QueryBoundary
            errorMessage={t(($) => $.employees.messages.error.loading)}
            loadingFallback={<LoadingSpinner size="lg" className="py-10" />}
          >
            <EmployeesTableContent
              searchQuery={searchQuery}
              selectedGroupId={selectedGroupId}
              onEdit={(userId) => navigate(`/employees/${userId}/edit`)}
              onViewDetails={(userId) => navigate(`/employees/${userId}`)}
            />
          </QueryBoundary>
        </div>
      </div>

      {groupToDelete && (
        <DeleteConfirmationPopover
          open
          onOpenChange={(open) => {
            if (!open) {
              setGroupToDelete(null);
              resetDeleteError();
            }
          }}
          title={t(($) => $.groups.confirm.delete.title)}
          description={t(($) => $.groups.confirm.delete.description, {
            name: groupToDelete.name,
          })}
          deleteLabel={t(($) => $.groups.actions.delete)}
          cancelLabel={t(($) => $.common.actions.cancel)}
          onConfirm={handleDeleteGroupConfirm}
          isPending={isDeletingGroup}
        />
      )}
    </>
  );
};

const EmployeesPage: React.FC = () => {
  const { t } = useTranslation(["employees"]);

  return (
    <DashboardLayout>
      <section>
        <QueryBoundary
          errorMessage={t(($) => $.employees.messages.error.loading)}
        >
          <EmployeesContent />
        </QueryBoundary>
      </section>
    </DashboardLayout>
  );
};

export default EmployeesPage;
