import {
  API,
  useMutation,
  useQueryClient,
  type ApiError,
  type User,
  userQueryOptions,
  upsertUserInUsersListQueries,
} from "@api/src";
import type { EmployeeAccountFormValues } from "../../components/employees/employeeAccountFormValues.ts";

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation<User, ApiError, EmployeeAccountFormValues>({
    mutationFn: (values) => API.post<User>("/users", values),

    onSuccess: (user) => {
      queryClient.setQueryData<User>(userQueryOptions(user.id).queryKey, user);

      upsertUserInUsersListQueries(queryClient, user);
    },
  });
};
