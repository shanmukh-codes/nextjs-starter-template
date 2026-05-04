"use client";

/**
 * Client-side providers wrapper.
 * Rendered once in the root layout — keeps layout.tsx a Server Component.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  // useState ensures each request gets its own QueryClient (SSR safety)
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Don't refetch on window focus in dev — noisy
            refetchOnWindowFocus: process.env.NODE_ENV === "production",
            // Stale time: 60s — adjust per feature via queryKey options
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
