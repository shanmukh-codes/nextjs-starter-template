"use client";

/**
 * Example feature — React Query hooks.
 *
 * Use these in Client Components that need live/reactive data.
 * For static or server-rendered data, call the Server Action directly in an RSC page.
 *
 * Copy to src/features/<your-feature>/hooks/ and adapt.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ExampleItem } from "../types";

const QUERY_KEY = ["example-items"] as const;

export function useExampleItems(initialData?: ExampleItem[]) {
  return useQuery<ExampleItem[]>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const res = await fetch("https://jsonplaceholder.typicode.com/todos?_limit=5");
      if (!res.ok) throw new Error("Failed to fetch example items");
      return res.json();
    },
    initialData,
  });
}

export function useCreateExampleItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (title: string) => {
      const res = await fetch("https://jsonplaceholder.typicode.com/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, completed: false }),
      });
      if (!res.ok) throw new Error("Failed to create item");
      return res.json() as Promise<ExampleItem>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
