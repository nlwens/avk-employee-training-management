import { queryOptions } from "@tanstack/react-query";
import { API } from "../api";
import type { Group } from "../types/group";

export const groupsQueryOptions = queryOptions({
  queryKey: ["groups"],
  queryFn: () => API.get<Group[]>("/groups"),
});
