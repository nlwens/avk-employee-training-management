import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API, type ApiError } from "../../api";
import { type User } from "../../types/user";
import { usersQueryOptions } from "../../queries/users.queries";

interface ChangePasswordVariables {
  currentPassword: string;
  password: string;
}

export const useChangePassword = () => {
  const queryClient = useQueryClient();

  return useMutation<User, ApiError, ChangePasswordVariables>({
    mutationFn: async ({ currentPassword, password }) =>
      API.patch<User>("/users/@me", {
        currentPassword,
        password,
      }),

    onSuccess: (updatedUser: User) => {
      const cacheKey = usersQueryOptions().queryKey;

      const previous = queryClient.getQueryData<User[]>(cacheKey) ?? [];
      queryClient.setQueryData(cacheKey, [...previous, updatedUser]);
    },
  });
};
