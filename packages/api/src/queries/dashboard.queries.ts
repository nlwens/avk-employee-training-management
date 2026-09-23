import { queryOptions } from "@tanstack/react-query";
import { API } from "../api";
import type { DashboardStats } from "../types/dashboard";

export const dashboardStatsQueryOptions = queryOptions({
  queryKey: ["dashboard", "stats"],
  queryFn: () => API.get<DashboardStats>("/dashboard/stats"),
});
