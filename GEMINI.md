# Next.js 16 Enterprise Frontend-Only Template

## What This Project Is

A frontend-only Next.js 16 application. It fetches data from an external backend API (Spring Boot, FastAPI, Django, etc.). There is no database ORM or direct DB access in this repo. Server Actions and Route Handlers exist only as a secure proxy layer between the browser and the external API.

## Stack

- Framework: Next.js 16.2.4 with App Router
- React 19
- Bundler: Turbopack
- Styling: Tailwind CSS v4 (no CSS Modules, no CSS-in-JS)
- Server data: React Server Components + Server Actions
- Client data: TanStack React Query v5
- Client state: Zustand v5
- UI primitives: Radix UI, Lucide React

## Next.js 16 Breaking Changes

### Async Request APIs

`cookies()`, `headers()`, `params`, and `searchParams` are promises in Next.js 16. They must be awaited.

```ts
// correct
const cookieStore = await cookies()
const { id } = await params
```

### Caching

Implicit fetch caching is removed. Next.js 16 uses the `use cache` directive (Cache Components feature). Enable it in `next.config.ts`:

```ts
const nextConfig: NextConfig = {
  cacheComponents: true,
}
```

Use the directive to cache functions, components, or entire files:

```ts
export async function getProducts() {
  'use cache'
  cacheTag('products')
  cacheLife('hours')
  return fetch('https://api.example.com/products')
}
```

Do not call `cookies()` or `headers()` inside a `use cache` scope. Read them outside and pass as arguments.

For on-demand revalidation, `revalidateTag` requires two arguments in Next.js 16:

```ts
import { revalidateTag } from 'next/cache'
revalidateTag('products', 'max')  // 'max' = stale-while-revalidate, second arg required
```

Single-argument `revalidateTag('products')` is deprecated.

### React Compiler

The React Compiler is enabled. Do not write `useMemo` or `useCallback` manually unless you have a specific reason to control referential identity.

### proxy.ts

`middleware.ts` is replaced by `proxy.ts` at the project root in Next.js 16.

```ts
// proxy.ts
export const config = { matcher: '/dashboard/:path*' }
export function proxy(request: Request) { /* auth, redirect, rewrite */ }
```

## Project Structure

```
src/
  app/                    Next.js App Router pages and layouts
    layout.tsx            Root layout — QueryProvider and Zustand providers go here
    page.tsx
  features/               Feature-sliced modules
    <feature-name>/
      components/         UI components for this feature
      hooks/              React Query hooks for client-side fetching
      actions.ts          Thin Next.js layer: 'use cache' + revalidateTag
      types.ts            TypeScript types for this feature
  components/
    ui/                   Shared UI components
  services/
    api.ts                Base fetch client
    <name>.service.ts     Resource API calls — no Next.js concerns
  store/
    index.ts              Zustand store
  hooks/                  Shared React hooks
  types/
    api.ts                Shared types: PaginatedResponse, ApiError
```

## Data Flow Rules

1. RSC pages → call Server Actions in `features/<name>/actions.ts` or `apiClient` directly
2. Client components → use React Query hooks from `features/<name>/hooks/`
3. Mutations → Server Actions with `revalidateTag(tag, 'max')` after success
4. Never fetch from Route Handlers inside Server Components (breaks at build time)
5. Never expose `API_BASE_URL` or `API_SECRET_KEY` to the client
6. Never re-export types from a `'use server'` file — import from `./types` directly

## Server Action Example

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
  revalidateTag('products', 'max')
  return result
}
```

## Service Example

```ts
// src/services/product.service.ts
import { apiClient } from './api'
import type { Product } from '@/features/products/types'

export const productService = {
  getAll: () => apiClient.get<Product[]>('/products'),
  create: (data: CreateProductDto) => apiClient.post<Product>('/products', data),
}
```

## React Query Hook Example

```ts
// src/features/products/hooks/useProducts.ts
'use client'

import { useQuery } from '@tanstack/react-query'

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: () => fetch('/api/products').then(r => r.json()),
  })
}
```

## Environment Variables

```
NEXT_PUBLIC_APP_URL    client-accessible
API_BASE_URL           server-only, never sent to client
API_SECRET_KEY         server-only
```

## Commands

```
npm run dev      Turbopack dev server
npm run build    Production build
npm run start    Production server
npm run lint     ESLint
```
