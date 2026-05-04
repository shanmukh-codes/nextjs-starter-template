/**
 * Example service — raw API calls, no Next.js concerns.
 *
 * Uses a public demo API (jsonplaceholder) so the template works
 * out of the box without setting API_BASE_URL.
 *
 * In a real project: replace the fetch URLs with apiClient calls:
 *   import { apiClient } from "./api"
 *   getAll: () => apiClient.get<ExampleItem[]>("/your-endpoint")
 *
 * Copy to src/services/<resource>.service.ts and adapt.
 */

import type { ExampleItem, CreateExampleItemDto } from "@/features/example/types";

const BASE = "https://jsonplaceholder.typicode.com";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  if (res.status === 204) return null as T;
  return res.json();
}

export const exampleService = {
  getAll: (): Promise<ExampleItem[]> =>
    request<ExampleItem[]>("/todos?_limit=5"),

  getById: (id: number): Promise<ExampleItem> =>
    request<ExampleItem>(`/todos/${id}`),

  create: (dto: CreateExampleItemDto): Promise<ExampleItem> =>
    request<ExampleItem>("/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...dto, completed: false }),
    }),

  update: (id: number, dto: Partial<CreateExampleItemDto>): Promise<ExampleItem> =>
    request<ExampleItem>(`/todos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dto),
    }),

  remove: (id: number): Promise<void> =>
    request<void>(`/todos/${id}`, { method: "DELETE" }),
};
