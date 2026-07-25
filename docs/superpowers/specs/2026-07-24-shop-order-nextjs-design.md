# Shop Order Next.js Design

**Date:** 2026-07-24

**Status:** Approved for implementation planning

**Target application:** W10 Dashboard

## 1. Objective

Convert the supplied Shop Order Google Apps Script application into a native
Next.js route inside the existing W10 Dashboard. The new page must preserve the
current Google Sheet and Google Drive workflow while adopting the shared W10
navigation and the responsive dashboard layout approved during design review.

The feature must:

- add a `Shop Order` destination at `/shop-order`;
- read and write the existing `Order1` sheet directly from Next.js;
- support listing, searching, filtering, adding, viewing, editing, deleting,
  and attaching files;
- upload attachments to the existing Google Drive `Picture` folder;
- place the order table in the main left-hand area on desktop;
- place summary cards, the status chart, and popular receiving units in the
  right-hand rail;
- remove the “แนวโน้มออเดอร์ — 30 วันล่าสุด” chart completely; and
- remain usable on tablet and mobile layouts.

## 2. Confirmed Product Decisions

- Next.js owns the backend integration. The page will not call
  `google.script.run` and will not depend on the existing Apps Script web app.
- New orders submitted from the Next.js page are written to the same Google
  Sheet and the same A–K data structure used by the existing system.
- The page supports the complete existing workflow: read, search, filter, add,
  view, edit, delete, and attach files.
- Anyone who can reach the deployed URL can perform all CRUD operations. There
  is no login, password, or role check.
- Status is derived from column I: an empty date means `รอดำเนินการ`; a
  populated date means `เสร็จสิ้น`.
- Existing Drive files are retained when an order is deleted or when a new
  attachment replaces the link stored on an order.
- Attachments use a Google Drive resumable upload session. File bytes travel
  directly from the browser to Google Drive and never pass through a Vercel
  Function, preserving the 10 MB limit despite Vercel's 4.5 MB Function
  payload limit.
- Dashboard summaries follow the active search and filters rather than always
  representing the unfiltered dataset.
- The approved layout is responsive hybrid: split table/dashboard on desktop,
  stacked summaries and a full-width table on smaller screens.

## 3. Page Structure

### 3.1 Shared navigation and header

Add `Shop Order` to the shared `NavigationMenu` and link it to `/shop-order`.
The page header follows the current W10 visual language: a white rounded
surface, clear Thai title, a refresh action, and the shared page menu.

The header/tool area contains:

- free-text search;
- year filter;
- month filter;
- status filter;
- reset-filters action;
- refresh action; and
- `เพิ่มออเดอร์` primary action.

Search and filters update the table, all three KPI values, the status chart,
and the popular-unit ranking from one shared filtered result.

### 3.2 Desktop layout

Use an approximately 75/25 main grid:

- **Left:** the Shop Order table as the dominant working surface.
- **Right:** the summary rail.

The right rail contains, in order:

1. total orders;
2. pending and completed order cards;
3. a doughnut chart showing the pending/completed split; and
4. the six most popular receiving units.

There is no 30-day trend chart.

### 3.3 Tablet and mobile layout

At smaller breakpoints:

- summary cards, status chart, and unit ranking move above the table;
- the table becomes full width and remains horizontally scrollable;
- filter controls wrap into a readable single- or two-column form;
- add, detail, and edit dialogs use the available viewport without clipping;
  and
- file inputs retain camera capture and document selection support.

### 3.4 Table and order interactions

The table preserves the existing visible fields:

1. ลำดับ
2. จาก
3. ถึง
4. หมายเลข
5. วันที่เข้า
6. เรื่อง
7. หน่วยรับ
8. ชื่อผู้รับ
9. วันที่ออก
10. สถานะ
11. ไฟล์แนบ
12. หมายเหตุ

Rows are sorted newest-first by the numeric order sequence. The table uses a
sticky header, horizontal overflow where necessary, a designed empty state,
and client-side pagination so large datasets do not create an excessively
large DOM.

Selecting a row opens a detail dialog. The dialog exposes edit and delete
actions. Delete requires explicit confirmation. Add and edit forms disable
their submit action while a request is active so duplicate submissions are
not created.

## 4. Data Contract

### 4.1 Google Sheet tabs

- Main data: `Order1`
- Allowed destination departments: `DepartmentList`, column A from row 2
- Receiver suggestions: `ReceiverList`, column A from row 2

### 4.2 `Order1` column mapping

| Column | Field | Rule |
|---|---|---|
| A | Sequence | Stable numeric order identifier |
| B | From | Server-enforced value `หสบ-ช.` |
| C | To | Must exist in `DepartmentList` |
| D | Number | Exactly six ASCII digits |
| E | Entry date | Optional date |
| F | Subject | Required non-empty text |
| G | Receiving unit | Optional text; used by the popularity ranking |
| H | Receiver name | Optional text with `ReceiverList` suggestions |
| I | Exit date | Optional date; determines order status |
| J | Note | Optional text |
| K | Attachment URL | Optional validated Google Drive URL |

The original UI labels column E as `วันที่เข้า` and column I as `วันที่ออก`.
Status therefore follows the existing UI behavior:

- column I empty: `รอดำเนินการ`;
- column I populated: `เสร็จสิ้น`.

Dates are written as date values, formatted in the sheet as `dd/MM/yyyy`, and
displayed in the UI with Buddhist Era years. Invalid dates are rejected rather
than silently normalized.

### 4.3 Literal-value safety

All user-entered strings must be written as literal string values, not
user-entered formulas. Inputs beginning with `=`, `+`, `-`, or `@` must never
be interpreted by Google Sheets as formulas. Date values must be written as
date-compatible numeric values with explicit number formatting.

## 5. Next.js Architecture

### 5.1 Route and component boundaries

- `app/shop-order/page.tsx` provides route metadata and the server-rendered
  page shell.
- A focused client dashboard component owns filters, pagination, dialogs,
  request state, and chart interaction.
- Small presentation components isolate the toolbar, KPI cards, status chart,
  popular-unit ranking, table, detail dialog, and order form.
- Shared domain utilities own parsing, validation, status derivation,
  filtering, aggregation, and date formatting.
- Google API access remains server-only.

### 5.2 API surface

Use one route-handler resource at `/api/shop-order`:

- `GET` returns orders, department options, receiver options, and a server
  timestamp.
- `POST` accepts a new order and an optional finalized Drive file ID.
- `PATCH` accepts edits for an existing order and an optional finalized Drive
  file ID.
- `DELETE` accepts the stable order sequence to remove the order data.

Use a second Route Handler at `/api/shop-order/upload-session`:

- `POST` validates attachment metadata, pre-generates a Drive file ID, and
  starts a resumable upload in the configured folder.

All application Route Handler bodies are small JSON payloads. The browser sends
the attachment bytes with `PUT` directly to the HTTPS resumable session URI
returned by Google Drive. The session URI is treated as a short-lived bearer
secret and is never logged, persisted, or placed in a page URL.

All responses use a consistent envelope:

```ts
type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };
```

Expected user errors return appropriate 4xx responses. Google API or
unexpected server failures return a generic Thai 5xx message without exposing
credentials, stack traces, sheet identifiers, or Drive internals.

### 5.3 Google client initialization

Sheets and Drive clients are initialized lazily inside server-only getter
functions. Build-time module evaluation must not require runtime environment
variables.

Required environment variables:

- `GOOGLE_CLIENT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `SHOP_ORDER_SHEET_ID`
- `SHOP_ORDER_SHEET_NAME=Order1`
- `SHOP_ORDER_DRIVE_FOLDER_ID`

The service account must have edit access to the spreadsheet and the target
Drive folder. The deployment uses Sheets and Drive scopes required for these
operations. No credential or private key is committed to source control.

## 6. Mutation and Attachment Flow

### 6.1 Create

1. Validate the form locally for immediate feedback.
2. When a file is present, inspect its extension, MIME type, size, and signature
   in the browser before requesting an upload session.
3. Send only filename, MIME type, and byte size to the upload-session endpoint.
4. The server re-validates metadata, pre-generates a Drive file ID, and starts
   a resumable upload with that ID in the configured folder.
5. The browser uploads bytes directly to the returned HTTPS session URI.
6. Send the order JSON and optional uploaded file ID to `/api/shop-order`.
7. The server re-reads allowed departments and re-validates every form value.
8. For an uploaded file ID, verify its parent folder, pending app marker,
   filename, MIME type, exact size, and leading byte signature through Drive.
9. Set the verified file to `anyone with the link` / viewer, matching the
   existing application.
10. Append the order to `Order1`.
11. Use the actual appended row returned by Sheets to assign the stable
   sequence in column A, avoiding duplicate sequence values from simultaneous
   append requests.
12. Return the normalized created order.

If session creation, direct upload, or server verification fails, no row is
appended. If the sheet write fails after file finalization, the uploaded file
is intentionally retained.

### 6.2 Update

1. Validate the stable sequence and current order existence.
2. Validate all replacement values.
3. Upload and verify a replacement through the same resumable flow when
   supplied.
4. Re-check the sequence immediately before writing.
5. Replace columns B–K while preserving column A.
6. Keep the previous Drive file.

### 6.3 Delete

Resolve the order by its stable sequence, re-check the sequence immediately
before mutation, and clear its A–K values. Clearing rather than physically
deleting the sheet row avoids shifting another request onto the wrong row
during concurrent use. Empty rows are excluded from reads, so the user-visible
behavior remains deletion. The linked Drive file remains untouched.

### 6.4 Attachment validation

Maximum size is 10 MB. Allowed attachments match the supplied application:

- common browser/camera images, including JPEG, PNG, GIF, WebP, and HEIC/HEIF;
- PDF;
- DOC and DOCX; and
- XLS and XLSX.

Validation checks:

- byte size;
- normalized extension;
- declared MIME type;
- supported file signature/magic bytes where the format provides one; and
- a sanitized Drive filename.

The browser check is usability feedback, not a security boundary. Before
making the file public or writing its URL to Sheets, the server independently
checks Drive metadata and a bounded leading-byte range. An extension or MIME
value alone is insufficient. Executable, script, HTML, SVG, and unknown binary
uploads are rejected.

## 7. Read, Filter, and Refresh Flow

`GET` reads A–K plus both suggestion tabs. The response normalizes dates and
excludes fully empty rows. The browser retains this normalized dataset and
performs search, year, month, and status filtering locally for immediate
feedback.

Filtering is a single derived pipeline:

```text
normalized orders
  -> search/year/month/status filters
  -> newest-first sort
  -> table pagination
  -> KPI/status/unit aggregations
```

Search covers sequence, from, to, document number, subject, receiving unit,
receiver, note, and attachment URL. KPI and chart values always use the full
filtered set, not only the current table page.

The page does not poll automatically. It provides manual refresh, matching the
existing application, and performs a fresh read after every successful
mutation. Responses are marked `no-store` so refreshes are not served stale
sheet data.

## 8. Error Handling and Public-Access Boundary

The UI provides:

- initial loading skeletons;
- explicit empty states;
- inline field errors;
- non-sensitive Thai error messages;
- retry for failed reads;
- toast confirmation for successful mutations; and
- disabled pending actions to prevent duplicate submissions.

Server logs contain operation type, safe error category, and correlation ID.
They must not contain attachment bytes/Base64, resumable session URIs, private
keys, authorization headers, or full sensitive payloads.

Because the approved page has no authentication, authorization is not a
security boundary. Same-origin and content-type checks reduce browser-based
cross-site submissions but cannot stop a person or script from calling the
public API directly. This limitation is intentional and documented.

## 9. Testing Strategy

### 9.1 Unit tests

Cover:

- A–K row parsing and serialization;
- Gregorian input and Buddhist Era display;
- invalid and impossible dates;
- status derivation from column I;
- search and each filter independently and in combination;
- newest-first sorting and pagination;
- KPI totals and top-six receiving-unit ranking;
- formula-injection-safe literal serialization;
- filename normalization;
- file size, extension, MIME, and signature validation; and
- public Drive URL validation.

### 9.2 API integration tests

Mock Google Sheets and Drive clients at their server boundary and verify:

- successful `GET`, `POST`, `PATCH`, and `DELETE`;
- exact A–K mappings;
- actual appended-row sequence assignment;
- department revalidation on mutations;
- resumable session creation with a pre-generated Drive file ID;
- rejection of invalid Drive parent, marker, size, MIME, and signature data;
- file finalization before the sheet write;
- preservation of old files;
- sheet failure after file finalization;
- Drive session or verification failure before sheet mutation;
- missing rows and stale sequence checks;
- malformed bodies and unsupported content types; and
- sanitized 4xx/5xx error envelopes.

### 9.3 Component and interaction tests

Verify:

- the navigation destination;
- shared filters updating table and summaries;
- pagination without changing aggregate values;
- row detail, add, and edit dialogs;
- pending/disabled submit state;
- delete confirmation;
- attachment selection and validation feedback;
- direct upload progress, retry, and expired-session feedback;
- loading, empty, success, and failure states; and
- keyboard/focus behavior for menus and dialogs.

### 9.4 Stress and verification

Run a synthetic 10,000-order dataset through filtering, sorting, aggregation,
and pagination to catch accidental super-linear work and excessive rendered
row counts. Avoid brittle machine-time assertions; verify bounded rendered
rows and algorithmic behavior.

Before completion, run:

- lint;
- unit and integration tests;
- production build;
- desktop browser verification;
- tablet/mobile browser verification; and
- an end-to-end CRUD smoke test against the configured Sheet and Drive folder
  when credentials and folder sharing are available.

## 10. Acceptance Criteria

The feature is accepted when:

- `Shop Order` is reachable from the shared navigation;
- the desktop and responsive layouts match the approved structure;
- the table is the main desktop content area;
- the right rail contains only the approved KPIs, status summary, and
  popular-unit ranking;
- the 30-day trend chart does not exist;
- filters update both the table and all summaries;
- complete CRUD writes the expected A–K values to `Order1`;
- attachments up to 10 MB reach the configured Drive folder and open via their
  stored link;
- status is derived from column I exactly as specified;
- old attachments remain in Drive;
- public access behaves as documented;
- error states do not expose sensitive information; and
- all required automated and browser verification passes.
