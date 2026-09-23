import { useQuery } from "@tanstack/react-query";
import { groupsQueryOptions } from "../../queries/groups.queries";

export const useGroups = () => {
  return useQuery(groupsQueryOptions);
};
