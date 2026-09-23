import {
  API,
  useMutation,
  useQueryClient,
  type ApiError,
  type User,
  userQueryOptions,
  upsertUserInUsersListQueries,
} from "@api/src";
import type { EmployeeAccountFormValues } from "src/components/employees/employeeAccountFormValues";

interface UpdateUserVariables {
  userId: string;
  values: EmployeeAccountFormValues;
}

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation<User, ApiError, UpdateUserVariables>({
    mutationFn: ({ userId, values }) =>
      API.patch<User>(`/users/${userId}`, {
        name: values.name,
        surname: values.surname,
        email: values.email,
        admin: values.admin,
        groups: values.groups,
        ...(values.password ? { password: values.password } : {}),
      }),

    onSuccess: (user, { userId }) => {
      queryClient.setQueryData<User>(userQueryOptions(userId).queryKey, user);

      upsertUserInUsersListQueries(queryClient, user);
    },
  });
};
