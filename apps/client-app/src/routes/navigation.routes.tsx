import type { RouteObject } from "react-router-dom";
import { HomePage } from "./lazy";
import { infiniteCoursesQueryOptions, queryClient } from "@api/src";

export const navigationRoute: RouteObject[] = [
  {
    path: "/",
    element: <HomePage />,
    loader: ({ request }) => {
      const search = new URL(request.url).searchParams.get("search");

      void queryClient.prefetchInfiniteQuery(
        infiniteCoursesQueryOptions({ search }),
      );
    },
  },
];
