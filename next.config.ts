import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enables `use cache` directive, Cache Components, and dynamicIO
  cacheComponents: true,

  // Enables React Compiler — do NOT manually write useMemo/useCallback
  reactCompiler: true,

  experimental: {
    // Optimize Radix UI imports for smaller bundles (lucide-react is optimized by default)
    optimizePackageImports: ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu"],
  },

  // Image domains — add your CDN/API image hosts here
  images: {
    remotePatterns: [
      // Example: { protocol: "https", hostname: "cdn.example.com" },
    ],
  },
};

export default nextConfig;
