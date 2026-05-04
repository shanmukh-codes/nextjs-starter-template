/**
 * proxy.ts — replaces middleware.ts in Next.js 16.
 *
 * Runs on every matched request before it reaches a route.
 * Use for: auth guards, redirects, request rewrites, header injection.
 *
 * Docs: node_modules/next/dist/docs/01-app/02-guides/backend-for-frontend.md
 */

import { NextResponse } from "next/server";

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static  (static files)
     * - _next/image   (image optimization)
     * - favicon.ico
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

export function proxy(request: Request) {
  // ── Auth guard example ──────────────────────────────────────────────────
  // Uncomment and adapt once you have an auth token cookie:
  //
  // const token = request.cookies.get("auth-token")?.value;
  // const isProtected = request.nextUrl.pathname.startsWith("/dashboard");
  //
  // if (isProtected && !token) {
  //   return NextResponse.redirect(new URL("/login", request.url));
  // }

  // ── Pass through by default ─────────────────────────────────────────────
  return NextResponse.next();
}
