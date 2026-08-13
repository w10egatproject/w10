# Shop Order Picture-OAuth Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make legacy public Shop Order images render after the `Picture` to `Picture-OAuth` transition and name every newly uploaded attachment `shoporder-YYYYMMDD-orderID.ext`.

**Architecture:** Keep the OAuth thumbnail proxy strict: it continues to validate files created/managed by the OAuth application. When that proxy cannot read a legacy public file, the client uses a canonical Google `export=view` URL so the browser receives inline image bytes instead of a download response. New upload sessions generate a deterministic date/order-based Drive name while retaining the existing MIME, signature, parent-folder, lifecycle, and Sheet URL contracts.

**Tech Stack:** Next.js 16 App Router, TypeScript, React client components, Google Drive OAuth, Google Sheets, Vitest, ESLint.

## Global Constraints

- Keep `drive.file` OAuth scope; do not broaden access to the whole Drive.
- Keep the configured `SHOP_ORDER_DRIVE_FOLDER_ID` as the only parent accepted for OAuth-managed uploads.
- Use the current server upload-session date in UTC as `YYYYMMDD`.
- Preserve canonical Sheet file URLs (`https://drive.google.com/file/d/<id>/view`) and the existing lifecycle metadata validation.
- Do not expose refresh tokens, access tokens, raw upload URLs, or full file IDs in logs or documentation.
- Do not modify the user's pre-existing `app/page.tsx` change.

---

### Task 1: Lock the regression contracts with failing tests

**Files:**
- Modify: `lib/shop-order/attachment-lifecycle.test.ts`
- Modify: `lib/shop-order/repository.test.ts`
- Modify: `components/shop-order/dialogs.test.tsx`

**Interfaces:**
- The filename contract is `buildAttachmentStorageName(request, now) -> string` and must produce `shoporder-20260727-123456.png` for the fixed fixture date/order.
- The preview URL contract is `driveFilePreviewUrlFromCanonicalUrl(url) -> string | null` and must produce `https://drive.google.com/uc?export=view&id=<id>`.

- [ ] **Step 1: Change the lifecycle test expectation to the requested filename.**

  Use the fixed literal `shoporder-20260727-123456.png` and remove the random-ID argument from the test call.

- [ ] **Step 2: Change the JPEG normalization expectation.**

  Assert `shoporder-20260727-123456.jpg` from an uppercase `.JPEG` input.

- [ ] **Step 3: Change the public fallback test to require inline preview mode.**

  Rename the imported helper to `driveFilePreviewUrlFromCanonicalUrl` and assert `export=view` for canonical URLs while still returning `null` for non-canonical URLs.

- [ ] **Step 4: Update repository upload fixtures to the new deterministic name.**

  Set the stored metadata fixture and expected resumable payload to `shoporder-20260727-123456.png`, and remove the unused random ID dependency fixture.

- [ ] **Step 5: Run the focused tests and verify they fail for the missing production behavior.**

  Run:

  ```powershell
  npm run test:unit -- lib/shop-order/attachment-lifecycle.test.ts lib/shop-order/repository.test.ts components/shop-order/dialogs.test.tsx
  ```

  Expected: failures are limited to the old filename and old `export=download` behavior; no syntax or setup failure is acceptable.

### Task 2: Implement the minimal production fix

**Files:**
- Modify: `lib/shop-order/attachment-lifecycle.ts`
- Modify: `lib/shop-order/repository.ts`
- Modify: `components/shop-order/OrderDetailDialog.tsx`

**Interfaces:**
- `buildAttachmentStorageName` validates order number and MIME/extension, then returns `shoporder-${UTC_YYYYMMDD}-${orderNumber}.${normalizedExtension}`.
- `driveFilePreviewUrlFromCanonicalUrl` validates the existing canonical Drive URL and returns a public inline preview URL.

- [ ] **Step 1: Remove the random UUID dependency from repository upload naming.**

  Delete the `node:crypto` import, `randomId` dependency field/default, and the short-ID argument at the call site. Do not change upload-session metadata validation or parent assignment.

- [ ] **Step 2: Generate the deterministic filename.**

  In `buildAttachmentStorageName`, derive `YYYYMMDD` from `now.toISOString()`, retain the MIME-to-extension mapping, and return the lowercase `shoporder` name with the six-digit order number.

- [ ] **Step 3: Generate inline public fallback URLs.**

  Rename the helper to `driveFilePreviewUrlFromCanonicalUrl` and use `export=view`. Keep the strict canonical URL parser unchanged.

- [ ] **Step 4: Make the detail dialog use the renamed preview helper.**

  Keep the authenticated no-store proxy as the first source and the public inline URL as the fallback. Do not loosen server-side ownership/lifecycle checks.

- [ ] **Step 5: Run the focused tests and verify they pass.**

  Run the same focused command from Task 1. Expected: all focused tests pass with zero failures.

### Task 3: Document the migration boundary

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Document the observed root cause.**

  Explain that Sheet column J/K stores a canonical file URL, not a folder path; moving a legacy file does not make it OAuth-app-managed under `drive.file`, so the strict thumbnail proxy can return 404 even when the public file URL still works.

- [ ] **Step 2: Document the safe recovery path.**

  State that existing public legacy images can render through the inline fallback, while files that are not public must be re-uploaded through `/shop-order` or copied using an OAuth flow that has access; do not recommend changing the scope to full `drive`.

- [ ] **Step 3: Update the new filename example.**

  Replace the old random timestamp example with `shoporder-YYYYMMDD-orderID.ext`.

### Task 4: Verify the complete change

**Files:**
- Review only: `git diff`, changed tests, and changed source files.

- [ ] **Step 1: Run unit tests.**

  ```powershell
  npm run test:unit
  ```

- [ ] **Step 2: Run OAuth setup tests.**

  ```powershell
  npm run test:oauth-setup
  ```

- [ ] **Step 3: Run TypeScript and targeted lint.**

  ```powershell
  npx tsc --noEmit
  npx eslint lib/shop-order/attachment-lifecycle.ts lib/shop-order/attachment-lifecycle.test.ts lib/shop-order/repository.ts lib/shop-order/repository.test.ts components/shop-order/OrderDetailDialog.tsx components/shop-order/dialogs.test.tsx
  ```

- [ ] **Step 4: Run the production build.**

  ```powershell
  npm run build
  ```

- [ ] **Step 5: Review the final diff and report any unrelated pre-existing change separately.**

  Confirm `app/page.tsx` remains untouched and no secrets or remote file mutations were added.
