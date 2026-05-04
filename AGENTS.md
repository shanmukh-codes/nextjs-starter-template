# Next.js 16 Enterprise Frontend-Only Template

> Read `node_modules/next/dist/docs/` before writing any Next.js code. This version has breaking changes from Next.js 14/15.

## Project

Frontend-only Next.js 16 app. Consumes an external backend API. No database ORMs or direct DB logic in this repo.

## Stack

- Next.js 16.2.4, App Router, React 19, Turbopack
- Tailwind CSS v4 (no CSS Modules)
- TanStack React Query v5 (client fetching)
- Zustand v5 (client state)
- Radix UI + Lucide React

## Breaking Changes in Next.js 16

### Async Request APIs — REQUIRED

`cookies()`, `headers()`, `params`, `searchParams` are all promises. Always await them.

```ts
const cookieStore = await cookies()
const { id } = await params
```

### Caching — `use cache` directive

Implicit fetch caching is removed. Use the `use cache` directive explicitly. Requires `cacheComponents: true` in `next.config.ts`.

```ts
export async function getData() {
  'use cache'
  cacheTag('my-tag')
  cacheLife('hours')
  return fetch('https://api.example.com/data')
}
```

Never call `cookies()` or `headers()` inside a `use cache` scope.

On-demand revalidation: `revalidateTag('my-tag', 'max')` or `revalidatePath('/path')`.

> `revalidateTag` requires two arguments in Next.js 16. The second argument is the cache profile — use `'max'` for stale-while-revalidate (recommended). Single-argument form is deprecated.

### React Compiler

Enabled by default. Do not write `useMemo` or `useCallback` manually.

### proxy.ts

`middleware.ts` is replaced by `proxy.ts` at the project root.

## File Structure

```
src/
  app/                    App Router pages and layouts
  features/<name>/
    components/           Feature UI
    hooks/                React Query hooks
    actions.ts            Server Actions — thin Next.js layer (cache + revalidate)
    types.ts              TypeScript types for this feature
  components/ui/          Shared UI components
  services/
    api.ts                Base fetch client
    <name>.service.ts     Resource-specific API calls (no Next.js concerns)
  store/index.ts          Zustand store
  hooks/                  Shared hooks
  types/api.ts            Shared TypeScript types (PaginatedResponse, ApiError, etc.)
```

## Rules

- RSC pages fetch via Server Actions or `src/services/api.ts` directly
- Client components use React Query hooks
- Never fetch from Route Handlers inside Server Components
- Never expose `API_BASE_URL` or `API_SECRET_KEY` to the client
- All external API calls go through `src/services/api.ts`
- `params` and `searchParams` must be awaited before destructuring
- Never re-export types from a `'use server'` file — import types directly from `./types`
