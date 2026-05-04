"use client";

/**
 * Example feature — Client Component.
 *
 * Accepts initialItems from the RSC page (server-prefetched, no loading flash).
 * React Query takes over for mutations and subsequent refetches.
 *
 * Copy to src/features/<your-feature>/components/ and adapt.
 */

import { useExampleItems, useCreateExampleItem } from "../hooks/useExampleItems";
import type { ExampleItem } from "../types";
import { useState } from "react";

interface ExampleListProps {
  initialItems?: ExampleItem[];
}

export function ExampleList({ initialItems }: ExampleListProps) {
  const { data: items, isPending, isError } = useExampleItems(initialItems);
  const { mutate: createItem, isPending: isCreating } = useCreateExampleItem();
  const [input, setInput] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    createItem(input.trim(), { onSuccess: () => setInput("") });
  }

  if (isPending) {
    return <p className="text-sm text-zinc-500">Loading...</p>;
  }

  if (isError) {
    return <p className="text-sm text-red-500">Failed to load items.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-2">
        {items?.map((item) => (
          <li
            key={item.id}
            className="flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800"
          >
            <span
              className={`h-2 w-2 rounded-full shrink-0 ${
                item.completed ? "bg-green-500" : "bg-zinc-300"
              }`}
            />
            <span className={item.completed ? "line-through text-zinc-400" : ""}>
              {item.title}
            </span>
          </li>
        ))}
      </ul>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="New item title..."
          className="flex-1 rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-zinc-100"
        />
        <button
          type="submit"
          disabled={isCreating || !input.trim()}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {isCreating ? "Adding..." : "Add"}
        </button>
      </form>
    </div>
  );
}
