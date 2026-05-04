/**
 * Home page — React Server Component.
 *
 * Demonstrates the full data flow:
 * 1. RSC calls Server Action (server-side, cached via 'use cache')
 * 2. Result passed as initialData to client component
 * 3. React Query hydrates from initialData — no loading flash on first render
 */

import { getExampleItems } from "@/features/example/actions";
import { ExampleList } from "@/features/example/components/ExampleList";
import { Suspense } from "react";

export const metadata = { title: "Home" };

export default async function HomePage() {
  const initialItems = await getExampleItems();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-10 px-6 py-16">

      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-zinc-900 px-2.5 py-0.5 text-xs font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">
            Next.js 16
          </span>
          <span className="text-xs text-zinc-400">Enterprise Frontend Template</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Your project starts here.
        </h1>
        <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Feature-sliced architecture with React Query, Zustand, Tailwind v4, and
          full AI IDE support. Delete the example feature and start building.
        </p>
      </div>

      {/* Stack badges */}
      <div className="flex flex-wrap gap-2">
        {[
          "App Router",
          "React 19",
          "Turbopack",
          "Tailwind v4",
          "React Query v5",
          "Zustand v5",
          "Radix UI",
          "Server Actions",
          "use cache",
        ].map((item) => (
          <span
            key={item}
            className="rounded-md border border-zinc-200 px-2.5 py-1 text-xs text-zinc-600 dark:border-zinc-800 dark:text-zinc-400"
          >
            {item}
          </span>
        ))}
      </div>

      {/* Example feature — live demo */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
            Example Feature
          </h2>
          <span className="text-xs text-zinc-400">
            Delete <code className="font-mono">src/features/example/</code> when done
          </span>
        </div>
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <Suspense fallback={<p className="text-sm text-zinc-500">Loading...</p>}>
            <ExampleList initialItems={initialItems} />
          </Suspense>
        </div>
      </div>

      {/* How to add a feature */}
      <div className="flex flex-col gap-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
          Adding a New Feature
        </h2>
        <div className="flex flex-col gap-2">
          {[
            {
              step: "1",
              file: "src/features/<name>/types.ts",
              desc: "TypeScript interfaces and DTOs",
            },
            {
              step: "2",
              file: "src/services/<name>.service.ts",
              desc: "Raw API calls — no Next.js concerns",
            },
            {
              step: "3",
              file: "src/features/<name>/actions.ts",
              desc: "'use server' — caching and revalidation",
            },
            {
              step: "4",
              file: "src/features/<name>/hooks/use<Name>.ts",
              desc: "React Query hooks for client reactivity",
            },
            {
              step: "5",
              file: "src/features/<name>/components/",
              desc: "'use client' UI components",
            },
            {
              step: "6",
              file: "src/app/<route>/page.tsx",
              desc: "RSC page — await action, pass initialData",
            },
          ].map(({ step, file, desc }) => (
            <div
              key={step}
              className="flex items-start gap-3 rounded-md border border-zinc-100 px-3 py-2.5 dark:border-zinc-900"
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-medium text-zinc-500 dark:bg-zinc-900">
                {step}
              </span>
              <div className="flex flex-col gap-0.5">
                <code className="text-xs font-mono text-zinc-700 dark:text-zinc-300">
                  {file}
                </code>
                <span className="text-xs text-zinc-400">{desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key rules */}
      <div className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
          Key Rules
        </h2>
        <ul className="flex flex-col gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          <li>→ RSC pages call Server Actions and pass <code className="font-mono">initialData</code> to client components</li>
          <li>→ Client components use React Query hooks — never raw fetch</li>
          <li>→ All external API calls go through <code className="font-mono">src/services/api.ts</code></li>
          <li>→ <code className="font-mono">API_BASE_URL</code> and <code className="font-mono">API_SECRET_KEY</code> are server-only — never exposed to the browser</li>
          <li>→ Never re-export types from a <code className="font-mono">'use server'</code> file — import from <code className="font-mono">./types</code> directly</li>
          <li>→ Wrap client components that use React Query in <code className="font-mono">&lt;Suspense&gt;</code></li>
        </ul>
      </div>

      {/* AI IDE support */}
      <div className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
          AI IDE Support
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {[
            { tool: "Claude Code", file: "CLAUDE.md" },
            { tool: "Gemini CLI", file: "GEMINI.md" },
            { tool: "Codex / Agents", file: "AGENTS.md" },
            { tool: "Cursor", file: ".cursor/rules/" },
            { tool: "Kiro", file: ".kiro/steering/" },
          ].map(({ tool, file }) => (
            <div
              key={tool}
              className="flex flex-col gap-0.5 rounded-md border border-zinc-100 px-3 py-2 dark:border-zinc-900"
            >
              <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{tool}</span>
              <code className="text-xs text-zinc-400 font-mono">{file}</code>
            </div>
          ))}
        </div>
      </div>

    </main>
  );
}
