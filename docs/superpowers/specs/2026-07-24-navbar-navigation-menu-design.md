# Navbar Navigation Menu Design

## Context

The dashboard currently embeds nearly identical navigation dropdown markup and state inside multiple page components. The copies have drifted: some routes omit a navigation item, while others include the current page. The menu also opens only on click, although desktop users expect the navbar control to open on hover.

The dashboard has six destinations:

1. `/` — หน้าหลัก
2. `/purchasing` — จัดซื้อจัดจ้าง
3. `/purchasing-all` — สถานะการซื้อจ้างทั้งหมด
4. `/beml-inventory` — คลังอะไหล่ BEML
5. `/ot-summary` — สรุป OT ลูกจ้าง
6. `/ot-employee` — สรุป OT พนักงาน

## Goals

- Show all six destinations on every dashboard route.
- Keep the current destination visible, highlighted, and non-navigable.
- Open the menu on pointer hover for desktop users.
- Preserve click and tap behavior for touch and hybrid devices.
- Support keyboard operation and clear accessible state.
- Preserve each page's existing navbar button color theme.
- Remove the duplicated navigation data and interaction logic that caused route drift.

## Non-goals

- Moving the entire page header into the root layout.
- Redesigning page titles, filters, refresh buttons, or header layout.
- Changing page-specific colors outside the navigation control.
- Refactoring unrelated page content or animation.

## Chosen Approach

Create one shared client component, `NavigationMenu`, and replace each page's inline navigation dropdown with it. Keep page headers in their current page components. Each page passes only its button and accent theme classes; the shared component owns destinations, route matching, open state, accessibility, and dismissal behavior.

This has a smaller blast radius than moving all headers into the root layout while eliminating the duplication that caused the defect.

## Component Boundary

`NavigationMenu` has one responsibility: render and control navigation among the six dashboard routes.

The component:

- reads the active route with Next.js `usePathname`;
- owns the canonical ordered destination list;
- renders the trigger and dropdown;
- determines and renders the current-page state;
- owns hover, click, focus, outside-click, Escape, and close-delay behavior;
- accepts theme classes needed to preserve existing page colors.

Page components retain responsibility for header composition and their page-specific controls.

The public props are intentionally small:

```ts
interface NavigationMenuProps {
  buttonClassName: string;
  accentClassName?: string;
}
```

`buttonClassName` preserves the existing per-page button theme. `accentClassName` is optional and affects only purchasing-related navigation icons where an existing page theme already supplies an accent. The component provides all structural, spacing, state, and accessibility classes.

## Interaction Design

### Pointer

- Entering the trigger or dropdown opens the menu.
- Leaving the combined navigation region schedules a close after 150 milliseconds.
- Re-entering before the delay expires cancels the close.
- The short delay lets users cross the visual gap between trigger and dropdown without losing the menu.

### Click and Touch

- Activating the trigger toggles the menu.
- Activating a destination navigates through Next.js `Link`.
- Activating outside the navigation region closes the menu.
- The current destination is rendered as a non-link item, so it cannot trigger redundant navigation.

### Keyboard and Focus

- The trigger remains a native `button`.
- Enter and Space use native button activation to toggle the menu.
- Focus entering the navigation region keeps the menu open.
- Focus leaving the navigation region closes it.
- Escape closes the menu and returns focus to the trigger.

### Route Changes

- Navigation uses Next.js `Link`.
- The shared component derives the current destination from `usePathname`.
- After a route change, the newly active destination is highlighted and non-navigable.

## Accessibility

- The trigger exposes `aria-expanded` and `aria-controls`.
- The destination container uses semantic navigation/list markup rather than application-menu ARIA roles, because the items are ordinary page links.
- The current item exposes `aria-current="page"` and is rendered without an active link target.
- Hover is an enhancement; every action remains available through click, touch, and keyboard.
- Focus-visible styling remains clear against each existing page theme.
- Reduced-motion users receive an immediate or simplified state transition.

## Visual Behavior

- Preserve the existing trigger shape, typography, spacing, and per-page colors.
- Preserve the existing dropdown width and general visual vocabulary.
- Use one consistent hover, focus, current-page, divider, and icon treatment across routes.
- Keep the dropdown above page content and ensure it is not clipped by the sticky header.
- Do not introduce decorative motion. Animation communicates only open and closed state.

## State and Failure Handling

- A single boolean controls open state.
- A ref stores the close timer; opening cancels any pending close.
- Cleanup clears pending timers on unmount.
- A document-level outside-pointer listener is attached only while the menu is open and is removed during cleanup.
- Route matching uses exact known paths. If an unknown route renders the component, all six destinations remain navigable and none is marked current.

## Testing Strategy

Add component-level regression coverage using Vitest, jsdom, React Testing Library, and `user-event`.

Required tests:

1. All six destinations render in the canonical order on every known pathname.
2. The current destination has `aria-current="page"` and no active link.
3. Pointer entry opens the menu.
4. Pointer leave closes only after the delay.
5. Pointer re-entry cancels a pending close.
6. Trigger click toggles the menu for touch-compatible behavior.
7. Outside interaction closes the menu.
8. Enter and Space toggle through native button activation.
9. Escape closes the menu and restores trigger focus.
10. Unmount clears pending timers and listeners.
11. Theme props preserve the supplied page-specific classes.

Verification also includes:

- ESLint;
- the full component test suite;
- a Next.js production build;
- browser checks at desktop and mobile widths on all six routes;
- keyboard-only navigation and a visual clipping/z-index check.

## Rollout

1. Add the failing regression tests for the shared component contract.
2. Implement `NavigationMenu` with the canonical destination list.
3. Replace each inline dropdown while preserving the surrounding header.
4. Remove obsolete `menuOpen` state and navigation-only imports from page files.
5. Run automated verification.
6. Inspect all six routes in the browser at desktop and mobile widths.

## Acceptance Criteria

- Hovering the navbar menu trigger on desktop opens the dropdown.
- Moving from the trigger into the dropdown does not make it disappear.
- Click/tap and keyboard operation continue to work.
- Every route displays all six destinations.
- The current route is visibly highlighted and cannot navigate to itself.
- Existing per-page trigger colors remain unchanged.
- No page-specific copy of the destination list remains.
- Lint, component tests, and production build pass.
