# Next.js 16 Enterprise Frontend-Only Template

## Project Purpose

This is a **frontend-only** Next.js 16 application that consumes data from an external backend API (e.g. Spring Boot, FastAPI, Django). Do NOT add database ORMs, direct DB connections, or complex backend logic here. Use Server Actions and Route Handlers only as a secure proxy layer to the external API.

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16.2.4 (App Router) |
| Runtime | React 19 |
| Bundler | Turbopack (default in dev) |
| Styling | Tailwind CSS v4 — no CSS Modules, no CSS-in-JS |
| Server data fetching | React Server Components (RSC) + Server Actions |
| Client data fetching | TanStack React Query v5 |
| Client state | Zustand v5 |
| UI primitives | Radix UI + Lucide React |

---

## Critical Next.js 16 API Changes

These are **breaking changes** from Next.js 14/15. Get them wrong and you'll get runtime errors.

### 1. Async Request APIs

`cookies()`, `headers()`, `params`, and `searchParams` are now **async**. Always `await` them.

```ts
// WRONG — will throw
const cookieStore = cookies()
const { id } = params

// CORRECT
const cookieStore = await cookies()
const { id } = await params
```

### 2. `use cache` directive (replaces implicit fetch caching)

Next.js 16 introduces Cache Components (`use cache`). Implicit fetch caching is gone. You must be explicit.

Enable in `next.config.ts`:
```ts
const nextConfig: NextConfig = {
  cacheComponents: true,
}
```

Then use the directive at file, component, or function level:
```ts
// Cache a data-fetching function
export async function getProducts() {
  'use cache'
  cacheTag('products')          // for on-demand revalidation
  cacheLife('hours')            // built-in profile: seconds | minutes | hours | days | weeks
  return fetch('https://api.example.com/products')
}
```

**Rules for `use cache`:**
- Do NOT call `cookies()` or `headers()` inside a `use cache` scope — read them outside and pass as arguments
- Arguments and return values must be serializable
- `React.cache` is isolated inside `use cache` boundaries

### 3. On-demand revalidation

`revalidateTag` now requires **two arguments** in Next.js 16. Single-argument form is deprecated.

```ts
import { revalidateTag } from 'next/cache'

// WRONG — deprecated, will be removed
revalidateTag('products')

// CORRECT — 'max' = stale-while-revalidate (recommended)
revalidateTag('products', 'max')
```

```ts
// Or invalidate by path
import { revalidatePath } from 'next/cache'
revalidatePath('/products')
```

### 4. React Compiler is enabled

Do NOT manually write `useMemo` or `useCallback` — the compiler handles memoization automatically. Only use them for explicit edge cases where you need to control referential identity.

### 5. `proxy.ts` replaces `middleware.ts`

Next.js 16 uses `proxy.ts` at the project root instead of `middleware.ts`. Use it for auth guards, redirects, and request rewrites.

```ts
// proxy.ts
export const config = { matcher: '/dashboard/:path*' }

export function proxy(request: Request) {
  // auth check, redirect, rewrite
}
```

---

## Architecture: Feature-Sliced Design

```
src/
├── app/                        # Next.js App Router pages and layouts
│   ├── layout.tsx              # Root layout — QueryProvider + Zustand here
│   ├── page.tsx
│   └── (features)/             # Route groups per feature
│       └── products/
│           ├── page.tsx        # RSC — calls server actions or fetches directly
│           └── [id]/
│               └── page.tsx    # await params before use
│
├── features/                   # Feature-sliced modules
│   └── <feature-name>/
│       ├── components/         # UI components specific to this feature
│       ├── hooks/              # React Query hooks (client-side fetching)
│       ├── types.ts            # TypeScript types for this feature
│       └── actions.ts          # Thin Next.js layer: 'use cache' + revalidateTag
│
├── components/
│   └── ui/                     # Shared/global UI components (buttons, modals, etc.)
│
├── services/
│   ├── api.ts                  # Base fetch client — all external API calls go through here
│   └── <name>.service.ts       # Resource-specific API calls, no Next.js concerns
│
├── store/
│   └── index.ts                # Zustand store setup
│
├── hooks/                      # Shared React hooks
│
└── types/
    └── api.ts                  # Shared types: PaginatedResponse, ApiError, ApiResponse
```

### Three-layer data architecture

```
External API
    │
    ▼
src/services/<name>.service.ts   ← pure API calls, typed, no Next.js
    │
    ▼
src/features/<name>/actions.ts   ← 'use server', 'use cache', revalidateTag
    │
    ▼
src/app/<route>/page.tsx         ← RSC: await action, pass to client component
    │
    ▼
src/features/<name>/components/  ← 'use client', React Query hook for reactivity
```

### Data flow rules

1. **RSC pages** → call `actions.ts`, pass result as `initialData` to client component
2. **Client components** → use React Query hooks from `features/<name>/hooks/`
3. **Mutations** → Server Action calls service, then `revalidateTag('tag', 'max')`
4. **Never** fetch from Route Handlers inside Server Components
5. **Never** expose `API_BASE_URL` or `API_SECRET_KEY` to the client
6. **Never** re-export types from a `'use server'` file — the bundler treats all exports as server actions and will throw. Import types directly from `./types`

---

## Server Action Pattern

```ts
// src/features/products/actions.ts
'use server'

import { productService } from '@/services/product.service'
import { revalidateTag, cacheTag, cacheLife } from 'next/cache'

export async function getProducts() {
  'use cache'
  cacheTag('products')
  cacheLife('minutes')
  return productService.getAll()
}

export async function createProduct(data: CreateProductDto) {
  const result = await productService.create(data)
  revalidateTag('products', 'max')   // second arg required in Next.js 16
  return result
}
```

## Service Pattern

```ts
// src/services/product.service.ts
// Pure API calls — no 'use server', no cacheTag, no revalidateTag
import { apiClient } from './api'
import type { Product } from '@/features/products/types'

export const productService = {
  getAll: () => apiClient.get<Product[]>('/products'),
  getById: (id: number) => apiClient.get<Product>(`/products/${id}`),
  create: (data: CreateProductDto) => apiClient.post<Product>('/products', data),
}
```

## React Query Hook Pattern

```ts
// src/features/products/hooks/useProducts.ts
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: () => fetch('/api/products').then(r => r.json()),
  })
}
```

## Zustand Store Pattern

```ts
// src/store/index.ts
import { create } from 'zustand'

interface AppStore {
  theme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark') => void
}

export const useAppStore = create<AppStore>((set) => ({
  theme: 'light',
  setTheme: (theme) => set({ theme }),
}))
```

---

## Environment Variables

```bash
# .env.local
NEXT_PUBLIC_APP_URL=http://localhost:3000   # client-accessible
API_BASE_URL=http://localhost:8080          # server-only — never expose to client
API_SECRET_KEY=...                          # server-only
```

Access server-only vars only inside Server Components, Server Actions, or Route Handlers.

---

## Commands

```bash
npm run dev      # Turbopack dev server
npm run build    # Production build
npm run start    # Production server
npm run lint     # ESLint
```
