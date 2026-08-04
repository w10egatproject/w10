# OT Employee Contractor-Style UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/ot-employee` render with the same legacy shell, header, source-sheet card, menu, spacing, and responsive card layout as `/ot-summary` while preserving employee data and the yellow/gold employee theme.

**Architecture:** Keep `OtSummaryContent` as the shared interactive Client Component and select its existing legacy branch from the employee route. Remove `/ot-employee` from the Console migration allowlist so `ShellMigrationGate` returns the route unchanged; do not alter the API, data parsing, shared table renderers, or unused Console components.

**Tech Stack:** Next.js 16.2 App Router, React 19.2, TypeScript 5, Tailwind CSS 4, Vitest 4, Testing Library

## Global Constraints

- `/ot-employee` must match the reference `/ot-summary` shell and layout.
- Preserve `workerType="employee"`, employee-only data, employee Google Sheet links, `B2:AL20`, and the yellow/gold employee theme.
- Preserve `fetch('/api/ot-summary?workerType=employee', { cache: 'no-store' })` behavior through the existing shared component.
- Do not change API routes, Google Sheet IDs, data parsing, contractor behavior, or unrelated Console components.
- Write behavior-first regression tests and observe them fail before changing production code.
- Do not stage or modify the unrelated untracked file `docs/superpowers/plans/2026-08-04-shop-order-source-sheet-button.md`.

---

## File Map

- `app/ot-employee/page.tsx`: route wrapper that selects employee data and legacy chrome.
- `components/layout/shellRoutes.ts`: migration allowlist; no route should currently opt into `AppShell` after this rollback.
- `components/layout/shellRoutes.test.ts`: route-level contract for legacy versus Console shell selection.
- `components/layout/AppShell.test.tsx`: unit behavior of `ShellMigrationGate` after `/ot-employee` leaves the pilot shell.
- `components/layout/AppShell.integration.test.tsx`: integration coverage proving employee content bypasses `AppShell` and retains horizontal table containment.
- `components/layout/OtEmployeeRoute.test.tsx`: employee-route UI, source links, loading, error, refresh, and employee-data regression coverage.
- `components/layout/OtSummaryRoute.test.tsx`: unchanged contractor regression coverage, run to prove the reference page is not altered.

### Task 1: Roll Back the Employee Console Pilot to the Shared Legacy UI

**Files:**

- Modify: `components/layout/shellRoutes.test.ts:22-34`
- Modify: `components/layout/AppShell.test.tsx:26-53`
- Modify: `components/layout/AppShell.integration.test.tsx:1-121`
- Modify: `components/layout/OtEmployeeRoute.test.tsx:1-198`
- Modify: `components/layout/shellRoutes.ts:20`
- Modify: `app/ot-employee/page.tsx:4`

**Interfaces:**

- Consumes: `OtSummaryContent({ workerType: 'employee', chrome: 'legacy' })`, `ShellMigrationGate`, `isConsoleRoute(pathname)`.
- Produces: `/ot-employee` renders employee content through legacy chrome and `isConsoleRoute('/ot-employee')` returns `false`.

- [ ] **Step 1: Replace the shell allowlist expectation with the desired legacy-route behavior**

In `components/layout/shellRoutes.test.ts`, replace the pilot test with a behavior test whose production mutation is “adding `/ot-employee` back to `consoleRoutes`”:

```ts
it('keeps both OT routes on the legacy shell', () => {
  expect(consoleRoutes).toEqual([]);
  expect(isConsoleRoute('/ot-employee')).toBe(false);
  expect(isConsoleRoute('/ot-summary')).toBe(false);
  expect(isConsoleRoute('/')).toBe(false);
});
```

Keep the public-route test unchanged. Keep the exact-path test because it independently protects query-string and trailing-slash handling.

- [ ] **Step 2: Change the migration-gate test to exercise observable legacy behavior**

In `components/layout/AppShell.test.tsx`, replace the pilot-wrapper test with:

```tsx
it('returns employee route children without an AppShell', () => {
  usePathnameMock.mockReturnValue('/ot-employee');

  render(
    <ShellMigrationGate>
      <p data-testid="employee-content">Employee content</p>
    </ShellMigrationGate>,
  );

  expect(screen.getByTestId('employee-content')).toBeDefined();
  expect(screen.queryByTestId('app-shell')).toBeNull();
  expect(screen.queryByRole('main')).toBeNull();
});
```

Do not change the direct `AppShell` test; it still protects the component independently even when the allowlist is empty.

- [ ] **Step 3: Rewrite employee route expectations around the reference legacy UI**

In `components/layout/OtEmployeeRoute.test.tsx`:

- Remove `readFileSync` and `join`; source-text assertions are not behavior tests.
- Rename the suite to `'/ot-employee legacy route'`.
- Remove the `selects console chrome in the route wrapper` test.
- Replace the Console header test with the following observable contract:

```tsx
it('shows the employee legacy header and page menu', async () => {
  mockEmployeeFetch();
  render(<OtEmployeePage />);

  await waitFor(() => {
    expect(screen.getAllByText('Employee One').length).toBeGreaterThan(0);
  });

  expect(
    screen.getByRole('heading', { level: 1, name: 'สรุป OT พนักงาน' }),
  ).toBeDefined();
  expect(screen.getByRole('button', { name: 'เมนูหน้า' })).toBeDefined();
  expect(screen.queryByRole('complementary', { name: 'เมนู EGAT' })).toBeNull();
});
```

- Rename the source-link test to `shows the three employee Google Sheet links below the legacy header`; assert exactly three links matching `/เปิด Google Sheet/` and retain the literal first employee Sheet URL assertion.
- Keep the employee-row/contractor-exclusion test.
- Keep the refresh test and its two-call/disabled-state assertions.
- Update loading and error tests to assert the legacy `เมนูหน้า` button remains visible and `app-shell` is absent.
- For the error test, assert the literal employee error text is visible; do not require the Console-only `role="alert"` or nested `h2`.

- [ ] **Step 4: Update the route-plus-gate integration test**

In `components/layout/AppShell.integration.test.tsx`:

- Remove unused `fireEvent` and `within` imports.
- Rename the suite to `'employee legacy route integration'`.
- Replace the Console-only test with:

```tsx
it('renders employee content without the Console AppShell', async () => {
  render(
    <ShellMigrationGate>
      <OtEmployeePage />
    </ShellMigrationGate>,
  );

  await waitFor(() => {
    expect(
      screen.getAllByText(/Employee OT integration fixture/).length,
    ).toBeGreaterThan(0);
  });

  expect(screen.queryByTestId('app-shell')).toBeNull();
  expect(screen.queryByRole('complementary')).toBeNull();
  expect(screen.getByRole('button', { name: 'เมนูหน้า' })).toBeDefined();
  expect(screen.getByRole('heading', { level: 1, name: 'สรุป OT พนักงาน' })).toBeDefined();
});
```

- Remove the mobile Console drawer test because `/ot-employee` no longer owns that behavior; `MobileNavigationDrawer.test.tsx` already covers the drawer component.
- Keep the wide-table test and add `expect(screen.queryByTestId('app-shell')).toBeNull()` before checking every table's `overflow-x-auto` parent.

- [ ] **Step 5: Run the targeted tests and verify RED**

Run:

```powershell
npm run test:unit -- components/layout/shellRoutes.test.ts components/layout/AppShell.test.tsx components/layout/AppShell.integration.test.tsx components/layout/OtEmployeeRoute.test.tsx components/layout/OtSummaryRoute.test.tsx
```

Expected: FAIL because `consoleRoutes` still contains `/ot-employee`, `ShellMigrationGate` still renders `app-shell`, and `OtEmployeePage` still selects Console chrome. Confirm failures are assertion failures for those three behaviors, not syntax, encoding, fixture, or selector errors.

- [ ] **Step 6: Apply the minimal production changes**

In `components/layout/shellRoutes.ts`, change only the migration allowlist:

```ts
export const consoleRoutes: readonly ConsoleRoute[] = [];
```

In `app/ot-employee/page.tsx`, select the existing shared legacy branch explicitly:

```tsx
import { OtSummaryContent } from '../ot-summary/page';

export default function OtEmployeePage() {
  return <OtSummaryContent workerType="employee" chrome="legacy" />;
}
```

Do not alter `publicRoutes`, `OtSummaryContent`, API code, tables, colors, links, or Console components.

- [ ] **Step 7: Run the targeted tests and verify GREEN**

Run the same targeted command from Step 5.

Expected: all five test files pass with zero failures and no unhandled errors or warnings.

- [ ] **Step 8: Run mutation checks**

Temporarily verify each realistic regression is caught, restoring the intended code after each check:

1. Put `/ot-employee` back into `consoleRoutes`; the shell route and migration-gate tests must fail.
2. Change the employee route back to `chrome="console"`; the employee legacy header/menu test must fail.
3. Restore both intended changes and rerun the targeted command; it must pass.

- [ ] **Step 9: Run repository verification**

Run each command independently:

```powershell
npm run test:unit
npm run lint
npm run build
```

Expected: exit code `0` for each command. If lint has a pre-existing baseline failure, record the exact diagnostics and verify no diagnostic points to a changed file; do not claim lint passes.

- [ ] **Step 10: Perform browser verification against the reference image**

Start the existing Next.js development server with `npm run dev`, then inspect `/ot-employee` at desktop and mobile widths.

Desktop acceptance checks:

- Gray page background and inset content spacing match `/ot-summary`.
- Horizontal header card contains the employee icon, `สรุป OT พนักงาน`, `EGAT EMPLOYEE OT SUMMARY`, `พบ B2:AL20`, refresh, and `เมนูหน้า`.
- Employee Google Sheet source card appears directly below the header with three employee links.
- W11-W14 and all-employee cards retain the yellow/gold employee theme and the reference 20/80 summary/table layout.
- Tables scroll inside their own containers and do not widen the page.
- No Console sidebar or mobile top bar appears.

Mobile acceptance checks:

- Header actions wrap without overlap.
- Source links stack or wrap without horizontal page overflow.
- Summary and table areas collapse to one column.
- `เมนูหน้า` remains operable and tables retain horizontal scrolling.

Capture screenshots or record exact observed failures. Fix any mismatch through a new RED-GREEN cycle before completion.

- [ ] **Step 11: Review the final diff and commit only task files**

Run:

```powershell
git diff --check
git status --short
git diff -- app/ot-employee/page.tsx components/layout/shellRoutes.ts components/layout/shellRoutes.test.ts components/layout/AppShell.test.tsx components/layout/AppShell.integration.test.tsx components/layout/OtEmployeeRoute.test.tsx
```

Confirm the diff contains no API/data changes and does not include `docs/superpowers/plans/2026-08-04-shop-order-source-sheet-button.md`. Then stage only the six listed implementation/test files and commit:

```powershell
git add -- app/ot-employee/page.tsx components/layout/shellRoutes.ts components/layout/shellRoutes.test.ts components/layout/AppShell.test.tsx components/layout/AppShell.integration.test.tsx components/layout/OtEmployeeRoute.test.tsx
git commit -m "fix(ui): align employee OT with contractor layout"
```

## Plan Self-Review

- Spec coverage: shell, header, source links, menu, employee theme/data, responsive layout, loading, errors, testing, and browser comparison are mapped to explicit steps.
- Placeholder scan: no incomplete instructions or deferred implementation items.
- Type consistency: `workerType="employee"`, `chrome="legacy"`, `ConsoleRoute`, `consoleRoutes`, and `isConsoleRoute` match current production interfaces.
- Scope: one independently testable rollback with no API, parser, or contractor UI changes.
