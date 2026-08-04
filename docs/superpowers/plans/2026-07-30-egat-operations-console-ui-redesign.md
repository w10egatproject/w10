
# EGAT W10 Operations Console UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax. Do not begin implementation until this plan is approved.

**Goal:** Migrate the seven W10 routes to a shared EGAT Operations Console shell with a desktop sidebar and mobile drawer while preserving existing KPI, filter, chart, table, data-fetching, Google Sheets, and employee/contractor behavior.

**Architecture:** Add a small route-gated shell at the root layout. Non-migrated routes render their current children unchanged; migrated routes render AppShell plus a route-owned PageHeader. Existing route components keep data fetching and business mapping. A legacy/console chrome adapter makes each route reversible.

**Tech Stack:** Next.js 16.2.12 App Router, React 19.2.4, TypeScript, Tailwind CSS 4, Framer Motion 12.40.0 already installed, Lucide React, Highcharts, Recharts, Vitest 4.1.10, Testing Library, Vercel.

## Global Constraints

- Option B is approved: desktop sidebar plus mobile drawer; preserve the existing KPI/chart/table order.
- AppShell and pilot phases must not change API routes, Google Sheets integration, formulas, data normalization, refresh semantics, no-store, force-dynamic, or employee/contractor separation.
- Do not enable Cache Components, change no-store or force-dynamic, or upgrade Next.js during AppShell or pilot phases.
- Do not add Magic UI components during AppShell migration. Add motion only after all seven routes pass behavior checks.
- Keep NavigationMenu and its current tests until all routes are migrated and equivalent coverage exists.
- Do not add a large dependency, state-management library, authentication, schema change, or route change.
- Do not repair the full inherited lint baseline. Fix only new errors or errors in files changed by a task and report the baseline separately.
- This document is the implementation plan only. No source code, config, dependency, API, or data behavior is changed by writing this plan.

---

## Audit baseline

- App Router is used under app.
- Only app/layout.tsx is shared. No route loading.tsx files exist; only app/shop-order/error.tsx exists.
- NavigationMenu.tsx is a 271-line client dropdown using next/link and usePathname; no desktop sidebar or mobile drawer exists.
- Major client pages are app/page.tsx (588 lines), app/purchasing/page.tsx (824), app/beml-inventory/page.tsx (929), and app/ot-summary/page.tsx (800).
- app/purchasing-all/page.tsx reuses PurchasingPageContent. app/ot-employee/page.tsx reuses OtSummaryContent.
- Highcharts and SpeedometerClient are dynamically imported by home and purchasing; ShopOrderSummary uses Recharts.
- Pages use no-store fetches. API routes use force-dynamic or force-no-store. Google Sheets access is server-side in lib/googleSheet.ts.
- No Magic UI or shadcn/ui components exist. Framer Motion is already installed.
- No explicit router.prefetch sites were found. Existing internal links use normal Link behavior.
- Resolved Next.js is 16.2.12 and bundled docs do not include the Partial Prefetching adoption guide.
- Baseline: npm run test:unit passed 15 files and 223 tests; npm run build passed; npm run lint failed with 144 errors and 10 warnings before this work.
- Current working tree was clean after the baseline checks.

## Route migration order

| Order | Route | Reason |
| ---: | --- | --- |
| 1 pilot | /ot-employee | Thin wrapper around shared OT content; no chart library; exercises shell, PageHeader, refresh, source-sheet links, tables, drawer, and responsive behavior |
| 2 | /ot-summary | Same content with contractor data; validates the sibling and employee/contractor split |
| 3 | /beml-inventory | Dense inventory tables and filters without purchasing's shared implementation |
| 4 | /purchasing-all | Fixed-filter wrapper; validates purchasing compatibility with lower interaction complexity |
| 5 | /purchasing | Adds year/month filters, gauges, clickable charts, search, and table filtering |
| 6 | / | Home dashboard with gauges, multiple charts, KPI cards, localStorage filters, and auto-refresh |
| 7 | /shop-order | CRUD, upload, dialogs, attachments, Recharts, and repository-backed APIs; highest interaction risk, so last |

## Locked file map

### New files

- components/navigation/navigationDestinations.ts: shared destination metadata used by old dropdown and new shell.
- components/layout/shellRoutes.ts: exact allowlist, initially only /ot-employee.
- components/layout/ShellMigrationGate.tsx: pathname gate that keeps legacy children unchanged.
- components/layout/AppShell.tsx: shell frame without data fetching.
- components/layout/Sidebar.tsx and SidebarNavItem.tsx: desktop navigation.
- components/layout/MobileTopBar.tsx and MobileNavigationDrawer.tsx: mobile navigation and focus behavior.
- components/layout/PageHeader.tsx: shared title, description, sync status, route-owned filters, refresh, and actions.
- components/layout/RouteChromeAdapter.tsx: explicit legacy/console branch.
- components/layout/LegacyNavigationAdapter.tsx: temporary wrapper preserving NavigationMenu props.
- components/layout/AppShell.test.tsx, Sidebar.test.tsx, MobileNavigationDrawer.test.tsx, PageHeader.test.tsx, shellRoutes.test.ts, and AppShell.integration.test.tsx.
- Later, after all layouts are stable: components/ui/magic/NumberTicker.tsx, BorderBeam.tsx, ShimmerButton.tsx, BlurFade.tsx and their tests.

### Existing files allowed in future migration tasks

- app/layout.tsx: add ShellMigrationGate around children only.
- app/globals.css: semantic EGAT tokens, focus ring, reduced-motion fallback.
- components/navigation/NavigationMenu.tsx and its tests: reuse destination source and preserve old behavior.
- app/ot-summary/page.tsx and app/ot-employee/page.tsx: pilot chrome adapter.
- app/beml-inventory/page.tsx: route chrome only after pilot.
- app/purchasing/page.tsx and app/purchasing-all/page.tsx: shared purchasing chrome mode.
- app/page.tsx: home chrome mode.
- app/shop-order/page.tsx, components/shop-order/ShopOrderDashboard.tsx, and app/shop-order/error.tsx: final route chrome only.

### Files forbidden in AppShell and pilot phases

- app/api/**
- lib/googleSheet.ts
- lib/shop-order/**
- components/charts/**
- components/shop-order/**, except a later task explicitly named for Shop Order
- package.json, package-lock.json, next.config.ts
- .env.example, .env.local, vercel.json
- scratch/**
- Google Sheet URLs, formulas, sheet names, source ranges, fetch URLs, and API response shapes

## Interfaces

~~~ts
export type ConsoleRoute =
  | '/'
  | '/purchasing'
  | '/purchasing-all'
  | '/beml-inventory'
  | '/ot-summary'
  | '/ot-employee'
  | '/shop-order';

export const consoleRoutes: readonly ConsoleRoute[] = ['/ot-employee'];
export function isConsoleRoute(pathname: string): boolean;
~~~

~~~ts
export interface AppShellProps {
  pathname: string;
  children: React.ReactNode;
}

export interface PageHeaderProps {
  title: string;
  description?: string;
  syncStatus?: 'idle' | 'loading' | 'ready' | 'error' | 'stale';
  lastUpdated?: string;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
}
~~~

~~~ts
export type RouteChromeMode = 'legacy' | 'console';

export interface RouteChromeAdapterProps {
  mode: RouteChromeMode;
  legacy: React.ReactNode;
  console: React.ReactNode;
}
~~~

~~~ts
export interface MobileNavigationDrawerProps {
  isOpen: boolean;
  pathname: string;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}
~~~

## Task 1: Foundation and route gate

**Files:** Create shellRoutes.ts and navigationDestinations.ts plus shellRoutes.test.ts. Modify app/globals.css.

- [ ] Write failing tests for exact route matching: only /ot-employee is true initially; query strings do not create new matches; all seven public paths are known route values.
- [ ] Run npx vitest run components/layout/shellRoutes.test.ts and confirm the missing-module failure.
- [ ] Add the exact allowlist and copy current navigation labels/icons without changing URLs.
- [ ] Add EGAT tokens to globals.css: blue #005b9a, blue hover #004a7d, blue active #003c66, amber #f0b323, green #1f7a4d, rose #b42318, navy #0f2747, white #ffffff, mist #f2f6fa, muted #e8eef4, text and border roles.
- [ ] Add visible focus styles and a reduced-motion fallback; do not add Magic UI or route behavior.
- [ ] Run focused tests and git diff --check.
- [ ] Commit the foundation.

Rollback: revert only this foundation commit; no route or API behavior has changed.

## Task 2: Navigation compatibility

**Files:** Create components/layout/LegacyNavigationAdapter.tsx. Modify components/navigation/NavigationMenu.tsx, NavigationMenu.test.tsx, and NavigationMenu.integration.test.ts.

Interface:

~~~ts
export interface LegacyNavigationAdapterProps {
  buttonClassName: string;
  accentClassName?: string;
  itemHoverClassName?: string;
}
~~~

- [ ] Write a failing contract test that the adapter renders the existing trigger and all destination labels.
- [ ] Run the focused NavigationMenu tests and confirm the adapter failure.
- [ ] Make NavigationMenu consume navigationDestinations while preserving its public props, current-route semantics, pointer behavior, Escape, outside click, focus behavior, and close-after-navigation behavior.
- [ ] Implement the thin adapter and keep NavigationMenu exported.
- [ ] Run navigation tests, then npm run test:unit.
- [ ] Commit the adapter.

Rollback: restore the previous destination declaration and keep the old dropdown.

## Task 3: New AppShell components, no route data

**Files:** Create AppShell.tsx, Sidebar.tsx, SidebarNavItem.tsx, MobileTopBar.tsx, MobileNavigationDrawer.tsx, ShellMigrationGate.tsx, AppShell.test.tsx, Sidebar.test.tsx, MobileNavigationDrawer.test.tsx. Modify app/layout.tsx.

- [ ] Write failing tests for shell gating, current-route semantics, keyboard navigation, Escape, outside click, focus restoration, body-scroll lock, and close-after-navigation.
- [ ] Run npx vitest run components/layout and confirm failure because the components do not exist.
- [ ] Implement AppShell with only layout responsibility. It must receive children, never fetch, and never normalize route data.
- [ ] Implement Sidebar with width 232–256px at the desktop breakpoint, icon plus text, at least two current-route cues, and internal next/link navigation.
- [ ] Implement MobileTopBar with a 44×44px-or-larger accessible menu trigger.
- [ ] Implement MobileNavigationDrawer with overlay, Escape, outside click, focus transfer, focus return, body-scroll lock, and immediate state changes. Do not import Framer Motion or Magic UI in this task.
- [ ] Implement ShellMigrationGate with usePathname. It must return children unchanged for legacy routes and AppShell for routes in consoleRoutes.
- [ ] Modify app/layout.tsx only to wrap children with ShellMigrationGate.
- [ ] Run focused tests, components/navigation tests, and npm run test:unit.
- [ ] Run targeted lint against changed shell files; report inherited lint errors separately.
- [ ] Commit the shell scaffold.

Rollback: remove ShellMigrationGate from app/layout.tsx. Legacy routes remain unchanged because they bypass the gate.

## Task 4: Shared PageHeader and chrome adapter

**Files:** Create PageHeader.tsx, RouteChromeAdapter.tsx, and PageHeader.test.tsx.

- [ ] Write failing tests for title, description, visible refresh label, disabled refresh state, accessible action names, and sync status copy.
- [ ] Run npx vitest run components/layout/PageHeader.test.tsx and confirm missing-component failure.
- [ ] Implement PageHeader without fetching or owning filters. Route components pass filter controls and refresh callbacks.
- [ ] Implement RouteChromeAdapter with explicit legacy and console branches.
- [ ] Run focused tests and npm run test:unit.
- [ ] Commit the PageHeader contract.

Rollback: routes can continue to render their legacy branch because legacy is explicit and independent.

## Task 5: Pilot route /ot-employee

**Files:** Modify app/ot-summary/page.tsx and app/ot-employee/page.tsx. Create app/ot-summary/page.test.tsx, app/ot-employee/page.test.tsx, and extend AppShell.integration.test.tsx.

Interface addition:

~~~ts
type OtWorkerType = 'contractor' | 'employee';

export function OtSummaryContent({
  workerType = 'contractor',
  chrome = 'legacy',
}: {
  workerType?: OtWorkerType;
  chrome?: RouteChromeMode;
}): JSX.Element;
~~~

- [ ] Write failing tests with a mocked existing OT response. Assert employee title, source-sheet actions, refresh button, tables, console PageHeader, and legacy branch availability.
- [ ] Run npx vitest run app/ot-summary/page.test.tsx app/ot-employee/page.test.tsx components/layout/AppShell.integration.test.tsx and confirm failure.
- [ ] Add chrome with legacy as the default. Do not alter the OT fetch URL, no-store option, useEffect trigger, refresh callback, workerType mapping, totals, source-sheet links, rows, or employee/contractor split.
- [ ] Render PageHeader only for chrome='console'; retain the existing header branch for chrome='legacy'.
- [ ] Pass chrome='console' from app/ot-employee/page.tsx. Keep /ot-summary legacy.
- [ ] Run npm run test:unit and npm run build.
- [ ] Manually verify 360×800, 390×844, 768×1024, 1024×768, and 1366×768: sidebar, drawer, Escape, outside click, focus restoration, browser Back/Forward, refresh disabled state, table scroll, error/loading state, and no body horizontal scroll.
- [ ] Run targeted lint on pilot files and report the inherited lint baseline separately.
- [ ] Commit the pilot.

Rollback: remove /ot-employee from consoleRoutes and pass chrome='legacy'. No data code needs to be reverted.

## Task 6: Migrate /ot-summary

**Files:** Modify app/ot-summary/page.tsx and shellRoutes.ts. Extend app/ot-summary/page.test.tsx.

- [ ] Add failing contractor console tests while keeping employee tests green.
- [ ] Run the focused OT tests and confirm the contractor console assertion fails.
- [ ] Pass chrome='console' for the contractor page and add /ot-summary to consoleRoutes.
- [ ] Keep workerType, OT fetch, no-store, source links, grouping, totals, tables, and errors unchanged.
- [ ] Run OT tests, npm run test:unit, npm run build, and targeted lint.
- [ ] Perform the same responsive and keyboard matrix.
- [ ] Commit the OT pair migration.

Rollback: remove /ot-summary from consoleRoutes and restore chrome='legacy'.

## Task 7: Migrate /beml-inventory

**Files:** Modify app/beml-inventory/page.tsx and shellRoutes.ts. Create or extend app/beml-inventory/page.test.tsx.

- [ ] Write failing tests for title, filter controls, refresh, inventory columns, empty state, API error, retry, and console chrome.
- [ ] Run the focused inventory tests and confirm the console assertions fail.
- [ ] Add only the console chrome branch. Preserve the no-store fetch, refresh timer, inventory mapping, table rows, and actions.
- [ ] Add /beml-inventory to consoleRoutes.
- [ ] Run focused tests, npm run test:unit, npm run build, targeted lint, and responsive/keyboard checks.
- [ ] Commit the inventory migration.

Rollback: remove /beml-inventory from consoleRoutes and use legacy chrome.

## Task 8: Migrate /purchasing-all

**Files:** Modify app/purchasing/page.tsx, app/purchasing-all/page.tsx, and shellRoutes.ts. Create or extend purchasing tests.

- [ ] Write failing tests for fixed filters, the existing /api/purchasing-all path, chart data, table columns, refresh, and console chrome.
- [ ] Run purchasing-focused tests and confirm failure.
- [ ] Add optional chrome='legacy' to PurchasingPageContent. Do not alter apiPath, fixedFilters, showGaugePanel, tableColumnCount, colorTheme, data fetch, chart options, status-click filter, search, or table behavior.
- [ ] Pass chrome='console' from app/purchasing-all/page.tsx and add /purchasing-all to consoleRoutes.
- [ ] Run focused tests, npm run test:unit, npm run build, targeted lint, and manual chart/table/filter checks.
- [ ] Commit the fixed-filter migration.

Rollback: remove /purchasing-all from consoleRoutes; keep PurchasingPageContent defaulting to legacy for /purchasing.

## Task 9: Migrate /purchasing

**Files:** Modify app/purchasing/page.tsx and shellRoutes.ts. Extend the purchasing test file.

- [ ] Write failing tests for year/month labels, filter changes, refresh preservation, clickable chart status filtering, search, gauges, and console chrome.
- [ ] Run the purchasing tests and confirm failure before opt-in.
- [ ] Pass chrome='console' from the default purchasing page and add /purchasing to consoleRoutes.
- [ ] Preserve fetch query construction, cache no-store, localStorage behavior, refresh timer, chart options, status normalization, search, and table filtering.
- [ ] Run focused tests, npm run test:unit, npm run build, targeted lint, and manual chart/gauge verification.
- [ ] Commit the interactive purchasing migration.

Rollback: remove /purchasing from consoleRoutes and restore legacy chrome.

## Task 10: Migrate / home dashboard

**Files:** Modify app/page.tsx and shellRoutes.ts. Create or extend app/page.test.tsx.

- [ ] Write failing tests for title, year/month filters, refresh preservation, 30-second refresh, status KPI values, group cards, charts, loading, error, and console chrome.
- [ ] Run home-focused tests and confirm failure.
- [ ] Add console chrome and / to consoleRoutes.
- [ ] Preserve dashboard fetch, no-store, localStorage keys, status percentages, chart options, gauge clamping, and refresh timer.
- [ ] Run focused tests, npm run test:unit, npm run build, targeted lint, and manual chart/gauge checks.
- [ ] Commit the home migration.

Rollback: remove / from consoleRoutes and restore legacy chrome.

## Task 11: Migrate /shop-order last

**Files:** Modify app/shop-order/page.tsx, app/shop-order/error.tsx, and shellRoutes.ts. Modify components/shop-order/ShopOrderDashboard.tsx only if the old header cannot be suppressed at the page wrapper. Extend existing Shop Order tests only for the chrome contract.

- [ ] Write failing tests for console chrome while preserving load, filters, add, edit, delete, upload, attachment preview, error, retry, and pagination behavior.
- [ ] Run Shop Order tests and confirm the console assertion fails.
- [ ] Prefer a page-level adapter. Only add an optional chrome prop to ShopOrderDashboard if it is necessary to avoid duplicate header rendering.
- [ ] Preserve every /api/shop-order call, upload-session behavior, attachment URL, repository result, dialog state, table filtering, and safe error envelope.
- [ ] Add /shop-order to consoleRoutes and keep error.tsx reset behavior.
- [ ] Run Shop Order tests, npm run test:unit, npm run build, targeted lint, and manual CRUD/upload checks at desktop, tablet, and mobile widths.
- [ ] Commit the final route migration.

Rollback: remove /shop-order from consoleRoutes and restore legacy chrome. Do not roll back API or repository code because this task forbids changing it.

## Task 12: Final shell cleanup

**Files:** Modify shellRoutes.ts, ShellMigrationGate.tsx, app/layout.tsx, NavigationMenu.tsx, NavigationMenu.test.tsx, and NavigationMenu.integration.test.ts. Create or extend RouteMigration.integration.test.tsx.

- [ ] Write a failing test asserting all seven public routes use the console shell and no route renders the legacy dropdown header.
- [ ] Run it and confirm failure until the allowlist and route branches are complete.
- [ ] Add all seven routes to consoleRoutes and remove only unreachable legacy branches after all route tests pass.
- [ ] Keep NavigationMenu until the replacement contract is fully covered; remove it only in this cleanup task.
- [ ] Decide whether to keep the harmless gate or render AppShell directly from app/layout.tsx. Direct render is allowed only after all routes are green.
- [ ] Run all tests, build, targeted lint, and the full manual route checklist.
- [ ] Commit final shell cleanup.

Rollback: keep the route gate and restore the last known-good allowlist if cleanup regresses any route.

## Task 13: Motion and Magic UI after layout stability

**Files:** Create components/ui/magic/NumberTicker.tsx, BorderBeam.tsx, ShimmerButton.tsx, BlurFade.tsx and tests. Modify globals.css and only route components with a verified state-feedback use case.

- [ ] Write failing tests for final values, no first-render count from zero, disabled/loading button state, accessible final announcement, and reduced-motion fallback.
- [ ] Run the Magic UI tests and confirm missing-component failures.
- [ ] Implement local primitives using the existing Framer Motion dependency; add no package.
- [ ] Use NumberTicker only for true KPI changes after refresh; BorderBeam only for temporary sync state; ShimmerButton only for a justified primary action; BlurFade only for compact feedback.
- [ ] Do not animate images, logos, every card, every section, or the full page. Do not gate content visibility on motion.
- [ ] Run all tests, npm run build, targeted lint, and reduced-motion visual checks.
- [ ] Commit motion separately from shell migration.

Rollback: remove primitive usage while keeping the static shell.

## Task 14: Separate Next.js and Partial Prefetching review

This is a separate, decision-gated phase and is not part of AppShell or pilot acceptance.

**Inspect only initially:** package.json, package-lock.json, next.config.ts, app/layout.tsx, route fetch calls, API cache directives, and version-matched docs under node_modules/next/dist/docs.

- [ ] Record the resolved Next.js version, lockfile version, peer dependencies, Vercel compatibility, and available guides.
- [ ] Inventory every Link, router.prefetch, searchParams, runtime API read, no-store, and force-dynamic directive.
- [ ] Define cache policy for Google Sheets summaries, manual refresh, OT freshness, and Shop Order data before proposing config changes.
- [ ] Prepare a separate upgrade/config plan only if the installed version and policy support it.
- [ ] Do not modify dependencies, next.config.ts, no-store, or force-dynamic in the AppShell migration commits.

Rollback: no rollback is needed because this phase begins as a read-only review.

---

## Tests and verification

After the pilot and each route task:

~~~bash
npx vitest run <focused tests>
npm run test:unit
npm run build
npx eslint <changed files>
~~~

The repository has no npm test script; use npm run test:unit. Do not use a passing build to claim lint is clean.

Manual checks at 360×800, 390×844, 768×1024, 1024×768, 1366×768, 1440×900, and 1920×1080:

- Sidebar at desktop and top bar/drawer below the desktop breakpoint.
- Current route communicated by more than color alone.
- Keyboard access to menu, filters, refresh, tables, dialogs, and retry.
- Escape, outside click, focus transfer, focus restoration, and close-after-navigation.
- Browser Back/Forward preserves the expected route and route state.
- No body horizontal scroll; wide tables scroll inside their containers.
- Thai labels and controls survive 320px and 200% zoom.
- Initial loading shows shell plus local skeletons.
- Refresh keeps old data, prevents duplicate refresh, and reports success/failure.
- Empty, filtered-empty, partial-error, full-error, and stale states are distinct.
- No new console error or hydration warning.
- No credential, internal file path, raw API error, or secret is visible in the client.

For every route, compare before and after:

- Same route URL and Thai title vocabulary.
- Same API path and query parameters.
- Same KPI values/formulas and filter defaults.
- Same chart categories, series, and click-to-filter behavior.
- Same table columns, row counts, statuses, and employee/contractor split.
- Same refresh timer and manual refresh semantics.
- Same Google Sheet links.
- Same Shop Order CRUD/upload behavior.

## Risk register

| ID | Risk | Prevention |
| --- | --- | --- |
| R1 | Duplicate old header and new shell | Route allowlist plus explicit legacy/console chrome mode; pilot only one route |
| R2 | Root client boundary grows too large | Shell gate owns only pathname and navigation state; no data fetch or global data context |
| R3 | Shared OtSummaryContent changes both employee and contractor pages | Legacy default; opt employee first, contractor second, test both |
| R4 | Navigation keyboard/focus regression | Keep current tests, add shell drawer tests, manually verify Escape/outside click/focus |
| R5 | Thai labels overflow on narrow screens | Test 320px/200% zoom; icon plus text; internal sidebar scroll |
| R6 | Charts or tables change meaning during refactor | Do not touch chart/data components in shell phases; route data-parity checklist |
| R7 | Refresh clears trusted data | Keep current no-store client fetch and route state; preserve old data until new response is ready |
| R8 | Baseline lint noise hides new errors | Targeted lint on changed files and a separate inherited-baseline report |
| R9 | Next.js upgrade/cache changes break freshness | Separate decision-gated phase; no config or dependency change in AppShell |
| R10 | Magic UI adds distraction or accessibility regressions | Add motion last, local primitives only, reduced-motion tests, state-only usage |
| R11 | Shop Order upload/dialog behavior regresses | Migrate last; reuse existing components and tests; do not touch repository/API files |
| R12 | Security boundary is weakened | No .env/API/lib changes; keep Google Sheets server-side and error messages safe |

## Plan self-review

- Spec coverage: includes option B, phased migration, pilot route and rationale, new shell components, root layout, adapter, seven-route order, tests, rollback points, forbidden files, risk controls, Magic UI sequencing, lint baseline handling, and Partial Prefetching separation.
- Placeholder scan: no TBD, TODO, or unbounded “write tests” steps; each task names files, commands, expected behavior, and rollback.
- Type consistency: ConsoleRoute, RouteChromeMode, AppShellProps, PageHeaderProps, and MobileNavigationDrawerProps are reused consistently.
- Scope check: AppShell, route migration, motion, and Next.js performance are separate checkpoints. Data/API/dependency changes are excluded from shell and pilot tasks.

## Handoff

Plan complete and saved to docs/superpowers/plans/2026-07-30-egat-operations-console-ui-redesign.md. Implementation is intentionally not started. Proceed only after explicit plan approval.

