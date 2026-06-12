# Employee ETAS Table Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the employee ETAS scan table from `ETAS_data!AL1:BU19` to the employee OT page in the same placement pattern as contractor ETAS.

**Architecture:** Extend the existing OT route handler payload with `employeeEtas`, parsed from the employee spreadsheet and grouped by the existing employee W11-W14 sequence ranges. Reuse the existing ETAS table UI by making it worker-type aware, with an optional position column for employees.

**Tech Stack:** Next.js App Router route handler, React client page, Google Sheets API, scratch Node regression tests.

---

### Task 1: Add Employee ETAS Data Source

**Files:**
- Modify: `lib/googleSheet.ts`
- Modify: `app/api/ot-summary/route.ts`
- Test: `scratch/employee-etas.test.js`

- [ ] **Step 1: Write the failing test**

Create `scratch/employee-etas.test.js` asserting the helper, API payload, parser range, and page placement exist.

- [ ] **Step 2: Run test to verify it fails**

Run: `node scratch\employee-etas.test.js`
Expected: FAIL because employee ETAS support is not implemented.

- [ ] **Step 3: Implement the data source and parser**

Add `getEmployeeEtasSheetData()` for spreadsheet `1__JtmwYd3xmL6XL-VkEU1E53NyaySwcT7dQY3OQ4aCA`, range `'ETAS_data'!AL1:BU19`, then parse rows as `sequence`, `employeeId`, `name`, `position`, `days`, `total`, and `group`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node scratch\employee-etas.test.js`
Expected: PASS.

### Task 2: Render Employee ETAS Tables

**Files:**
- Modify: `app/ot-summary/page.tsx`
- Test: `scratch/employee-etas.test.js`

- [ ] **Step 1: Write UI assertions**

Assert employee ETAS group tables render after `renderEmployeeTable(rows, group)` and before `renderOtErrorTable(errors, 'employee')`; assert the all-employee ETAS table renders after `ALL-EMPLOYEES` and before the all-employee error table.

- [ ] **Step 2: Implement table rendering**

Generalize the ETAS row/table types so employee rows can show position while still hiding employee IDs, matching the earlier contractor requirement.

- [ ] **Step 3: Verify**

Run:
`node scratch\employee-etas.test.js`
`node scratch\contractor-etas.test.js`
`node scratch\ot-route-split.test.js`
`npm.cmd run build`

Expected: all commands exit 0.
