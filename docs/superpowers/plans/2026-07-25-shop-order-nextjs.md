# Shop Order Next.js Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `/shop-order` with full Google Sheets CRUD, direct 10 MB resumable uploads to the existing Google Drive folder, and the approved responsive table-plus-summary dashboard.

**Architecture:** Pure domain modules normalize and summarize `Order1`; a server-only repository owns Sheets, Drive metadata, session initiation, and file finalization. The browser uploads file bytes directly to a short-lived Google Drive resumable session, then sends only JSON and the uploaded file ID through Vercel Functions. A Client Component orchestrates filters, pagination, dialogs, upload progress, and post-mutation refresh.

**Tech Stack:** Next.js 16.2.6 App Router, React 19.2.4, TypeScript 5, Tailwind CSS 4, `googleapis` 171, Recharts 3.8, Lucide React, Vitest 4, React Testing Library.

## Global Constraints

- Follow `docs/superpowers/specs/2026-07-24-shop-order-nextjs-design.md`.
- Preserve `Order1` columns A–K, `DepartmentList`, `ReceiverList`, and server-forced `หสบ-ช.`.
- Column I (`วันที่ออก`) controls status: empty is `รอดำเนินการ`; populated is `เสร็จสิ้น`.
- Keep the 10 MB limit; attachment bytes must never pass through a Vercel Function.
- Treat each resumable session URI as a bearer secret: return it only to the requesting browser and never log or persist it.
- Validate extension, MIME, size, parent folder, pending marker, and leading bytes before making a Drive file public or writing its URL to Sheets.
- Keep old/replaced/deleted Drive files.
- Write all user strings with `valueInputOption: 'RAW'`; never execute spreadsheet formulas.
- Google clients and credentials remain server-only and initialize lazily.
- The approved public API has no authentication. Validate same-origin browser requests when `Origin` is present without presenting that check as authorization.
- Do not add the removed 30-day trend chart, auto-polling, a UI framework, or unrelated refactors.
- Use the repository's Prompt font and shared W10 navigation.
- Apply TDD and commit after every task.

## File Map

**Create**

- `lib/shop-order/types.ts` — domain/API contracts.
- `lib/shop-order/domain.ts` and `.test.ts` — row/date/filter/status/summary logic.
- `lib/shop-order/file-rules.ts` and `.test.ts` — shared metadata and signature rules.
- `lib/shop-order/upload-client.ts` and `.test.ts` — browser resumable `PUT`.
- `lib/shop-order/repository.ts` and `.test.ts` — Sheets/Drive operations.
- `app/api/shop-order/route.ts` and `.test.ts` — data CRUD.
- `app/api/shop-order/upload-session/route.ts` and `.test.ts` — resumable session creation.
- `app/shop-order/page.tsx`, `app/shop-order/error.tsx`.
- `components/shop-order/ShopOrderDashboard.tsx` and `.test.tsx`.
- `components/shop-order/ShopOrderToolbar.tsx`.
- `components/shop-order/ShopOrderSummary.tsx`.
- `components/shop-order/ShopOrderTable.tsx`.
- `components/shop-order/OrderFormDialog.tsx`.
- `components/shop-order/OrderDetailDialog.tsx`.
- `components/shop-order/dialogs.test.tsx`.
- `.env.example`.

**Modify**

- `vitest.config.mts` — include `lib` and `app/api` tests.
- `.gitignore` — allow `.env.example`.
- `components/navigation/NavigationMenu.tsx` and tests — add Shop Order.
- `README.md` — configuration, public-access warning, and upload flow.

---

### Task 1: Domain contracts and deterministic calculations

**Files:**
- Create: `lib/shop-order/types.ts`
- Create: `lib/shop-order/domain.ts`
- Test: `lib/shop-order/domain.test.ts`
- Modify: `vitest.config.mts`

**Interfaces:**
- Produces `ShopOrder`, `ShopOrderInput`, `ShopOrderFilters`, `ShopOrderSummary`, `ShopOrderBootstrap`, `UploadMetadata`, `UploadSession`, and `ApiResult<T>`.
- Produces `parseSheetRow`, `sheetDateToIso`, `isoToSheetSerial`, `formatThaiDate`, `getOrderStatus`, `filterAndSortOrders`, `paginateOrders`, and `summarizeOrders`.

- [ ] **Step 1: Expand test discovery and write failing tests**

Set `vitest.config.mts`:

```ts
test: {
  environment: 'jsdom',
  include: [
    'components/**/*.test.{ts,tsx}',
    'lib/**/*.test.ts',
    'app/api/**/*.test.ts',
  ],
},
```

Create `lib/shop-order/domain.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  filterAndSortOrders, formatThaiDate, getOrderStatus,
  paginateOrders, parseSheetRow, sheetDateToIso, summarizeOrders,
} from './domain';
import type { ShopOrder } from './types';

const makeOrder = (patch: Partial<ShopOrder> = {}): ShopOrder => ({
  no: 1, from: 'หสบ-ช.', to: 'หบพ-ช.', number: '123456',
  dateIn: '2026-07-01', subject: 'ทดสอบ', receivingUnit: 'W11',
  receiverName: '', dateOut: null, note: '', fileUrl: '', ...patch,
});

describe('Shop Order domain', () => {
  it('maps A-K and derives status only from column I', () => {
    const order = parseSheetRow([
      7, 'หสบ-ช.', 'หบพ-ช.', '123456', '01/07/2569', 'เรื่อง',
      'W11', 'สมชาย', '03/07/2569', 'หมายเหตุ', 'https://drive.google.com/file/d/x/view',
    ]);
    expect(order).toMatchObject({ no: 7, dateIn: '2026-07-01', dateOut: '2026-07-03' });
    expect(getOrderStatus(makeOrder())).toBe('wait');
    expect(getOrderStatus(makeOrder({ dateOut: '2026-07-03' }))).toBe('done');
  });

  it('rejects impossible dates and displays Buddhist Era', () => {
    expect(sheetDateToIso('03/07/2569')).toBe('2026-07-03');
    expect(formatThaiDate('2026-07-03')).toBe('03/07/2569');
    expect(() => sheetDateToIso('31/02/2569')).toThrow('วันที่ไม่ถูกต้อง');
  });

  it('filters and summarizes the identical result', () => {
    const filtered = filterAndSortOrders([
      makeOrder({ no: 1, receivingUnit: 'W11' }),
      makeOrder({ no: 3, dateOut: '2026-07-03', receivingUnit: 'W12' }),
      makeOrder({ no: 2, subject: 'ไม่ตรง' }),
    ], { query: 'ทดสอบ', year: '2569', month: '7', status: 'all' });
    expect(filtered.map(({ no }) => no)).toEqual([3, 1]);
    expect(summarizeOrders(filtered)).toEqual({
      total: 2, wait: 1, done: 1,
      popularUnits: [{ name: 'W11', count: 1 }, { name: 'W12', count: 1 }],
    });
  });

  it('keeps a 10,000-row result but renders a bounded page and six ranks', () => {
    const orders = Array.from({ length: 10_000 }, (_, index) =>
      makeOrder({ no: index + 1, receivingUnit: `W${index % 20}` }));
    const filtered = filterAndSortOrders(
      orders, { query: '', year: 'all', month: 'all', status: 'all' });
    expect(filtered).toHaveLength(10_000);
    expect(paginateOrders(filtered, 1, 20).items).toHaveLength(20);
    expect(summarizeOrders(filtered).popularUnits).toHaveLength(6);
  });
});
```

- [ ] **Step 2: Verify red**

Run `npm run test:unit -- lib/shop-order/domain.test.ts`.

Expected: FAIL because `domain.ts` and `types.ts` do not exist.

- [ ] **Step 3: Implement types and pure functions**

Create `types.ts` with:

```ts
export type ShopOrderStatus = 'wait' | 'done';
export interface ShopOrder {
  no: number; from: string; to: string; number: string;
  dateIn: string | null; subject: string; receivingUnit: string;
  receiverName: string; dateOut: string | null; note: string; fileUrl: string;
}
export type ShopOrderInput = Omit<ShopOrder, 'no' | 'from' | 'fileUrl'>;
export interface ShopOrderFilters {
  query: string; year: 'all' | string; month: 'all' | string;
  status: 'all' | ShopOrderStatus;
}
export interface ShopOrderSummary {
  total: number; wait: number; done: number;
  popularUnits: Array<{ name: string; count: number }>;
}
export interface ShopOrderBootstrap {
  orders: ShopOrder[]; departments: string[]; receivers: string[]; generatedAt: string;
}
export interface UploadMetadata { name: string; mimeType: string; size: number }
export interface UploadSession { fileId: string; uploadUrl: string; expiresAt: string }
export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };
```

Implement `domain.ts` as pure linear loops. Use a strict UTC date round-trip,
Google serial epoch `25569`, `RAW`-compatible numeric dates, newest-first
numeric sequence sorting, one filtering pass, and deterministic popularity
tie-breaking with `localeCompare(name, 'th')`.

- [ ] **Step 4: Verify green and commit**

Run `npm run test:unit -- lib/shop-order/domain.test.ts`.

Expected: PASS.

```powershell
git add vitest.config.mts lib/shop-order
git commit -m "feat: add shop order domain model"
```

---

### Task 2: Shared file rules and direct resumable upload client

**Files:**
- Create: `lib/shop-order/file-rules.ts`
- Test: `lib/shop-order/file-rules.test.ts`
- Create: `lib/shop-order/upload-client.ts`
- Test: `lib/shop-order/upload-client.test.ts`

**Interfaces:**
- Produces `inspectLocalFile(file): Promise<UploadMetadata>`.
- Produces `assertUploadMetadata(metadata): UploadMetadata`.
- Produces `matchesAllowedSignature(metadata, bytes): boolean`.
- Produces `uploadToDriveSession(file, session, onProgress): Promise<void>`.

- [ ] **Step 1: Write failing allowlist and upload tests**

```ts
import { describe, expect, it, vi } from 'vitest';
import { inspectLocalFile, matchesAllowedSignature } from './file-rules';
import { uploadToDriveSession } from './upload-client';

describe('Shop Order attachments', () => {
  it('accepts a real PNG and rejects MIME/signature spoofing', async () => {
    const header = new Uint8Array([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]);
    await expect(inspectLocalFile(
      new File([header], 'photo.png', { type: 'image/png' }),
    )).resolves.toEqual({ name: 'photo.png', mimeType: 'image/png', size: 8 });
    await expect(inspectLocalFile(
      new File(['<script/>'], 'photo.png', { type: 'image/png' }),
    )).rejects.toThrow('ชนิดไฟล์ไม่ถูกต้อง');
    expect(matchesAllowedSignature(
      { name: 'photo.png', mimeType: 'image/png', size: 8 }, header,
    )).toBe(true);
  });

  it('rejects files above 10 MB and SVG/HTML', async () => {
    await expect(inspectLocalFile(new File(
      [new Uint8Array(10 * 1024 * 1024 + 1)], 'large.pdf',
      { type: 'application/pdf' },
    ))).rejects.toThrow('ไฟล์ต้องมีขนาดไม่เกิน 10 MB');
    await expect(inspectLocalFile(
      new File(['<svg/>'], 'image.svg', { type: 'image/svg+xml' }),
    )).rejects.toThrow('ไม่รองรับไฟล์ประเภทนี้');
  });

  it('PUTs bytes to the session URL without using the app API', async () => {
    const xhr = {
      open: vi.fn(), setRequestHeader: vi.fn(), send: vi.fn(),
      upload: {} as XMLHttpRequestUpload, status: 200, responseText: '{}',
    } as unknown as XMLHttpRequest;
    const promise = uploadToDriveSession(
      new File(['abc'], 'a.pdf', { type: 'application/pdf' }),
      { fileId: 'f1', uploadUrl: 'https://www.googleapis.com/upload/session', expiresAt: 'later' },
      vi.fn(),
      () => xhr,
    );
    (xhr.onload as EventListener)(new Event('load'));
    await promise;
    expect(xhr.open).toHaveBeenCalledWith('PUT', 'https://www.googleapis.com/upload/session');
    expect(xhr.send).toHaveBeenCalledWith(expect.any(File));
  });
});
```

- [ ] **Step 2: Verify red**

Run:

```powershell
npm run test:unit -- lib/shop-order/file-rules.test.ts lib/shop-order/upload-client.test.ts
```

Expected: FAIL because both modules are missing.

- [ ] **Step 3: Implement exact file rules**

`file-rules.ts` must allow JPEG, PNG, GIF, WebP, HEIC/HEIF, PDF, DOC/DOCX,
and XLS/XLSX; require the matching MIME; sanitize `[\\/:*?"<>|]`; reject zero
bytes and sizes above `10 * 1024 * 1024`; and inspect at least the first 16
bytes. Signatures are JPEG `FFD8FF`, PNG `89504E470D0A1A0A`, GIF `GIF87a` or
`GIF89a`, WebP `RIFF....WEBP`, PDF `%PDF-`, OLE
`D0CF11E0A1B11AE1`, ZIP `504B0304`, and HEIF-family `....ftyp`.

`upload-client.ts` must use `XMLHttpRequest` to expose progress:

```ts
export function uploadToDriveSession(
  file: File,
  session: UploadSession,
  onProgress: (percent: number) => void,
  makeRequest: () => XMLHttpRequest = () => new XMLHttpRequest(),
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = makeRequest();
    xhr.open('PUT', session.uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    // The browser sets Content-Length; JavaScript cannot set that forbidden header.
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => xhr.status >= 200 && xhr.status < 300
      ? resolve()
      : reject(new Error('อัปโหลดไฟล์ไม่สำเร็จ'));
    xhr.onerror = () => reject(new Error('การเชื่อมต่อขณะอัปโหลดขัดข้อง'));
    xhr.send(file);
  });
}
```

- [ ] **Step 4: Verify green and commit**

Run the two focused tests, then `npm run test:unit`.

Expected: PASS.

```powershell
git add lib/shop-order
git commit -m "feat: add direct drive upload client"
```

---

### Task 3: Google repository and resumable session security

**Files:**
- Create: `lib/shop-order/repository.ts`
- Test: `lib/shop-order/repository.test.ts`
- Create: `.env.example`
- Modify: `.gitignore`

**Interfaces:**
- Produces `ShopOrderRepository.load/listDepartments/create/update/remove`.
- Produces `ShopOrderRepository.createUploadSession`.
- `create` and `update` accept `uploadedFileId?: string`; the repository verifies and finalizes it.

- [ ] **Step 1: Write failing repository tests with injected clients and fetch**

Use Google client doubles to assert:

```ts
expect(generateIds).toHaveBeenCalledWith({ count: 1, space: 'drive', type: 'files' });
expect(sessionFetch).toHaveBeenCalledWith(
  expect.stringContaining('uploadType=resumable'),
  expect.objectContaining({
    method: 'POST',
    headers: expect.objectContaining({
      Authorization: expect.stringMatching(/^Bearer /),
      'X-Upload-Content-Length': '10485760',
    }),
  }),
);
expect(createdSession.uploadUrl).toMatch(/^https:\/\/www\.googleapis\.com\//);
```

For finalization, mock Drive metadata and a bounded `Range: bytes=0-31`
download. Assert rejection when the file:

- is not in `SHOP_ORDER_DRIVE_FOLDER_ID`;
- lacks `appProperties.shopOrderUpload === 'pending'`;
- exceeds 10 MB;
- differs from the declared MIME/name/size; or
- has a forbidden leading signature.

Assert a valid file receives `anyone`/`reader`, has its marker changed to
`finalized`, and only then is its `webViewLink` written into K.

- [ ] **Step 2: Verify red**

Run `npm run test:unit -- lib/shop-order/repository.test.ts`.

Expected: FAIL because `repository.ts` does not exist.

- [ ] **Step 3: Implement lazy clients and session initiation**

Implement a lazy JWT scoped to Sheets and Drive. Pre-generate a file ID, then
initiate:

```ts
const response = await authenticatedFetch(
  'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,webViewLink',
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Upload-Content-Type': metadata.mimeType,
      'X-Upload-Content-Length': String(metadata.size),
    },
    body: JSON.stringify({
      id: fileId,
      name: sanitizedName,
      parents: [folderId],
      appProperties: {
        shopOrderUpload: 'pending',
        expectedSize: String(metadata.size),
        expectedMime: metadata.mimeType,
      },
    }),
  },
);
const uploadUrl = response.headers.get('location');
```

Reject non-HTTPS or non-`www.googleapis.com` session URLs. Return an expiry no
longer than one hour even though Google may keep the underlying session longer.
Never log `uploadUrl`.

- [ ] **Step 4: Implement finalization and Sheets A–K mutations**

Before create/update:

1. Fetch `files.get(fields:
   'id,name,mimeType,size,parents,appProperties,webViewLink,trashed')`.
2. Verify parent, marker, declared metadata, and `trashed === false`.
3. Request only leading bytes with `Range: bytes=0-31` and validate signature.
4. Create permission `{ type: 'anyone', role: 'reader' }`.
5. Change marker to `finalized`.
6. Use the returned `webViewLink`.

Use `values.append` with a blank A and `valueInputOption: 'RAW'`; parse the
actual appended row from `updatedRange`, write A as `rowNumber - 1`, and format
E/I as `dd/MM/yyyy` using the numeric sheet ID resolved by tab title. Update
B–K only. Delete by clearing A–K so concurrent row numbers do not shift.
Re-read A immediately before update/delete.

- [ ] **Step 5: Add safe environment documentation**

Allow `.env.example` in `.gitignore` and create:

```dotenv
GOOGLE_CLIENT_EMAIL=
GOOGLE_PRIVATE_KEY=
SHOP_ORDER_SHEET_ID=1ZtFnQhPortoyUgKzQuruq5kU7q5V9l1GYbsSgL-9oco
SHOP_ORDER_SHEET_NAME=Order1
SHOP_ORDER_DRIVE_FOLDER_ID=19eLgj9vKhZfruNKI4CHPQTA4gOM8w3sR
```

- [ ] **Step 6: Verify and commit**

Run repository tests and `npm run test:unit`.

Expected: PASS, including Drive failure before Sheets mutation and Sheets
failure after file retention.

```powershell
git add .gitignore .env.example lib/shop-order
git commit -m "feat: connect shop orders to google workspace"
```

---

### Task 4: JSON CRUD and upload-session Route Handlers

**Files:**
- Create: `app/api/shop-order/route.ts`
- Test: `app/api/shop-order/route.test.ts`
- Create: `app/api/shop-order/upload-session/route.ts`
- Test: `app/api/shop-order/upload-session/route.test.ts`

**Interfaces:**
- `GET /api/shop-order` returns `ApiResult<ShopOrderBootstrap>`.
- `POST/PATCH /api/shop-order` consume JSON `{ order, uploadedFileId? }`.
- `DELETE /api/shop-order` consumes JSON `{ no }`.
- `POST /api/shop-order/upload-session` consumes `UploadMetadata` and returns `ApiResult<UploadSession>`.

- [ ] **Step 1: Write failing Route Handler tests**

Mock `getShopOrderRepository()` and test:

```ts
expect((await GET()).headers.get('Cache-Control')).toContain('no-store');
expect(await POST(jsonRequest({
  order: validOrderInput, uploadedFileId: 'generated-file-id',
}))).toMatchObject({ status: 201 });
expect(repository.create).toHaveBeenCalledWith(validOrderInput, 'generated-file-id');
expect(await PATCH(jsonRequest({
  no: 7, order: validOrderInput, uploadedFileId: 'replacement-id',
}, 'PATCH'))).toMatchObject({ status: 200 });
expect(await DELETE(jsonRequest({ no: 7 }, 'DELETE'))).toMatchObject({ status: 200 });
```

For upload sessions:

```ts
expect(await UPLOAD_POST(jsonRequest({
  name: 'photo.png', mimeType: 'image/png', size: 1024,
}))).toMatchObject({ status: 201 });
expect(repository.createUploadSession).toHaveBeenCalledWith({
  name: 'photo.png', mimeType: 'image/png', size: 1024,
});
```

Also test invalid JSON, invalid department, cross-origin `Origin`, oversized
metadata, repository errors, and that logs contain neither private values nor
the session URL.

- [ ] **Step 2: Verify red**

Run `npm run test:unit -- app/api/shop-order`.

Expected: FAIL because handlers do not exist.

- [ ] **Step 3: Implement consistent handlers**

All handlers use:

```ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const noStore = { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' };
type ErrorEnvelope = { ok: false; error: { code: string; message: string } };
```

Parse JSON with explicit type guards. Re-read `DepartmentList` for POST/PATCH.
Force `from` in the repository, not the request. Return safe Thai 400 errors
for validation and a generic Thai 500 with a correlation ID for Google errors.
Never include stack traces, credentials, file metadata, or upload URLs in logs.

- [ ] **Step 4: Verify and commit**

Run focused API tests and the full unit suite.

Expected: PASS.

```powershell
git add app/api/shop-order
git commit -m "feat: add shop order json api"
```

---

### Task 5: Navigation, responsive dashboard, filters, and summaries

**Files:**
- Modify: `components/navigation/NavigationMenu.tsx`
- Modify: `components/navigation/NavigationMenu.test.tsx`
- Modify: `components/navigation/NavigationMenu.integration.test.ts`
- Create: `app/shop-order/page.tsx`
- Create: `app/shop-order/error.tsx`
- Create: `components/shop-order/ShopOrderDashboard.tsx`
- Create: `components/shop-order/ShopOrderToolbar.tsx`
- Create: `components/shop-order/ShopOrderSummary.tsx`
- Create: `components/shop-order/ShopOrderTable.tsx`
- Test: `components/shop-order/ShopOrderDashboard.test.tsx`

**Interfaces:**
- Produces the `/shop-order` route and shared navigation destination.
- Consumes Task 1 calculations and `GET /api/shop-order`.

- [ ] **Step 1: Write failing navigation/dashboard tests**

Add `{ href: '/shop-order', label: 'Shop Order' }` to the navigation contract,
expect seven destinations and six non-current links, and add
`app/shop-order/page.tsx` to the integration source list.

Dashboard test:

```tsx
render(<ShopOrderDashboard />);
expect(await screen.findByText('งานเสร็จ')).toBeDefined();
expect(screen.getByTestId('kpi-total').textContent).toContain('2');
await user.selectOptions(screen.getByLabelText('สถานะ'), 'wait');
expect(screen.queryByText('งานเสร็จ')).toBeNull();
expect(screen.getByTestId('kpi-total').textContent).toContain('1');
expect(screen.queryByText('แนวโน้มออเดอร์ — 30 วันล่าสุด')).toBeNull();
expect(screen.getByTestId('shop-order-layout').className)
  .toContain('lg:grid-cols-[minmax(0,3fr)_minmax(280px,1fr)]');
```

- [ ] **Step 2: Verify red**

Run navigation and dashboard tests.

Expected: FAIL because the route, destination, and components are missing.

- [ ] **Step 3: Implement route and component contracts**

- Header: EGAT logo, `Shop Order`, manual refresh, shared `NavigationMenu`.
- Toolbar: labeled search/year/month/status, reset, refresh, add.
- Table: 12 approved columns, newest first, sticky header, 20-row pagination,
  horizontal overflow, row/detail activation, safe Drive links.
- Summary: total/pending/completed cards, Recharts doughnut with text legend,
  six receiving units. No trend component or data.
- Layout: summary uses `order-1 lg:order-2`; table uses
  `order-2 lg:order-1`; desktop grid is exactly
  `lg:grid-cols-[minmax(0,3fr)_minmax(280px,1fr)]`.
- State: one `ShopOrderFilters`, memoized filter/summary/page, reset page on
  filters, no polling, reload after mutation.
- States: skeleton, empty, recoverable error, last refresh.

`page.tsx` exports metadata and `ShopOrderDashboard`. `error.tsx` is a Client
Component with `reset()`.

- [ ] **Step 4: Verify and commit**

Run focused component tests and `npm run test:unit`.

Expected: PASS.

```powershell
git add app/shop-order components/navigation components/shop-order
git commit -m "feat: build shop order dashboard"
```

---

### Task 6: Accessible dialogs and resumable CRUD workflow

**Files:**
- Create: `components/shop-order/OrderFormDialog.tsx`
- Create: `components/shop-order/OrderDetailDialog.tsx`
- Test: `components/shop-order/dialogs.test.tsx`
- Modify: `components/shop-order/ShopOrderDashboard.tsx`
- Modify: `components/shop-order/ShopOrderDashboard.test.tsx`
- Modify: `lib/shop-order/upload-client.ts`
- Modify: `lib/shop-order/upload-client.test.ts`

**Interfaces:**
- Form yields `{ order: ShopOrderInput; file?: File }`.
- Dashboard calls `inspectLocalFile`, requests a session, calls `uploadToDriveSession`, then POST/PATCH JSON with `uploadedFileId`.

- [ ] **Step 1: Write failing dialog/workflow tests**

Test create fetch order:

```ts
expect(fetchMock.mock.calls.map(([url, init]) => [url, init?.method ?? 'GET']))
  .toEqual([
    ['/api/shop-order', 'GET'],
    ['/api/shop-order/upload-session', 'POST'],
    ['https://www.googleapis.com/upload/session', 'PUT'],
    ['/api/shop-order', 'POST'],
    ['/api/shop-order', 'GET'],
  ]);
```

Mock `uploadToDriveSession` so the dashboard test does not make a Google
request. Assert session metadata contains only name/MIME/size, final JSON
contains `uploadedFileId` but no file bytes, submit is disabled, progress is
announced, and a fresh GET follows success.

Dialog tests assert `role="dialog"`, `aria-modal`, initial focus, focus
containment, Escape, restoration to opener, Thai date previews,
`role="alertdialog"` before delete, and all A–K values in details.

- [ ] **Step 2: Verify red**

Run `npm run test:unit -- components/shop-order`.

Expected: FAIL because dialogs and mutations are absent.

- [ ] **Step 3: Implement the upload/mutation sequence**

```ts
let uploadedFileId: string | undefined;
if (file) {
  const metadata = await inspectLocalFile(file);
  const sessionResult = await requestJson<UploadSession>(
    '/api/shop-order/upload-session',
    { method: 'POST', body: JSON.stringify(metadata) },
  );
  await uploadToDriveSession(file, sessionResult, setUploadProgress);
  uploadedFileId = sessionResult.fileId;
}
await requestJson('/api/shop-order', {
  method: mode === 'create' ? 'POST' : 'PATCH',
  body: JSON.stringify({
    ...(mode === 'edit' ? { no: order.no } : {}),
    order: input,
    uploadedFileId,
  }),
});
await loadData(false);
```

On upload `4xx`, discard the session and request a new one on explicit retry.
On `5xx`/network interruption, query the session with an empty `PUT` and
``Content-Range: bytes */${file.size}``; continue from Google's `Range` offset
in 256 KiB multiples. Do not store the session in localStorage or logs.

The form provides camera and document inputs, enforces six digits, uses
datalists, displays Buddhist Era previews, and disables close/submit while
pending. The detail dialog confirms deletion and preserves Drive files.

- [ ] **Step 4: Verify and commit**

Run dialog/dashboard tests and the full unit suite.

Expected: PASS, including duplicate-click, retry, expired-session, focus, and
no-bytes-through-app-API assertions.

```powershell
git add components/shop-order lib/shop-order/upload-client.ts
git commit -m "feat: add resumable shop order crud"
```

---

### Task 7: Documentation, security regression, and final verification

**Files:**
- Modify: `README.md`
- Modify only failing feature files from Tasks 1–6.

**Interfaces:**
- Produces deployment documentation and final evidence.

- [ ] **Step 1: Document configuration and boundaries**

Add:

```md
## Shop Order

`/shop-order` uses `Order1`, `DepartmentList`, `ReceiverList`, and the configured
Drive folder. Set `GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY`,
`SHOP_ORDER_SHEET_ID`, `SHOP_ORDER_SHEET_NAME`, and
`SHOP_ORDER_DRIVE_FOLDER_ID`; share the Sheet and folder with the service
account as Editor.

Files up to 10 MB upload directly from the browser to a short-lived Google
Drive resumable session, bypassing Vercel's 4.5 MB Function body limit. The
session URI is secret and is not persisted. The page intentionally has no
login, so anyone who can reach it can mutate data. Deleted and replaced files
remain in Drive.
```

- [ ] **Step 2: Run automated verification**

```powershell
npm run test:unit
npm run lint
npm run build
```

Expected: all tests PASS, ESLint exits 0, and build includes `/shop-order`,
`/api/shop-order`, and `/api/shop-order/upload-session`.

- [ ] **Step 3: Run live configuration checks without printing secrets**

Confirm only boolean presence of the five env variables. Verify service-account
read access to all three tabs and folder metadata. Do not print keys, bearer
tokens, resumable URLs, authorization headers, or row contents.

- [ ] **Step 4: Browser-verify desktop and mobile**

Desktop: table left, summary right, correct filtered totals, no trend chart,
CRUD, upload progress, refresh, and Drive link. Mobile/tablet: summary above
table, reachable controls, horizontal table scroll, no dialog overflow,
camera/document inputs, keyboard focus, and Escape.

- [ ] **Step 5: Perform a reversible live smoke test**

Create a uniquely marked order with an attachment, verify A–K, edit subject and
`วันที่ออก`, verify completed status, then delete through the UI. Confirm the
sheet values are cleared and the Drive file remains. Never reuse a production
order for testing.

- [ ] **Step 6: Commit documentation and verified fixes**

```powershell
git add README.md app/api/shop-order app/shop-order components/shop-order lib/shop-order
git commit -m "test: verify shop order workflow"
```

Do not create the commit if documentation and verification produced no changes.
