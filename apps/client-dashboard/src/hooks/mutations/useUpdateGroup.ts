import {
  API,
  useMutation,
  useQueryClient,
  usersListQueryKey,
  type ApiError,
  type Group,
  type User,
} from "@api/src";
import type { GroupFormValues } from "src/components/groups/groupFormValues";

interface UpdateGroupVariables {
  groupId: string;
  values: GroupFormValues;
}

export const useUpdateGroup = () => {
  const queryClient = useQueryClient();

  return useMutation<Group, ApiError, UpdateGroupVariables>({
    mutationFn: ({ groupId, values }) =>
      API.patch<Group>(`/groups/${groupId}`, {
        name: values.name,
        users: values.userIds,
      }),

    onSuccess: (updatedGroup, { groupId, values }) => {
      queryClient.setQueryData<Group[]>(["groups"], (groups) =>
        (groups ?? []).map((group) =>
          group.id === groupId ? updatedGroup : group,
        ),
      );

      const selectedUserIds = new Set(values.userIds);

      queryClient.setQueriesData<User[]>(
        { queryKey: usersListQueryKey },
        (users) =>
          users?.map((user) => {
            const hadGroup = user.groups.some((group) => group.id === groupId);
            const shouldHaveGroup = selectedUserIds.has(user.id);

            if (hadGroup && shouldHaveGroup) {
              const existingGroup = user.groups.find(
                (group) => group.id === groupId,
              );

              // If the user stays in the same group, skip unless the group was renamed
              // The table shows names from user.groups, not the groups list
              if (existingGroup?.name === updatedGroup.name) {
                return user;
              }

              return {
                ...user,
                groups: user.groups.map((group) =>
                  group.id === groupId ? updatedGroup : group,
                ),
              };
            }

            if (shouldHaveGroup) {
              return {
                ...user,
                groups: [...user.groups, updatedGroup],
              };
            }

            if (hadGroup) {
              return {
                ...user,
                groups: user.groups.filter((group) => group.id !== groupId),
              };
            }

            return user;
          }),
      );
    },
  });
};
