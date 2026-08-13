# Shop Order Source Sheet Button Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a secure, accessible `เปิด Google Sheet` action beside the Shop Order toolbar's `เพิ่ม` button.

**Architecture:** Render one native external anchor in the existing `ShopOrderToolbar`; no routing, state, API, or data-flow changes are needed. Cover the user-visible contract through the existing `ShopOrderDashboard` integration test so the final URL and new-tab security attributes cannot regress.

**Tech Stack:** Next.js 16.2 App Router, React 19.2, TypeScript, Tailwind CSS 4, Lucide React, Vitest, Testing Library

## Global Constraints

- Link exactly to `https://docs.google.com/spreadsheets/d/1ZtFnQhPortoyUgKzQuruq5kU7q5V9l1GYbsSgL-9oco/edit?gid=0#gid=0`.
- Display the Thai accessible name `เปิด Google Sheet`.
- Place the action beside the existing `เพิ่ม` button in the Shop Order filter toolbar.
- Open the destination in a new tab with `target="_blank"` and `rel="noopener noreferrer"`.
- Add no client state, routing logic, API calls, dependencies, or changes to existing Shop Order behavior.
- Preserve keyboard focus visibility and responsive toolbar wrapping.

## File Structure

- Modify `components/shop-order/ShopOrderToolbar.tsx`: own and render the fixed external source-sheet action with the existing toolbar controls.
- Modify `components/shop-order/ShopOrderDashboard.test.tsx`: verify the link through the rendered Shop Order page contract.

---

### Task 1: Add the Shop Order source-sheet action

**Files:**
- Modify: `components/shop-order/ShopOrderToolbar.tsx:1,68-102`
- Test: `components/shop-order/ShopOrderDashboard.test.tsx:78-87`

**Interfaces:**
- Consumes: the existing `ShopOrderToolbar` action container and `lucide-react` icon exports.
- Produces: a rendered anchor with accessible name `เปิด Google Sheet`, the exact approved URL, `target="_blank"`, and `rel="noopener noreferrer"`.

- [ ] **Step 1: Write the failing integration test**

Add this test after `uses the approved responsive layout and omits the removed trend` in `components/shop-order/ShopOrderDashboard.test.tsx`:

```tsx
it('links to the Shop Order source sheet in an isolated new tab', async () => {
  render(<ShopOrderDashboard />);
  await screen.findByText('งานเสร็จ');

  const sourceSheetLink = screen.getByRole('link', {
    name: 'เปิด Google Sheet',
  });

  expect(sourceSheetLink.getAttribute('href')).toBe(
    'https://docs.google.com/spreadsheets/d/1ZtFnQhPortoyUgKzQuruq5kU7q5V9l1GYbsSgL-9oco/edit?gid=0#gid=0',
  );
  expect(sourceSheetLink.getAttribute('target')).toBe('_blank');
  expect(sourceSheetLink.getAttribute('rel')).toBe('noopener noreferrer');
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```powershell
npm run test:unit -- components/shop-order/ShopOrderDashboard.test.tsx -t "links to the Shop Order source sheet"
```

Expected: FAIL because Testing Library cannot find a link named `เปิด Google Sheet`.

- [ ] **Step 3: Implement the minimal external link**

In `components/shop-order/ShopOrderToolbar.tsx`, add `FileSpreadsheet` to the existing Lucide import:

```tsx
import {
  FileSpreadsheet,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
} from 'lucide-react';
```

Allow the action group to wrap on narrow screens:

```tsx
<div className="flex flex-wrap items-end gap-2">
```

Insert this anchor immediately before `{onAdd && (` so it remains beside the `เพิ่ม` action:

```tsx
<a
  href="https://docs.google.com/spreadsheets/d/1ZtFnQhPortoyUgKzQuruq5kU7q5V9l1GYbsSgL-9oco/edit?gid=0#gid=0"
  target="_blank"
  rel="noopener noreferrer"
  className="flex h-10 items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 text-sm font-bold text-emerald-800 hover:bg-emerald-100 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
>
  <FileSpreadsheet aria-hidden className="h-4 w-4" />
  เปิด Google Sheet
</a>
```

Use a native anchor rather than `next/link`: the installed Next.js 16 documentation describes `Link` as the primary mechanism for internal client-side route navigation and prefetching, neither of which applies to this external Google Sheets destination.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run:

```powershell
npm run test:unit -- components/shop-order/ShopOrderDashboard.test.tsx -t "links to the Shop Order source sheet"
```

Expected: PASS with one matched test and no warnings or unhandled errors.

- [ ] **Step 5: Run the complete unit suite**

Run:

```powershell
npm run test:unit
```

Expected: every Vitest test passes with zero failures.

- [ ] **Step 6: Run lint**

Run:

```powershell
npm run lint
```

Expected: exit code 0 with zero ESLint errors.

- [ ] **Step 7: Run the production build**

Run:

```powershell
npm run build
```

Expected: exit code 0; Next.js compiles and generates the `/shop-order` route successfully.

- [ ] **Step 8: Review the final diff and repository state**

Run:

```powershell
git diff --check
git diff -- components/shop-order/ShopOrderToolbar.tsx components/shop-order/ShopOrderDashboard.test.tsx
git status --short
```

Expected: no whitespace errors; only the approved toolbar, test, and this plan are changed; no generated build artifacts are tracked.

- [ ] **Step 9: Commit the tested feature**

Run:

```powershell
git add -- components/shop-order/ShopOrderToolbar.tsx components/shop-order/ShopOrderDashboard.test.tsx docs/superpowers/plans/2026-08-04-shop-order-source-sheet-button.md
git commit -m "feat: link Shop Order to source sheet"
```

Expected: one commit containing only the approved source-sheet action, its integration test, and this implementation plan.
