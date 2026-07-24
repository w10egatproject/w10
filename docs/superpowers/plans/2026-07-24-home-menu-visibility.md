# Home Menu Visibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hide the redundant home destination only when the current route is `/`.

**Architecture:** Keep the canonical six-destination array unchanged inside
`NavigationMenu`. Derive a render-only list from `usePathname()` that excludes
`/` on the home route and preserves all existing behavior elsewhere.

**Tech Stack:** Next.js 16, React 19, TypeScript, Vitest, Testing Library

## Global Constraints

- On `/`, render exactly five non-home destinations.
- On every non-home route, render all six destinations.
- Preserve current-route, hover, click/touch, keyboard, focus, Escape, and
  page-theme behavior.
- Add no dependencies and do not duplicate the destination list.

---

### Task 1: Filter the Home Destination on the Home Route

**Files:**
- Modify: `components/navigation/NavigationMenu.test.tsx`
- Modify: `components/navigation/NavigationMenu.tsx`

**Interfaces:**
- Consumes: `usePathname(): string` and the existing `destinations` constant.
- Produces: a render-only `visibleDestinations` array with the same
  `readonly NavigationDestination[]` item shape.

- [ ] **Step 1: Write the failing regression test**

Change the existing parameterized route test to cover only non-home routes:

```tsx
it.each(destinations.slice(1))(
  'renders all six destinations and disables the current route $href',
  ({ href, label }) => {
    // Keep the existing assertions unchanged.
  },
);
```

Add a dedicated home-route assertion:

```tsx
it('omits the redundant home destination on the home route', () => {
  const navigation = renderOpenMenu('/');

  expect(
    within(navigation).getAllByTestId('navigation-destination'),
  ).toHaveLength(5);
  expect(within(navigation).queryByText('หน้าหลัก')).toBeNull();
  expect(within(navigation).getAllByRole('link')).toHaveLength(5);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```powershell
npm run test:unit -- components/navigation/NavigationMenu.test.tsx
```

Expected: one failure because the home route still renders six destinations
including “หน้าหลัก”.

- [ ] **Step 3: Add the minimal render filter**

In `NavigationMenu`, derive the visible list after reading `pathname`:

```tsx
const visibleDestinations =
  pathname === '/'
    ? destinations.filter((destination) => destination.href !== '/')
    : destinations;
```

Render `visibleDestinations.map(...)` instead of `destinations.map(...)`.

- [ ] **Step 4: Verify GREEN and the release gates**

Run:

```powershell
npm run test:unit
node scratch/ot-route-split.test.js
node scratch/purchasing-all-page.test.js
npx eslint components/navigation/NavigationMenu.tsx components/navigation/NavigationMenu.test.tsx components/navigation/NavigationMenu.integration.test.ts vitest.config.mts
npm run build
```

Expected: 21 unit/integration tests pass, both route scripts exit successfully,
scoped ESLint exits with code 0, and the production build exits with code 0.

- [ ] **Step 5: Commit and deploy**

```powershell
git add components/navigation/NavigationMenu.tsx components/navigation/NavigationMenu.test.tsx
git commit -m "fix: hide home destination on home route"
git push origin main
```

Expected: Vercel creates a production deployment for the new `main` commit.
Wait for `READY`, then verify `/` exposes five destinations and each non-home
route exposes six.
