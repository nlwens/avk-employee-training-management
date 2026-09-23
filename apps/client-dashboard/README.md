# Client Dashboard - Employee Training Management

The dashboard application for administrators to manage training courses, monitor employee progress, and oversee the training program. This document describes the architecture, structure, and patterns used in the application to help you understand where code should go and how to approach feature development.

The goal is to give developers enough context to understand how the application works before making changes.

## Table of Contents

- [Client Dashboard - Employee Training Management](#client-dashboard---employee-training-management)
  - [Table of Contents](#table-of-contents)
  - [Application Setup](#application-setup)
  - [Getting Started](#getting-started)
  - [Pages](#pages)
  - [Components](#components)
  - [Shared UI Package](#shared-ui-package)
  - [Localization](#localization)
  - [API Data Translation](#api-data-translation)
  - [Data Fetching \& Caching](#data-fetching--caching)
    - [API](#api)
    - [Queries](#queries)
    - [Query Keys](#query-keys)
    - [Structure Query Keys Based On API Paths](#structure-query-keys-based-on-api-paths)
    - [Mutations](#mutations)
  - [Caching](#caching)
  - [Updating the Cache After Mutations](#updating-the-cache-after-mutations)
  - [Invalidating Queries](#invalidating-queries)
  - [Manually Updating Cached Data](#manually-updating-cached-data)
  - [Prefetching](#prefetching)
  - [Testing](#testing)
    - [How to start testing your feature?](#how-to-start-testing-your-feature)
    - [Component Tests](#component-tests)
    - [E2E Tests](#e2e-tests)
    - [Mocking](#mocking)
      - [Example Mock Data](#example-mock-data)
      - [Mocking in Component Tests](#mocking-in-component-tests)
      - [Mocking in E2E Tests](#mocking-in-e2e-tests)
  - [Testing Helpers](#testing-helpers)
    - [`loginAsAdmin(page)`](#loginasadminpage)

## Application Setup

Refer to the [README file in the root folder](../../README.md) for setup instructions.

## Getting Started

When you are solving an issue or implementing a feature, here is how to approach it:

1. Start by identifying which **page** the feature interacts with. Pages are located in `src/pages` and represent full routes in the application (e.g., `DashboardPage.tsx`, `CoursesPage.tsx`).

2. Determine what data the page needs. This typically comes from **queries**, **mutations**, or **local state**, that is managed with React's `useState` or `Context API`.

3. Break down the page into reusable **components** in `src/components`. Components are organized by feature (e.g., `courses/`, `employees/`, `dashboard/`).

4. If your feature displays UI text, use the localization tools (see [Localization](#localization) section).

5. Finally, add **component** and **E2E tests** for isolated component behavior and complete user workflows.

## Pages

**Location:** `src/pages`

Pages are full-screen components that correspond to routes in the applications. They are the entry point for a feature to add child components and data fetching.

Avoid placing too much logic directly inside a page. For that, extract feature-specific UI into separate [components](#components).

**Example:**

```tsx
const CoursesPage = () => {
  // 1. Decide whether you need localization for this page
  // 2. Read route params if needed.
  // 3. Load data using query hooks.
  // 4. Prepare mutation handlers if needed.
  // 5. Handle loading, empty, and error states.
  // 6. Render page-specific components.
};
```

**Where To Place Pages**

Place pages in `src/pages/<page-name>` (e.g., `src/pages/CoursesPage.tsx`).

## Components

**Location:** `src/components`

Sometimes page content could become too big and difficult to iterate through - that's where components become handy.

They are reusable pieces of UI (usually for pages or bigger parent components) that receive data through **props** and handle their own rendering logic.

A component should be small, focused only on the one thing, and easy to test. They are grouped by feature in subdirectories (e.g., `courses/`, `employees/`, `dashboard/`)

**Example:**

```tsx
interface Props {
  courses: DashboardCourse[];
}

const CoursesList = ({ courses }: Props) => {
  // 1. Determine whether you need an additional sub-component to handle data.
  // 2. If not, iterate through data here.
};
```

Typically, each component has a single, well-defined purpose that correspond to the received data through **props** interface that is properly matching perceived data. Such components should avoid fetching/mutating data, as they need to be handled in parent pages.

Often a single component could reuse other smaller UI components (such as buttons, forms, inputs, etc.), taken from the shared UI package `packages/ui`.

**Where To Place Components**

Place these components in `src/components/<feature>` (e.g., `src/components/courses/`, `src/components/employees/`).

## Shared UI Package

**Location:** `../packages/ui`

The shared UI package contains reusable, styled components that are used across multiple client applications.

**Example:**

```tsx
import { Button, Input } from "@ui/components";

<Button onClick={handleClick}>Submit</Button>
<Input onInput={handleInput} placeholder="Enter course name..." />
```

**When to use shared UI**

Use the shared UI package for components that are generic or needed across multiple applications, such as **buttons**, **inputs**, **forms**, or **modals**. Layout components like containers, grids, and flex layouts are also good candidates. Essentially, any component that might be needed in both `client-app` and `client-dashboard` should be in the shared UI package.

## Localization

The application supports multiple languages using `react-i18next` and a custom localization system for API data.

For more information, check out [README file in the `packages/i18n` folder](../../packages/i18n/README.md).

**UI String Translation**

For hardcoded UI strings in components, use `useTranslation()` hook with the relevant namespace(s):

```tsx
import { useTranslation } from "react-i18next";

const MyComponent = () => {
  const { t } = useTranslation(["dashboard", "common"]);
  return <h1>{t(($) => $.dashboard.title)}</h1>;
};
```

The `t()` function takes a selector that provides full TypeScript safety and IDE auto-complete. The first path segment
is always the namespace name, followed by the nested key path. Add keys to `locales/en/<namespace>.json` (English is the
source language) and the matching key to other locale files (e.g., `locales/nl/<namespace>.json`). See
the [i18n README](../../packages/i18n/README.md) for details.

## API Data Translation

The API returns multilingual data. For instance, courses have translations in multiple languages:

```ts
{
  // ...
  "translations": [
      {
        "localeCode": "en",
        "title": "Title",
        "description": "Description"
      },
      {
        "localCode": "nl",
        "title": "Titel",
        "description": "Beschrijving"
      }
  ],
  // ...
}
```

To handle translations, use the `useLocalize()` hook to select the appropriate translation based on the current langauge:

```tsx
const Page = () => {
  const { localize } = useLocalize();
  const { data } = useCourses();

  const courseName = localize(data.translations, "title");
};
```

## Data Fetching & Caching

**Location:**

1. `src/hooks/queries/` - for fetching hooks
2. `src/hooks/mutations/` - for create/update/delete operations

The application uses `TanStack Query` for data fetching, caching and synchronization with the server.

Server state is data that comes from the [API](../../packages/api/README.md) and needs to stay synchronized with the backend. TanStack Query helps with:

- Fetching data
- Caching API responses
- Tracking loading and error states
- Refetching stale data
- Updating or invalidating cached data after mutations

### API

The `API` class (from `@api/src`) is a thin wrapper around Axios that simplifies HTTP requests. It provides typed methods for common HTTP operations:

```ts
API.get<T>(endpoint); // Fetch data
API.post<T>(endpoint, body); // Create data
API.put<T>(endpoint, body); // Replace data
API.patch<T>(endpoint, body); // Update data
API.delete<T>(endpoint); // Delete data
```

A generic type `T` needs to be replaced by the actual entity type that is going to be used for an API request and response.

```ts
API.patch<UpdateCourse>(`/courses/${id}`, updatedCourseData);
```

To learn more about the API helper, you visit the [API](../../packages/api/README.md) package.

### Queries

Queries are used for reading data from the API.

Pages use `useSuspenseQuery` to fetch data. These hooks integrate with React Suspense: the component suspends until data
is ready, so `data` is always defined, and you never need to handle `isPending` manually. Loading and error states are
handled declaratively by a `QueryBoundary` wrapper instead.

> [!important]
> `useSuspenseQuery` calls are executed sequentially; for parallel queries, use `useSuspenseQueries`.

Define reusable query configurations with `queryOptions()` in the API package:

```ts
export const questionsQueryOptions = (courseId: string) =>
  queryOptions({
    queryKey: ["courses", courseId, "questions"],
    queryFn: () => API.get<Question[]>(`/courses/${courseId}/questions`),
  });
```

Then split the page into a content component and a boundary wrapper (which owns the loading and error UI):

```tsx
const PageContent: React.FC = () => {
  const { data: questions } = useSuspenseQuery(questionsQueryOptions(courseId));
  return <QuestionList questions={questions} />;
};

const Page: React.FC = () => (
  <QueryBoundary errorMessage="Failed to load questions">
    <PageContent />
  </QueryBoundary>
);
```

A query usually contains:

- A `queryKey`, which identifies the cached data
- A `queryFn`, which fetches the data

### Query Keys

The `queryKey` is used by TanStack Query to identify and cache the result of a query.

**Example:**

```ts
queryKey: ["courses"];
```

This means the fetched data is stored in the cache under that key.
If another component uses the same query key, TanStack Query can reuse the cached data instead of fetching it again immediately.

Query keys should be:

- Descriptive
- Specific enough to identify the cached data
- Based on every value that affects the result

### Structure Query Keys Based On API Paths

A good strategy is to **mirror** the API endpoint structure in your query key, making keys predictable and easy to reason about.

**Example for `/courses`:**

```
["courses"]
```

**Example for `/courses/{courseId}/chapters/{chapterId}/segments`:**

```
["courses", courseId, "chapters", chapterId, "segments"]
```

**Other Examples:**

```
["courses"] // API.get<Course[]>("/courses");
["course", courseId] // API.get<Course>(`/courses/${courseId}`);
```

### Mutations

Mutations are used for operations that change server data.

Use `useMutation` for actions such as:

- Creating data
- Updating data
- Deleting data

A mutation usually contains:

- A `mutationFn`, which performs the API request
- An `onSuccess` callback, which runs after the request succeeds
- Optional callbacks, such as `onError` or `onSettled`

**Example:**

```tsx
const mutation = useMutation({
    mutationFn: (values) => API.post('/courses', values),

    onSuccess: (data) => {
      // Invalidate a specific query or manually update the cache
    },

    onError: (error) => {
      // optionally handle error messages
    }

  });
};
```

The mutation can then be triggered from a page or component:

```ts
mutation.mutate(values);
```

## Caching

TanStack Query automatically caches data returned by a query, meaning that after data is fetched once, it can be reused
by other components that request the same query key.

For example, if one page loads data using this key `["courses"]` and another component also uses the same key, both are referring to the same cached server state.
The cache helps avoid unnecessary API requests and keeps server data consistent across the application.

## Updating the Cache After Mutations

After a mutation succeeds, some cached data may become outdated.

For example, after creating or updating a course, cached course lists or course details may no longer be accurate.

There are two common ways to handle this:

1. Invalidate the affected query
2. Manually update the cached data

## Invalidating Queries

Invalidating a query marks cached data as stale and tells TanStack Query to refetch it from the server.

**Example:**

```ts
queryClient.invalidateQueries({
  queryKey: ["courses"],
});
```

**When to invalidate:**

- **Deleting data** – The server must refetch to remove deleted items.
- **Complex data changes** – When the data is too complex to be proceesed by the client alone.
- **Paginated or infinite-scroll lists** – Any mutation that adds, removes, or reorders items changes which items
  appear on each page. For example, deleting an item from page 1 shifts the first item of page 2 forward. The client
  cannot reproduce this locally, so the server must recompute the pages.

When list queries are parameterized (e.g., filtered by `published` status or search term), each filter combination is a
separate cache entry. To invalidate all of them at once after a mutation, use a partial key prefix:

```ts
// Invalidates ["courses", "list", {}], ["courses", "list", { published: true }], etc.
queryClient.invalidateQueries({ queryKey: ["courses", "list"] });
```

TanStack Query matches by prefix, so any key starting with `["courses", "list"]` is invalidated.

## Manually Updating Cached Data

Sometimes the application already knows exactly how the cache should change.

> [!important]
> Do not use `setQueryData` or `setQueriesData` on paginated or infinite-scroll list queries. A creation or delete
> shifts every subsequent page: item #21 becomes item #20, and so on. Only `invalidateQueries` can produce the correct
> result for these queries.

When you create or update an entity, the backend returns a complete record. Use it to update the cache directly without refetching:

```ts
const { mutate } = useMutation({
  mutationFn: (data) => API.post<DashboardCourse>("/courses", data),
  onSuccess: (newCourse) => {
    // Update cache with the response instead of refetching
    queryClient.setQueryData(["courses"], (old: DashboardCourse[]) => [
      ...old,
      newCourse,
    ]);
  },
});
```

When list queries are parameterized, use `setQueriesData` to apply the same update to every matching cache entry:

```ts
// Applies the filter to ["courses", "list", {}], ["courses", "list", { published: true }], etc.
queryClient.setQueriesData<DashboardCourse[]>(
  { queryKey: ["courses", "list"] },
  (courses) => courses?.filter((course) => course.id !== deletedId),
);
```

## Prefetching

Prefetching populates the cache before a component mounts, so `useSuspenseQuery` never suspends and no loading spinner
is shown. Three layers of prefetching work together:

1. Route loaders. They fire as soon as React Router starts processing a navigation, running in parallel with
   lazy-loading the JS bundle. Add a `loader` to the route definition and call `prefetchQuery` without awaiting:

```ts
export const dashboardRoutes: RouteObject[] = [
  {
    path: "/courses/:courseId",
    element: <CourseWorkspaceLayout />,
    loader: ({ params }) => {
      const { courseId } = params as { courseId: string };
      void queryClient.prefetchQuery(courseQueryOptions(courseId));
      void queryClient.prefetchQuery(courseChaptersQueryOptions(courseId));
    },
  },
];
```

`prefetchQuery` never throws and respects `staleTime`, so it is safe to call unconditionally; it skips the network if
the cache is still fresh.

2. Hover prefetching. Fire when the user hovers over a link or button, giving the network request a head start before
   the click. Use `onMouseEnter` on the element:

```tsx
const queryClient = useQueryClient();

<Link
  to={`/courses/${course.id}`}
  onMouseEnter={() => {
    void queryClient.prefetchQuery(courseQueryOptions(course.id));
    void queryClient.prefetchQuery(courseChaptersQueryOptions(course.id));
  }}
>
  {course.title}
</Link>
```

3. Predictive prefetching. Fire once the current page has rendered and the likely next destination is known. Use a
   `useEffect` inside the component:

```tsx
// When viewing the course detail page, always prefetch the quiz immediately.
usePrefetchQuery(questionsQueryOptions(courseId));
```

Combine all three for zero-spinner navigation: the route loader fires on click, hover prefetching fires before the
click, and predictive prefetching fires when the likely destination first becomes knowable.

On logout, the entire in-memory cache is wiped via `queryClient.clear()` so that one user's data is never visible to
another user on the same browser session.

## Testing

Testing helps uncover bugs and errors that you or other developers might have missed during the development. Tests verify that your code is working and ensures that your code continues to work in the future as you add new features, refactor the existing ones, or upgrade major dependencies of your project.

Tests can also serve as documentation for new people joining the development team. For people who have never seen a codebase before, reading tests can help them understand how the existing code works.

### How to start testing your feature?

Start by separating your components from your business logic. This way, you can keep your business logic testing independent of the components themselves, making **component** and **business logic** not rely on each other.

### Component Tests

For testing components, there are two things you will have to test:

1. User interaction with components (e.g., button or dropdown clicks, navigation, etc.).
2. Rendering (e.g., the button appearance, visible labels).

**Example:**

```ts
it("renders course details", () => {
  /**
   * Render an actual component that needs to be tested
   */
  render(<CourseCard course={mockCourse} />);

  /**
  * Make sure that the component above renders the course information
  */
  expect(screen.getByRole("heading", { name: "Forklift safety" })).toBeInTheDocument();
  expect(screen.getByText("5 chapters")).toBeVisible();
  expect(screen.getByText("25 people enrolled")).toBeVisible();
});
```

### E2E Tests

End-to-End (E2E) tests validate complete user workflows from start to finish.

Unlike component tests that test components in isolation, E2E tests run against the full application and test how different parts work together. That also includes the API request testing.

**Example:**

```ts
test("admin can login and view all courses", async ({ page }) => {
  await page.goto("/login");

  await page.getByPlaceholder("Enter your email...").fill("admin@example.com");
  await page.getByPlaceholder("Enter your password...").fill("password");
  await page.getByRole("button", { name: "Log in" }).click();

  await expect(page).toHaveURL("/dashboard");
  await expect(page.getByText("AVK Training Dashboard")).toBeVisible();
});
```

### Mocking

Mocking allows you to isolate the code you're testing by replacing external dependencies (like API calls, hooks, or services) with mock implementations, making your tests faster, more reliable, and independent of external systems.

#### Example Mock Data

First, define the shape of your mock data based on your API types:

```ts
const mockCourse: DashboardCourse = {
  id: "forklift-safety",
  title: "Forklift safety",
  chaptersCount: 5,
  enrolledCount: 25,
  completedCount: 15,
};
```

#### Mocking in Component Tests

Pass mock data directly as props to test the component in isolation:

```ts
it("renders course card", () => {
  const props = {
    course: mockCourse,
  };

  render(<CourseCard {...props} />);
  expect(screen.getByRole("heading", { name: "Forklift safety" })).toBeInTheDocument();
});
```

#### Mocking in E2E Tests

Intercept API requests and return mock data using `page.route`:

```ts
test("displays all courses", async ({ page }) => {
  // Mock the API endpoint to return mock courses
  await page.route("**/courses", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([mockCourse]),
    }),
  );

  await loginAsAdmin(page);
  await page.goto("/courses");
  await expect(page.getByText("Forklift safety")).toBeVisible();
});
```

## Testing Helpers

#### `loginAsAdmin(page)`

Logs in as an admin user, clears `localStorage`, and waits for redirect to the dashboard. Requires `ADMIN_EMAIL` and `ADMIN_PASSWORD` environment variables set in `.env` file.

```ts
import { loginAsAdmin } from "./auth";

test("admin can view dashboard", async ({ page }) => {
  await loginAsAdmin(page);
  // Test continues after login...
});
```
