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

export const useCreateGroup = () => {
  const queryClient = useQueryClient();

  return useMutation<Group, ApiError, GroupFormValues>({
    mutationFn: (values) =>
      API.post<Group>("/groups", {
        name: values.name,
        ...(values.userIds.length > 0 ? { users: values.userIds } : {}),
      }),

    onSuccess: (createdGroup, values) => {
      const previous = queryClient.getQueryData<Group[]>(["groups"]) ?? [];
      queryClient.setQueryData(["groups"], [...previous, createdGroup]);

      if (values.userIds.length > 0) {
        queryClient.setQueriesData<User[]>(
          { queryKey: usersListQueryKey },
          (users) =>
            users?.map((user) =>
              values.userIds.includes(user.id)
                ? {
                    ...user,
                    groups: user.groups.some(
                      (group) => group.id === createdGroup.id,
                    )
                      ? user.groups
                      : [...user.groups, createdGroup],
                  }
                : user,
            ),
        );
      }
    },
  });
};
