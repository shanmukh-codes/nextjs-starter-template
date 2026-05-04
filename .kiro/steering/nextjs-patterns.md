---
inclusion: fileMatch
fileMatchPattern: "*.tsx,*.ts"
description: Next.js 16 specific patterns, breaking changes, and architecture rules for this project.
---

# Next.js 16 Patterns

> This project uses Next.js 16 with App Router. Many APIs changed from v14/v15. Read `node_modules/next/dist/docs/` before writing any Next.js code.

## Async Request APIs (BREAKING)

`cookies()`, `headers()`, `params`, and `searchParams` are promises. Always await them.

```ts
// WRONG
const { id } = params
const cookieStore = cookies()

// CORRECT
const { id } = await params
const cookieStore = await cookies()
```

## Caching — `use cache` directive

`cacheComponents: true` is set in `next.config.ts`. This means:
- Fetches are NOT cached by default
- You must explicitly opt in with `use cache`
- Never call `cookies()` or `headers()` inside a `use cache` scope — read them outside and pass as arguments

```ts
export async function getProducts() {
  'use cache'
  cacheTag('products')   // for on-demand revalidation
  cacheLife('minutes')   // built-in profiles: seconds | minutes | hours | days | weeks
  return productService.getAll()
}

// Invalidate after mutation — second arg required in Next.js 16
revalidateTag('products', 'max')  // 'max' = stale-while-revalidate
```

## React Compiler

`reactCompiler: true` is set. Do NOT write `useMemo` or `useCallback` manually.

## proxy.ts

`middleware.ts` is replaced by `proxy.ts` at the project root. Use it for auth guards, redirects, and rewrites.

## Data Flow Rules

1. RSC pages → call Server Actions in `features/<name>/actions.ts` or `apiClient` directly
2. Client components → use React Query hooks from `features/<name>/hooks/`
3. Mutations → Server Actions with `revalidateTag` after success
4. Never fetch from Route Handlers inside Server Components (breaks at build time)
5. Never expose `API_BASE_URL` or `API_SECRET_KEY` to the client

## Feature Structure

Every feature lives in `src/features/<name>/`:

```
src/features/<name>/
  actions.ts          # 'use server' — proxy to external API, cache + revalidate
  components/         # Client or Server components for this feature
  hooks/              # React Query hooks (client-side fetching/mutations)
```

Shared types used by 2+ features go in `src/types/api.ts`, not duplicated per feature.

> Never re-export types from a `'use server'` file. The Next.js bundler treats all exports from server action files as server actions and will throw a runtime error. Always import types directly from `./types`.

## Server Action Pattern

```ts
// src/features/<name>/actions.ts
'use server'
import { <name>Service } from '@/services/<name>.service'
import { revalidateTag, cacheTag, cacheLife } from 'next/cache'

export async function getItems() {
  'use cache'
  cacheTag('<name>-items')
  cacheLife('minutes')
  return <name>Service.getAll()
}

export async function createItem(data: CreateDto) {
  const result = await <name>Service.create(data)
  revalidateTag('<name>-items', 'max')  // second arg required
  return result
}
```

## Service Pattern

```ts
// src/services/<name>.service.ts
// No 'use server', no cacheTag, no revalidateTag — pure API calls only
import { apiClient } from './api'
import type { Item } from '@/features/<name>/types'

export const <name>Service = {
  getAll: () => apiClient.get<Item[]>('/<endpoint>'),
  getById: (id: number) => apiClient.get<Item>(`/<endpoint>/${id}`),
  create: (data: CreateDto) => apiClient.post<Item>('/<endpoint>', data),
}
```

## React Query Hook Pattern

```ts
// src/features/<name>/hooks/use<Name>.ts
'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function use<Name>() {
  return useQuery({
    queryKey: ['<name>'],
    queryFn: () => fetch('/api/<endpoint>').then(r => r.json()),
  })
}
```

## Page Pattern (RSC with client child)

```tsx
// src/app/<route>/page.tsx
import { Suspense } from 'react'
import { getItems } from '@/features/<name>/actions'
import { ItemList } from '@/features/<name>/components/ItemList'

export default async function Page() {
  const initialData = await getItems()   // server-side, cached
  return (
    // Suspense is required around client components that use React Query.
    // cacheComponents:true causes Next.js to prerender pages — React Query
    // calls Date.now() internally which triggers a prerender warning without it.
    <Suspense fallback={<p>Loading...</p>}>
      <ItemList initialData={initialData} />
    </Suspense>
  )
}
```
