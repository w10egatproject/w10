# Contractor ETAS Table Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add contractor ETAS scan tables to the contractor OT page between the grouped OT tables and the final contractor OT total table.

**Architecture:** Reuse the existing Google Sheets service account client to read the provided spreadsheet and expose parsed rows through `/api/ot-summary`. The contractor OT page already gates contractor-only content with `!isEmployeePage`, so ETAS sections will render only inside that branch.

**Tech Stack:** Next.js 16 App Router, TypeScript, Google Sheets API, React client component, Tailwind CSS utility classes.

---

### Task 1: Contract Test

**Files:**
- Create: `scratch/contractor-etas.test.js`
- Modify: `docs/superpowers/specs/2026-06-12-ot-page-split-design.md`

- [ ] **Step 1: Write the failing test**

```js
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const googleSheet = read('lib/googleSheet.ts');
const route = read('app/api/ot-summary/route.ts');
const page = read('app/ot-summary/page.tsx');

assert.match(googleSheet, /getContractorEtasSheetData/, 'Google Sheets helper must fetch contractor ETAS data');
assert.match(googleSheet, /1ucCTBZBLF8tkTWyuIE46_aRx0vUwen382wWokuR55UQ/, 'helper must use the provided spreadsheet id');
assert.match(route, /contractorEtas/, 'API must return contractorEtas rows');
assert.match(page, /renderContractorEtasTable/, 'contractor page must render ETAS tables');
assert.ok(page.indexOf('contractorEtasSections.map') < page.indexOf('ALL-CONTRACTORS'), 'ETAS sections must appear before the final contractor OT table');
assert.match(page, /ALL-CONTRACTOR-ETAS/, 'contractor page must render the all-contractors ETAS table');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node scratch\contractor-etas.test.js`
Expected: FAIL with missing `getContractorEtasSheetData`.

### Task 2: Data Pipeline

**Files:**
- Modify: `lib/googleSheet.ts`
- Modify: `app/api/ot-summary/route.ts`

- [ ] **Step 1: Add a Google Sheets helper**

Add `getContractorEtasSheetData()` that reads spreadsheet `1ucCTBZBLF8tkTWyuIE46_aRx0vUwen382wWokuR55UQ`, tab `ETAS_dataลจ`, range `A1:AJ100`.

- [ ] **Step 2: Parse and return ETAS rows**

Add a parser that reads sequence from column B, employee id from column C, name from column D, days from E:AI, and total from AJ. Group rows with the existing contractor sequence mapping.

### Task 3: UI Rendering

**Files:**
- Modify: `app/ot-summary/page.tsx`

- [ ] **Step 1: Add ETAS types and totals**

Define a contractor ETAS row type, totals reducer, and group sections from `data.contractorEtas`.

- [ ] **Step 2: Render grouped and all ETAS tables**

Render `ข้อมูลสแกนลายนิ้วมือลูกจ้าง` sections after contractor OT group sections and before the `ALL-CONTRACTORS` final OT table.

### Task 4: Verification

**Files:**
- Test: `scratch/contractor-etas.test.js`
- Test: `scratch/ot-route-split.test.js`

- [ ] **Step 1: Run focused tests**

Run: `node scratch\contractor-etas.test.js` and `node scratch\ot-route-split.test.js`
Expected: both exit 0.

- [ ] **Step 2: Run production build**

Run: `npm.cmd run build`
Expected: exit 0 and route list still includes `/ot-summary` and `/ot-employee`.
