# API Package

The API package, located in `packages/api`, provides a centralized HTTP client for communicating with the backend server using `Axios`, integrated with`TanStack Query` for efficient data fetching and caching.

## Table of Contents

- [`API`](#api)
  - [Methods](#methods)
  - [Features](#features)
  - [Usage Example](#usage-example)
- [`TanStackProvider`](#tanstackprovider)
  - [Usage Example](#usage-example-1)
- [`API with TanStack Query`](#api-with-tanstack-query)
  - [Usage Example with `useSuspenseQuery`](#usage-example-with-usesuspensequery)
  - [Usage Example with `useMutation`](#usage-example-with-usemutation)
- [`Suspense Queries`](#suspense-queries)
  - [Parallel queries](#parallel-queries)
  - [Cache-seeded query options](#cache-seeded-query-options)
- [`Error Handling`](#error-handling)
  - [Query errors](#query-errors)
  - [Mutation errors](#mutation-errors)

## `API`

A static utility class that provides type-safe HTTP methods for making requests to the backend server. It wraps `Axios` and handles `JWT` authentication automatically.

### Methods

- `API.get<T>(endpoint: string)` — GET request returning typed data.
- `API.post<T>(endpoint: string, body: object)` — POST request with payload.
- `API.put<T>(endpoint: string, body: object)` — PUT request to replace resources.
- `API.patch<T>(endpoint: string, body: object)` — PATCH request for partial updates.
- `API.delete<T>(endpoint: string)` — DELETE request.

### Features

- Automatically injects JWT `accessToken` from `localStorage` (using Axios interceptors) as Bearer token in request headers.
- Normalizes error responses into an `ApiError` format with `statusCode`, `messages` and `error` fields.
- Handles both single error messages and arrays of error messages (e.g., validation errors) from the server, always normalizing them to an array in the `messages` field.
- Extracts and returns `response.data` directly.

### Usage Example

```ts
import { API } from "@api/src";

// GET request
const users = await API.get<User[]>("/users");

// POST with payload
const newCourse = await API.post<Course>("/courses", {
  title: "Operation fundamentals",
  description: "Learn operation basics",
});
```

## `TanStackProvider`

A React context provider that wraps the appliction to enable `TanStack Query` functionality for managing server state and caching.

By default, a `queryClient` instance in `tanstack.provider.tsx` is configured with the following parameters:

```ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60, // 1 minute
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
    },
  },
});
```

### Usage Example

```ts
import { TanStackProvider } from '@api/src';

export function App() {
  return (
    <TanStackProvider>
      <Routes>
        {/* App routes */}
      </Routes>
    </TanStackProvider>
  );
}
```

## `API with TanStack Query`

The `API` static methods are designed to work together with `TanStack Query's` hooks for data fetching, caching, and
synchronization. Use `useSuspenseQuery` (or `useSuspenseQueries`) together with `QueryBoundary` for queries, and
`useMutation` together with `useHandleApiError` for mutations.

### Usage Example with `useSuspenseQuery`

Wrap the page in `QueryBoundary` and call `useSuspenseQuery` inside a child component. The boundary handles loading (via
`Suspense`) and all error states; no `isPending` or `isError` branches needed.

```tsx
import React from "react";
import { QueryBoundary, useSuspenseQuery, coursesQueryOptions } from "api/src";

// An inner component that only handles the success case.
const CoursesList: React.FC = () => {
  const { data: courses } = useSuspenseQuery(coursesQueryOptions);
  return <ul>{courses.map(c => <li key={c.id}>{c.title}</li>)}</ul>;
};

// An outer component that owns the boundary and translated strings.
const CoursesPage: React.FC = () => {
  const { t } = useTranslation(["courses"]);

  return (
    <QueryBoundary errorMessage={t(($) => $.courses.errors.loading_all)}>
      <CoursesList />
    </QueryBoundary>
  );
};

export default CoursesPage;
```

See [`Suspense Queries`](#suspense-queries) for parallel queries, dependent queries, and cache-seeded options.

### Usage Example with `useMutation`

Define the mutation hook with cache updates in `onSuccess`. Call `useHandleApiError` in the component and pass `onError`
explicitly at the `mutate()` call site so error handling is visible next to the action that triggers it.

```tsx
import React from "react";
import { useMutation, useQueryClient } from "api/src";
import { useHandleApiError, type ApiError } from "api/src";

// A mutation hook; cache updates only, no error handling.
export const useCreateCourse = () => {
  const queryClient = useQueryClient();

  return useMutation<Course, ApiError, CourseFormValues>({
    mutationFn: (values) => API.post<Course>("/courses", values),
    onSuccess: (created) => {
      queryClient.setQueryData<Course[]>(["courses"], (prev = []) => [...prev, created]);
    },
  });
};

// Component — owns navigation, toasts, and error handling
const CreateCoursePage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(["courses"]);
  const { toast } = useToast();
  const { mutate: createCourse } = useCreateCourse();
  const { handleApiError } = useHandleApiError();

  const handleSubmit = (values: CourseFormValues) => {
    createCourse(values, {
      onSuccess: () => {
        toast({ variant: "success", description: t(($) => $.courses.actions.created_successfully) });
        navigate("/courses");
      },
      onError: (error: ApiError) =>
        handleApiError(error, {
          messages: { unexpectedError: t(($) => $.courses.errors.saving) },
        }),
    });
  };
}
```

See [`Error Handling`](#error-handling) for the full status-code behavior.

## `Suspense Queries`

The preferred way to fetch data is with `useSuspenseQuery` (or `useSuspenseQueries` for multiple queries at once)
combined with `QueryBoundary`. This eliminates `isPending` / `isError` guard branches from components; loading and error
states are handled by the boundary, and the component body only needs to handle the success case.

> [!important]
> Suspense queries are sequential by default. See the following sections for alternatives.

### Parallel queries

Use `useSuspenseQueries` to fire multiple independent queries at the same time. All queries start simultaneously and the
component renders once all of them resolve.

```tsx
import { useSuspenseQueries, usersQueryOptions, groupsQueryOptions } from "@api/src";

const EmployeesContent = () => {
  const [{ data: users }, { data: groups }] = useSuspenseQueries({
    queries: [
      usersQueryOptions,
      groupsQueryOptions,
    ],
  });
  // Both resolved here; no loading or error handling needed.
};
```

### Cache-seeded query options

The `*WithCache` factories return query options that populate `initialData` from a related list query that is already in
the cache. This avoids a loading state when navigating from a list page to a detail page; the data is available
immediately, and no network request is made unless the cache is expired.

```tsx
import { courseQueryOptionsWithCache } from "api/src";

const queryClient = useQueryClient();

// Returns the course from the courses-list cache instantly if available; only
// fetches GET /courses/:id when neither the detail nor the list cache has it.
const { data: course } = useSuspenseQuery(
  courseQueryOptionsWithCache(courseId, queryClient)
);
```

When list queries are parameterized (e.g., filtered by `published` status or search term), each combination of
parameters is a separate cache entry. The `*WithCache` factories handle this by searching across all matching list
entries using `getQueriesData` rather than looking up a single specific key:

```ts
initialData: () => {
  const entries = queryClient.getQueriesData<Course[]>({ queryKey: coursesListQueryKey });
  for (const [, courses] of entries) {
    const found = courses?.find((c) => c.id === courseId);
    if (found) {
      return found;
    }
  }
  return undefined;
},
initialDataUpdatedAt: () => {
  const entries = queryClient.getQueriesData<Course[]>({ queryKey: coursesListQueryKey });
  for (const [key, courses] of entries) {
    if (courses?.find((c) => c.id === courseId)) {
      return queryClient.getQueryState(key)?.dataUpdatedAt;
    }
  }
  return undefined;
},
```

`initialDataUpdatedAt` is set to the `dataUpdatedAt` of the specific list entry that contained the course, so TanStack
Query can correctly determine whether the seeded data is stale and a background refetch is needed.

> [!note]
> For more details on cache-seeded queries, see the [TanStack Query docs][tanstack-initial-query-data].

## `Error Handling`

### Query errors

`QueryBoundary` handles HTTP errors automatically based on status code:

| Status        | Behaviour                                                    |
|---------------|--------------------------------------------------------------|
| 401           | Logout + redirect to `/login` with a "Session expired" toast |
| 403           | Destructive "Forbidden" toast                                |
| 404           | Destructive toast + optional `onNotFound()` callback         |
| 5xx / network | Inline `ErrorAlert` with a **Reload** retry button           |

Pass `messages.notFound` for a context-specific 404 message instead of the generic fallback. Pass `onNotFound` to clean
up stale cache entries before navigating away:

```tsx
<QueryBoundary
  onNotFound={() => {
    queryClient.removeQueries(courseChaptersQueryOptions(courseId));
    navigate(`/courses/${courseId}`, { replace: true });
  }}
  messages={{ notFound: t(($) => $.courses.errors.not_found) }}
  errorMessage={t(($) => $.courses.errors.loading)}
>
  <ChapterContent />
</QueryBoundary>
```

Pass `loadingFallback` when the layout shell should remain visible during loading:

```tsx
<QueryBoundary
  loadingFallback={
    <DashboardLayout>
      <LoadingSpinner size="lg" className="py-20" />
    </DashboardLayout>
  }
  onNotFound={() => navigate("/courses", { replace: true })}
  errorMessage={t(($) => $.courses.errors.loading)}
>
  <EditCourseForm courseId={courseId} />
</QueryBoundary>
```

### Mutation errors

Use `useHandleApiError` in the calling component and pass `onError` explicitly in the `mutate()` call. Mutation hooks
only handle cache updates in `onSuccess`; navigation, toasts, and error handling are the caller's responsibility.

```tsx
import { useHandleApiError, type ApiError } from "api/src";

const { mutate: createCourse } = useCreateCourse();
const { handleApiError } = useHandleApiError();

createCourse(values, {
  onSuccess: () => {
    toast({ variant: "success", description: t(($) => $.courses.actions.created_successfully) });
    navigate("/courses");
  },
  onError: (error: ApiError) =>
    handleApiError(error, {
      messages: { unexpectedError: t(($) => $.courses.errors.saving) },
    }),
});
```

`handleApiError` applies the same status-code logic as `QueryBoundary`, and additionally handles 409 with a
destructive "Conflict" toast. For mutations where a 404 means the resource was deleted concurrently, pass `onNotFound`
to clean up the cache:

```tsx
updateCourse.mutate(vars, {
  onSuccess: () => { toast(...); navigate(`/courses/${course.id}`); },
  onError: (error: ApiError) =>
    handleApiError(error, {
      messages: {
        notFound: t(($) => $.courses.errors.not_found_changes_not_saved),
        conflict: t(($) => $.courses.errors.conflict),
        unexpectedError: t(($) => $.courses.errors.saving),
      },
      onNotFound: () => {
        queryClient.setQueriesData<Course[]>(
          { queryKey: coursesListQueryKey },
          (courses) => courses?.filter(course => course.id !== courseId),
        );
        navigate("/courses");
      },
    }),
});
```


[tanstack-initial-query-data]: https://tanstack.com/query/latest/docs/guides/initial-data
