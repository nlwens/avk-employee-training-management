import {
  API,
  useMutation,
  useQueryClient,
  userQueryOptions,
  removeUserFromUsersListQueries,
  type ApiError,
} from "@api/src";

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (userId) => API.delete<void>(`/users/${userId}`),

    onSuccess: (_data, userId) => {
      queryClient.removeQueries({
        queryKey: userQueryOptions(userId).queryKey,
      });

      removeUserFromUsersListQueries(queryClient, userId);
    },
  });
};
