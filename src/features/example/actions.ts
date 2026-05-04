"use server";

/**
 * Example feature — Server Actions.
 *
 * Thin Next.js orchestration layer: caching, revalidation, auth.
 * Actual API calls live in src/services/example.service.ts.
 *
 * IMPORTANT: Do NOT export types from this file.
 * 'use server' files cannot re-export types — the bundler treats all
 * exports as server action endpoints and will throw a runtime error.
 * Import types directly from ./types instead.
 *
 * Copy to src/features/<your-feature>/actions.ts and adapt.
 */

import { revalidateTag, cacheTag, cacheLife } from "next/cache";
import { exampleService } from "@/services/example.service";
import type { ExampleItem, CreateExampleItemDto } from "./types";

// ── Reads (cached) ────────────────────────────────────────────────────────────

export async function getExampleItems(): Promise<ExampleItem[]> {
  "use cache";
  cacheTag("example-items");
  cacheLife("minutes");
  return exampleService.getAll();
}

export async function getExampleItem(id: number): Promise<ExampleItem> {
  "use cache";
  cacheTag(`example-item-${id}`);
  cacheLife("minutes");
  return exampleService.getById(id);
}

// ── Mutations (invalidate cache after success) ────────────────────────────────

export async function createExampleItem(
  dto: CreateExampleItemDto
): Promise<ExampleItem> {
  const result = await exampleService.create(dto);
  revalidateTag("example-items", "max");
  return result;
}

export async function updateExampleItem(
  id: number,
  dto: Partial<CreateExampleItemDto>
): Promise<ExampleItem> {
  const result = await exampleService.update(id, dto);
  revalidateTag("example-items", "max");
  revalidateTag(`example-item-${id}`, "max");
  return result;
}

export async function deleteExampleItem(id: number): Promise<void> {
  await exampleService.remove(id);
  revalidateTag("example-items", "max");
  revalidateTag(`example-item-${id}`, "max");
}
