import type {
  QueryClient,
  QueryKey,
  UseSuspenseQueryOptions,
} from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import queryString from "query-string";

import { API } from "../api";
import { downloadCourseStatsCsv } from "../download";
import type { User } from "../types/user";
import type { SearchQueryOptions } from "./search.query";

export type UsersQueryOptions = SearchQueryOptions;

/**
 * Shared prefix for every users-list query.
 *
 * Keep all list variants under this key so mutations can update every cached
 * users list, including searched lists such as ["users", "list", { search }].
 */
export const usersListQueryKey = ["users", "list"] as const;

const usersQueryParams = ({ search }: UsersQueryOptions = {}) => {
  const trimmedSearch = search?.trim() ?? "";

  return {
    ...(trimmedSearch && { search: trimmedSearch }),
  } satisfies UsersQueryOptions;
};

export const usersQueryOptions = ({ search }: UsersQueryOptions = {}) => {
  const params = usersQueryParams({ search });

  return queryOptions({
    queryKey: [...usersListQueryKey, params],
    queryFn: () =>
      API.get<User[]>(
        queryString.stringifyUrl(
          { url: "/users", query: params },
          { skipNull: true },
        ),
      ),
  });
};

export const usersSearchQueryOptions = usersQueryOptions;

const usersQueryOptionsFromQueryKey = (
  queryKey: QueryKey,
): UsersQueryOptions => {
  const params = queryKey[usersListQueryKey.length];

  if (params && typeof params === "object" && !Array.isArray(params)) {
    return params as UsersQueryOptions;
  }

  return {};
};

/**
 * Mirrors the backend user search rule for local cache updates.
 *
 * This is only used after mutations so we can update cached search results
 * without refetching. Real search results still come from the server.
 */
export const userMatchesUsersQuery = (
  user: User,
  { search }: UsersQueryOptions = {},
) => {
  const keywords =
    search?.trim().toLowerCase().split(/\s+/).filter(Boolean) ?? [];

  if (keywords.length === 0) {
    return true;
  }

  const name = user.name.toLowerCase();
  const surname = user.surname.toLowerCase();

  return keywords.some(
    (keyword) => name.includes(keyword) || surname.includes(keyword),
  );
};

/**
 * Updates every cached users-list variant after creating or updating a user.
 *
 * A user can move in or out of searched lists when their name/surname changes,
 * so this updates existing entries, removes non-matches, and adds new matches.
 */
export const upsertUserInUsersListQueries = (
  queryClient: QueryClient,
  user: User,
) => {
  const entries = queryClient.getQueriesData<User[]>({
    queryKey: usersListQueryKey,
  });

  for (const [queryKey] of entries) {
    const queryOptions = usersQueryOptionsFromQueryKey(queryKey);
    const matchesQuery = userMatchesUsersQuery(user, queryOptions);

    queryClient.setQueryData<User[]>(queryKey, (users) => {
      if (!users) {
        return users;
      }

      const userExists = users.some((existing) => existing.id === user.id);

      if (!matchesQuery) {
        return users.filter((existing) => existing.id !== user.id);
      }

      if (userExists) {
        return users.map((existing) =>
          existing.id === user.id ? user : existing,
        );
      }

      return [...users, user];
    });
  }
};

/**
 * Removes a deleted user from every cached users-list variant.
 */
export const removeUserFromUsersListQueries = (
  queryClient: QueryClient,
  userId: string,
) => {
  queryClient.setQueriesData<User[]>({ queryKey: usersListQueryKey }, (users) =>
    users?.filter((user) => user.id !== userId),
  );
};

export const userQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ["users", userId],
    queryFn: () => API.get<User>(`/users/${userId}`),
  });

const findUserInCache = (
  userId: string,
  queryClient: QueryClient,
): { user: User; time: number | undefined } | undefined => {
  const entries = queryClient.getQueriesData<User[]>({
    queryKey: usersListQueryKey,
  });

  for (const [key, users] of entries) {
    const found = users?.find((user) => user.id === userId);

    if (found) {
      return {
        user: found,
        time: queryClient.getQueryState(key)?.dataUpdatedAt,
      };
    }
  }

  return undefined;
};

/**
 * Seeds the user-detail query from any cached users list.
 *
 * This keeps navigation from the employee list to the detail page instant,
 * including when the list came from a searched users query.
 */
export const userQueryOptionsWithCache = (
  userId: string,
  queryClient: QueryClient,
): UseSuspenseQueryOptions<User, unknown> => ({
  ...(userQueryOptions(userId) as UseSuspenseQueryOptions<User, unknown>),
  initialData: () => findUserInCache(userId, queryClient)?.user,
  initialDataUpdatedAt: () => findUserInCache(userId, queryClient)?.time,
});

export const userCourseStatsDownloadQueryOptions = (
  userId: string,
  fallbackFilename: string,
) =>
  queryOptions({
    queryKey: ["users", userId, "course-stats", "download"],
    queryFn: () => downloadCourseStatsCsv(userId, fallbackFilename),
    gcTime: 0,
    retry: false,
  });
