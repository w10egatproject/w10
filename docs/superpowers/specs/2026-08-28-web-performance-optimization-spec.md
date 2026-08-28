# Spec: W10 Dashboard Web Performance & Responsiveness Optimization

**Status:** Ready for implementation  
**Author:** AI Pair Programmer (Frontend Expert & Ponytail)  
**Date:** 2026-08-28  

---

## Problem Statement

Users of the W10 Dashboard require real-time visibility into Work Orders, Purchasing, Inventory, OT, and Shop Orders. Currently, several performance bottlenecks affect the web experience:
1. **Initial Bundle Overhead**: Heavy third-party packages (e.g. Lucide icon bundle, full dialog component trees) and non-split modal components are imported synchronously in initial page chunks, increasing initial JS parsing time and Time-to-Interactive (TTI).
2. **Server-Side Auth Instantiation Latency**: Google Sheets API client (`google.auth.JWT` and `google.sheets`) is instantiated and authenticated from scratch on every single incoming HTTP request, parsing RSA private keys repeatedly and adding ~200-400ms unnecessary latency to API responses.
3. **Font Network Overhead**: Redundant CSS `@font-face` declarations attempt to reference non-existent `.otf` and `.ttf` formats alongside `.woff2`.
4. **Dialog Component Eager Loading**: Large modal dialogs in Shop Order and Consumables are parsed and bundled on page load even when the user has not opened them.

---

## Solution

Implement an end-to-end performance optimization strategy adhering to Ponytail (minimalism, simplicity) and Frontend Expert (lazy loading, code-splitting, memoization, zero layout shift) principles:
1. **Next.js 16 Compiler Optimizations (`next.config.ts`)**:
   - Enable `optimizePackageImports: ['lucide-react']` to treeshake and load only required SVG icons.
   - Enable `compress: true` and `poweredByHeader: false`.
   - Remove console noise in production builds.
2. **Google Sheets JWT & API Client In-Memory Caching (`lib/googleSheet.ts`)**:
   - Cache and reuse authenticated `sheets` clients across requests so that JWT auth tokens are maintained and reused for their full 1-hour lifecycle without repeated RSA decryption.
3. **Dynamic Code Splitting for Heavy Dialogs**:
   - Dynamically load `OrderDetailDialog`, `OrderFormDialog`, `ConsumableDetailDialog`, and `ConsumableFormDialog` using `next/dynamic` with `ssr: false`.
4. **CSS & Font Cleanup (`app/globals.css`)**:
   - Streamline `@font-face` declarations to strictly reference `.woff2`, eliminating dead font requests.
5. **Chart & Component Memoization**:
   - Ensure expensive computations and series generators in `app/page.tsx` and `app/purchasing/page.tsx` are wrapped with `useMemo` and event handlers with `useCallback`.

---

## User Stories

1. As a W10 supervisor viewing the dashboard, I want pages to load immediately on desktop and mobile, so that I can monitor Work Order status without waiting for heavy JavaScript execution.
2. As a maintenance engineer accessing the Shop Order module, I want the table and summaries to render instantly, so that modal creation forms only load when I actively click "Create Order".
3. As a purchasing coordinator checking procurement data, I want 3D charts and summary gauges to render smoothly without freezing the browser during year/month transitions.
4. As an administrative staff member reviewing OT scans and errors, I want server API responses to return within milliseconds by reusing authenticated backend connections.
5. As a mobile operator on slower field network connections, I want the initial HTML/JS download payload to be as compact as possible.
6. As a developer maintaining the codebase, I want all performance enhancements to maintain strict TypeScript safety, zero regressions, and 100% test coverage.

---

## Implementation Decisions

1. **Client-Side Lazy Loading for Modals**:
   - Use `dynamic(() => import(...), { ssr: false })` for dialog components in `ShopOrderDashboard` and `ConsumableDashboard`. Modals will be loaded on demand.
2. **Backend JWT Client Singleton in Server Scope**:
   - Maintain module-level singleton references for `sheets` client instances indexed by sheet ID in `lib/googleSheet.ts`.
3. **Next.js Bundler Configuration**:
   - Add `optimizePackageImports` for `lucide-react` in `next.config.ts`.
4. **Font Optimization**:
   - Keep only modern `.woff2` font definitions in `globals.css` matching `app/layout.tsx`.

---

## Testing Decisions

- **Automated Behavioral Tests**:
  - Run all 35 Vitest test suites (315 tests) to guarantee zero functional regressions across all routes.
  - Run `next build` to verify type checking and static generation across all 7 routes.
- **Seam of Testing**:
  - Existing API Route Handlers, component integration tests, and UI unit tests.

---

## Out of Scope

- Changing Google Sheets backend data structures or sheet column ranges.
- Migrating remaining legacy routes to console AppShell (scheduled for separate UI phase).
- Modifying business calculation algorithms.

---

## Further Notes

All changes strictly follow Ponytail's ladder: reach for Next.js built-ins and standard optimizations before introducing custom complexities.
