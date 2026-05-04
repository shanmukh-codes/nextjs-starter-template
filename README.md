# Next.js 16 Enterprise Frontend Template

A production-ready, frontend-only Next.js 16 template with feature-sliced architecture. Designed to consume data from an external backend API (Spring Boot, FastAPI, Django, etc.).

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 |
| Bundler | Turbopack |
| Styling | Tailwind CSS v4 |
| Server data | React Server Components + Server Actions |
| Client data | TanStack React Query v5 |
| Client state | Zustand v5 |
| UI primitives | Radix UI + Lucide React |
| AI IDEs | Cursor, Kiro, Claude Code, Gemini CLI, Codex |

## Getting Started

```bash
# 1. Clone and install
npm install

# 2. Set up environment variables
cp .env.example .env.local
# Edit .env.local — set API_BASE_URL and API_SECRET_KEY

# 3. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
nextjs-template-frontend/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── layout.tsx              # Root layout — providers wired here
│   │   ├── page.tsx                # Home page (RSC)
│   │   └── globals.css             # Tailwind v4 global styles
│   │
│   ├── features/                   # Feature-sliced modules (one folder per domain)
│   │   └── example/                # Example feature — copy this for new features
│   │       ├── types.ts            # TypeScript types for this feature
│   │       ├── actions.ts          # Thin Next.js layer: 'use cache' + revalidateTag
│   │       ├── components/         # UI components specific to this feature
│   │       │   └── ExampleList.tsx
│   │       └── hooks/              # React Query hooks for client-side data
│   │           └── useExampleItems.ts
│   │
│   ├── components/
│   │   ├── providers.tsx           # QueryClientProvider (client wrapper for layout)
│   │   └── ui/                     # Shared, reusable UI components (buttons, modals…)
│   │
│   ├── services/
│   │   ├── api.ts                  # Base fetch client — all external API calls go here
│   │   └── example.service.ts      # Resource API calls — no Next.js concerns
│   │
│   ├── store/
│   │   └── index.ts                # Zustand global store (theme, sidebar, auth user…)
│   │
│   ├── hooks/                      # Shared React hooks used across features
│   │
│   └── types/                      # Shared TypeScript types used across features
│       └── api.ts                  # PaginatedResponse, ApiError, ApiResponse
│
├── proxy.ts                        # Auth guards, redirects, rewrites (replaces middleware.ts)
├── next.config.ts                  # Next.js config — cacheComponents, reactCompiler, images
├── .env.example                    # Environment variable reference
├── CLAUDE.md                       # Rules for Claude Code / Claude CLI
├── GEMINI.md                       # Rules for Gemini CLI
└── AGENTS.md                       # Rules for OpenAI Codex / Agents CLI
```

## Data Flow

```
External API (Spring Boot / FastAPI / Django)
        │
        │  server-only (API_BASE_URL + API_SECRET_KEY never reach browser)
        ▼
src/services/<name>.service.ts   ← pure API calls, typed, no Next.js
        │
        ▼
src/features/<name>/actions.ts   ← 'use server' + 'use cache' + revalidateTag
        │
        ▼
src/app/<route>/page.tsx         ← RSC: await action → pass initialData down
        │
        ▼
src/features/<name>/components/  ← 'use client' + React Query hook
```

## Adding Pages and Features

### Decision tree — what do you need?

```
New page needed?
│
├── No data fetching → just create src/app/<route>/page.tsx (static page)
│
├── Server-rendered data, no client interactivity
│   → RSC page + Server Action only, no React Query hook needed
│
└── Client interactivity (search, filters, mutations, polling)
    → Full feature: actions.ts + hook + component + page
```

---

### Static page (no data)

Just create the file — no feature folder needed:

```tsx
// src/app/about/page.tsx
export const metadata = { title: 'About' }

export default function AboutPage() {
  return <main>About</main>
}
```

---

### Server-only page (data, no interactivity)

RSC fetches directly — no React Query, no `'use client'`:

```tsx
// src/app/products/page.tsx
import { getProducts } from '@/features/products/actions'

export const metadata = { title: 'Products' }

export default async function ProductsPage() {
  const products = await getProducts()
  return (
    <main>
      {products.map(p => <div key={p.id}>{p.name}</div>)}
    </main>
  )
}
```

---

### Dynamic route (`/products/[id]`)

```tsx
// src/app/products/[id]/page.tsx
import { getProduct } from '@/features/products/actions'

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>  // params is a Promise in Next.js 16
}) {
  const { id } = await params      // always await params
  const product = await getProduct(id)
  return <div>{product.name}</div>
}
```

---

### Full feature (data + client interactivity)

### 1. Create the feature folder

```bash
mkdir -p src/features/products/components src/features/products/hooks
```

### 2. Define types (`types.ts`)

```ts
// src/features/products/types.ts
export interface Product {
  id: number
  name: string
  price: number
}

export interface CreateProductDto {
  name: string
  price: number
}
```

### 3. Write the service (`src/services/products.service.ts`)

Pure API calls — no `'use server'`, no `cacheTag`, no `revalidateTag`:

```ts
// src/services/products.service.ts
import { apiClient } from './api'
import type { Product, CreateProductDto } from '@/features/products/types'

export const productsService = {
  getAll: () => apiClient.get<Product[]>('/products'),
  getById: (id: number) => apiClient.get<Product>(`/products/${id}`),
  create: (dto: CreateProductDto) => apiClient.post<Product>('/products', dto),
  remove: (id: number) => apiClient.delete<void>(`/products/${id}`),
}
```

### 4. Write the Server Actions (`actions.ts`)

Thin Next.js orchestration — calls the service, handles caching and revalidation:

```ts
// src/features/products/actions.ts
'use server'

import { productsService } from '@/services/products.service'
import { revalidateTag, cacheTag, cacheLife } from 'next/cache'
import type { Product, CreateProductDto } from './types'

export type { Product, CreateProductDto }

export async function getProducts(): Promise<Product[]> {
  'use cache'
  cacheTag('products')
  cacheLife('minutes')
  return productsService.getAll()
}

export async function createProduct(dto: CreateProductDto): Promise<Product> {
  const result = await productsService.create(dto)
  revalidateTag('products', 'max')  // second arg required in Next.js 16
  return result
}
```

> **Rules:**
> - `'use server'` at file top, `'use cache'` inside read functions
> - `revalidateTag(tag, 'max')` — two arguments required in Next.js 16
> - Never call `cookies()` or `headers()` inside a `'use cache'` scope
> - Types live in `types.ts`, not here

### 5. Write the React Query hook (`hooks/useProducts.ts`)

```ts
// src/features/products/hooks/useProducts.ts
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Product, CreateProductDto } from '../types'

export function useProducts(initialData?: Product[]) {
  return useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => fetch('/api/products').then(r => r.json()),
    initialData,
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateProductDto) =>
      fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      }).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  })
}
```

### 6. Build the UI component

```tsx
// src/features/products/components/ProductList.tsx
'use client'

import { useProducts } from '../hooks/useProducts'
import type { Product } from '../types'

export function ProductList({ initialData }: { initialData?: Product[] }) {
  const { data, isPending, isError } = useProducts(initialData)

  if (isPending) return <p>Loading...</p>
  if (isError) return <p>Something went wrong.</p>

  return (
    <ul>
      {data?.map(p => <li key={p.id}>{p.name} — ${p.price}</li>)}
    </ul>
  )
}
```

### 7. Create the page

```tsx
// src/app/products/page.tsx
import { getProducts } from '@/features/products/actions'
import { ProductList } from '@/features/products/components/ProductList'

export const metadata = { title: 'Products' }

export default async function ProductsPage() {
  const initialData = await getProducts()  // server-side, cached
  return (
    <main>
      <h1>Products</h1>
      <ProductList initialData={initialData} />
    </main>
  )
}
```

### 8. Add a route to the nav (optional)

Add a link in your shared layout or nav component under `src/components/`.

---

### When to skip React Query

Not every feature needs a React Query hook. Use this guide:

| Scenario | What to use |
|---|---|
| Page loads data once, no user interaction | RSC + Server Action only |
| User can filter, search, paginate | React Query hook |
| Form submission / mutation | Server Action + `revalidateTag` |
| Polling / real-time updates | React Query with `refetchInterval` |
| Global UI state (sidebar, theme) | Zustand |

---

### Shared types (`src/types/`)

When multiple features share the same API response shapes or DTOs, put them in `src/types/` instead of duplicating across feature `actions.ts` files:

```ts
// src/types/api.ts
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

export interface ApiError {
  message: string
  code: string
}
```

```ts
// src/features/products/actions.ts
import type { PaginatedResponse } from '@/types/api'
```

Keep feature-specific types (`Product`, `CreateProductDto`) in `src/features/<name>/types.ts`. Only promote to `src/types/` when two or more features need the same shape.

---

## Key Next.js 16 Rules

### Async Request APIs

`cookies()`, `headers()`, `params`, and `searchParams` are **promises** — always await them:

```ts
// Page with dynamic params
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  // ...
}

// Reading cookies
const cookieStore = await cookies()
const token = cookieStore.get('auth-token')
```

### Caching

No implicit caching. Use `'use cache'` explicitly:

```ts
export async function getData() {
  'use cache'
  cacheTag('my-data')
  cacheLife('hours')   // seconds | minutes | hours | days | weeks
  return fetch('https://...')
}
```

Invalidate on mutation: `revalidateTag('my-data', 'max')` (second arg required) or `revalidatePath('/path')`

### React Compiler

Enabled — do **not** write `useMemo` or `useCallback` manually.

### proxy.ts

`middleware.ts` is replaced by `proxy.ts` at the project root. See `proxy.ts` for the auth guard example.

---

## Environment Variables

| Variable | Where used | Description |
|---|---|---|
| `API_BASE_URL` | Server only | Base URL of your external backend API |
| `API_SECRET_KEY` | Server only | Bearer token / API key for the backend |
| `NEXT_PUBLIC_APP_URL` | Client + Server | Public URL of this Next.js app |

Copy `.env.example` to `.env.local` and fill in your values. Never commit `.env.local`.

---

## AI IDE Support

This template includes configuration for multiple AI coding tools:

| File | Tool |
|---|---|
| `CLAUDE.md` | Claude Code, Claude CLI |
| `GEMINI.md` | Gemini CLI |
| `AGENTS.md` | OpenAI Codex, Agents CLI |
| `.cursor/rules/` | Cursor |
| `.kiro/steering/` | Kiro (auto-loaded per file type) |

Each config file teaches the AI the Next.js 16 breaking changes, project architecture, and coding patterns so you get correct code suggestions out of the box.

---

## Scripts

```bash
npm run dev      # Turbopack dev server (http://localhost:3000)
npm run build    # Production build
npm run start    # Production server
npm run lint     # ESLint
```
