# EGAT Operations Console UI Redesign

**Status:** Approved direction; awaiting written-spec review before implementation.

**Goal:** Redesign every dashboard surface as a readable EGAT/Mae Moh operations console, add restrained Magic UI motion, and adopt Partial Prefetching without changing the existing operational data behavior.

**Product context:** W10 maintenance and administrative staff use this dashboard during daily operations to check work orders, purchasing progress, inventory, and overtime totals sourced from Google Sheets. The primary users include supervisors who need to read totals and find the correct page quickly.

## Design principles

1. **Readable before impressive.** The interface must remain usable at a glance for an experienced supervisor. Body text is at least 16px where space allows, table density is intentional, and contrast is checked rather than assumed.
2. **EGAT identity through structure and color.** Use the existing EGAT/W10 imagery and a blue, amber, green, and neutral palette. Avoid turning the dashboard into a promotional landing page or recreating official artwork.
3. **One vocabulary across routes.** Every page uses the same navigation, header controls, button shapes, focus treatment, status badges, table treatment, loading state, empty state, and error recovery pattern.
4. **Motion explains state.** Motion acknowledges refreshes, filter changes, menu transitions, and success/error states. It must not delay the first usable view or animate unrelated content for decoration.
5. **Preserve the operational model.** Existing routes, Thai labels, filters, charts, tables, data-fetching behavior, and employee/contractor separation remain intact unless a change is required to support the shared UI shell.

## Visual language

### Physical scene

The interface should feel like a supervisor reviewing a live maintenance console in an EGAT operations office near Mae Moh: bright, practical, high-contrast, and calm enough for repeated use. Industrial character comes from the blue/amber system, hierarchy, and restrained energy-line accents—not from dark decorative surfaces, coal textures, or dense effects.

### Palette roles

The exact values will be tuned against the existing EGAT asset colors during implementation. The roles below are fixed so contrast and semantics stay consistent.

| Role | Use | Direction |
| --- | --- | --- |
| EGAT blue | Primary navigation, current route, primary actions, links | Deep saturated blue with white text |
| Mae Moh amber | Active filters, energy accent, attention state, selected KPI emphasis | Warm amber with dark text |
| Operations green | Success, completed work, healthy data state | Deep green with white or near-black text as contrast requires |
| Alert rose | Errors and blocked operations only | Deep rose/red with clear icon and copy |
| Console navy | Sidebar and high-contrast headings | Near-navy, never used for long body copy on dark surfaces |
| Surface white | Tables, forms, charts, and readable content areas | True or near-white neutral |
| Surface mist | Page background and secondary panels | Cool neutral, not cream or beige |

Use accent colors for action and state, not for decorative card fills. Do not use gradient text, full-page gradients, side-stripe accent borders, or default glassmorphism.

### Typography and shape

- Keep Prompt as the Thai-capable family already loaded by the app.
- Use a fixed product scale instead of fluid display type: 16px body text, 14–16px controls, 20–28px section headings, and 30–36px page titles when space permits.
- Reduce excessive uppercase and letter spacing in labels; Thai copy should read naturally.
- Use 12–16px corner radii for panels and controls. Reserve pill shapes for compact status badges only.
- Prefer a solid border or a defined small shadow on a surface, not both as decoration.
- Use a semantic focus ring visible against both light and dark surfaces.

## Application shell and navigation

### Shared shell

Create a shared shell that wraps every page route:

- Desktop: a 232–256px left navigation rail with the EGAT/W10 identity, route groups, and a clear active surface.
- Mobile/tablet: a closed navigation drawer opened by a large, keyboard-accessible menu button.
- Main content: a consistent page header followed by the route content; avoid different sticky-header implementations per page.
- Page header: page title, short purpose sentence, year/month filters where applicable, sync/update state, refresh control, and the navigation trigger.
- Content width: allow wide operational tables to scroll horizontally while keeping titles and controls visible.

The current `NavigationMenu` behavior—outside click, Escape, focus return, current-route state, and pointer/keyboard handling—must be preserved or covered by equivalent tests. Navigation should use `next/link` as the primary route mechanism.

### Page surface patterns

- KPI groups use compact, clearly labeled metric rows rather than repeated oversized hero cards.
- Charts sit in white surfaces with a stable title, legend, and empty-data message.
- Tables use sticky headers, strong row separators, readable status badges, and an explicit no-results state.
- Loading states preserve the final layout with skeletons or in-place progress; they must not replace the entire page with a centered spinner.
- Error states explain what failed in plain Thai and provide a clear retry action without exposing internal details.

## Magic UI layer

Use local, focused Magic UI-style primitives built on the existing React, Tailwind, and Framer Motion stack. Do not add an unneeded runtime dependency or a decorative component to every card.

Recommended primitives and their boundaries:

- `NumberTicker`: animate KPI number changes after data is available; render the final value immediately for reduced-motion users and assistive technology.
- `BorderBeam`: show a short blue/amber beam around the active refresh or in-progress data surface only. It is not a permanent effect on every panel.
- `ShimmerButton`: use for one primary action per surface, such as Refresh, Save, Upload, or Retry. Keep the label, contrast, focus ring, and disabled state conventional.
- `BlurFade`: use for compact state transitions such as an inline success confirmation, filter result change, or empty-state reveal. Do not gate primary content visibility behind the animation.

All primitives must have explicit default, hover, focus, active, disabled, loading, and reduced-motion behavior where applicable. Do not animate `<img>` elements or image descendants on hover.

## Motion strategy

- 100–150ms: button press, focus, color, and status feedback.
- 150–250ms: menu open/close, filter changes, tab or panel state changes.
- 300–500ms: drawer or dialog entry where required.
- No orchestrated page-load sequence and no uniform fade-in for every section.
- Use transform and opacity for movement; do not casually animate layout-driving width, height, top, left, or margins.
- Use the existing Framer Motion dependency with `MotionConfig` or equivalent reduced-motion handling, plus a global `prefers-reduced-motion` fallback in `globals.css`.
- Ensure content is visible in its default state even if animation does not run.

## Partial Prefetching adoption

The repository currently uses Next.js 16.2.12, while the adoption skill requires Next.js 16.3 or later. The implementation plan must first move to a compatible Next.js version and read the bundled version-matched guide in `node_modules/next/dist/docs/` before changing configuration.

Adoption sequence:

1. Audit all `<Link>` and imperative `router.prefetch()` sites across `app/`, `components/`, and shared code. Keep `prefetch={false}` behavior unchanged.
2. Confirm the app boots with Cache Components support, then enable `cacheComponents: true` and `partialPrefetching: true` in `next.config.ts` when the installed Next.js version supports both flags.
3. Adopt navigation destinations using the App Shell model. If a route reads `params` or `searchParams`, keep URL-dependent content behind the appropriate Suspense boundary and do not silently turn every link into a full runtime prefetch.
4. Verify the dev route sweep through the running app and its dev log, then verify the production behavior with `next build` and `next start`. The handoff must identify any route that still needs a live shell check.

Runtime prefetching of URL-specific data is not automatically added. It is a separate decision because each prefetch can invoke server work and may expose user-specific data if cached incorrectly.

## Data flow and resilience

- Shared shell components receive display data and callbacks from each route; they do not access Google Sheets or API routes directly.
- Existing route-level fetches, refresh timers, and filter query parameters remain the source of truth.
- Loading, error, empty, and success states use shared visual primitives but preserve route-specific recovery actions.
- Error UI shows a safe user-facing message and logs no secrets or raw external-service responses.
- API, authentication, and storage behavior are out of scope for the visual redesign unless a build or runtime check identifies a direct integration issue.

## Testing and verification

Implementation follows TDD for new shared behavior:

- Add or update Vitest/Testing Library tests for navigation destinations, active route state, keyboard Escape/focus return, mobile menu behavior, and primary action states.
- Test `NumberTicker`, `BorderBeam`, `ShimmerButton`, and `BlurFade` for accessible labels, final values, disabled behavior, and reduced-motion fallback. Assertions should target user-visible behavior, not animation implementation details.
- Add integration coverage that mounts the shared shell around representative routes and confirms filters, refresh controls, and navigation remain reachable.
- Run existing unit/integration suites, ESLint, TypeScript/build verification, and the production start check.
- Perform visual QA at approximately 1366×768, 1024×768, and 390×844 across every route: `/`, `/purchasing`, `/purchasing-all`, `/beml-inventory`, `/ot-summary`, `/ot-employee`, and `/shop-order`.
- Check keyboard-only navigation, visible focus, color contrast, no horizontal overflow outside intentional tables, reduced motion, empty data, API error, and slow loading states.
- Confirm no page content is blank when animations are disabled and no table/action is blocked during transitions.

## Success criteria

The redesign is ready for review when:

1. A supervisor can identify the current route, key filters, and primary totals without learning a new interaction pattern.
2. All routes share the same EGAT shell and component vocabulary.
3. Magic UI effects appear only where they communicate loading, change, or feedback.
4. Thai labels and dense operational tables remain readable on desktop and mobile.
5. Reduced-motion users receive the same information and controls without animation.
6. Partial Prefetching verification shows a usable shared App Shell after navigation, and `next build` plus `next start` complete successfully.

## Non-goals

- Replacing Google Sheets, API routes, charts, or the operational data model.
- Redrawing or modifying official EGAT marks.
- Adding a marketing hero, decorative mine illustration, or full-screen animated background.
- Introducing a new state-management library or replacing Framer Motion.
- Opting every route into runtime URL-data prefetching without a separate data-freshness and privacy decision.
