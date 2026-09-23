import {
  API,
  useMutation,
  useQueryClient,
  type ApiError,
  type Group,
} from "@api/src";

export const useDeleteGroup = () => {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (groupId) => API.delete<void>(`/groups/${groupId}`),

    onSuccess: (_data, groupId) => {
      queryClient.setQueryData<Group[]>(["groups"], (groups) =>
        (groups ?? []).filter((group) => group.id !== groupId),
      );
    },
  });
};
