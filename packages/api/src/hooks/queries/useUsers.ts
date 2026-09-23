import { useQuery } from "@tanstack/react-query";

import { usersQueryOptions } from "../../queries/users.queries";

export const useUsers = (search?: string | null) => {
  return useQuery(usersQueryOptions({ search }));
};
