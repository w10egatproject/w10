# Shop Order Drive OAuth B1 Design

**Date:** 2026-07-27

**Status:** Approved design; awaiting written-spec review

**Target application:** W10 Dashboard

**Supersedes:** The Google Drive authentication, attachment lifecycle, and
attachment type decisions in
`docs/superpowers/specs/2026-07-24-shop-order-nextjs-design.md`. Sheet CRUD,
dashboard layout, filtering, and status behavior remain unchanged.

## 1. Objective

Replace Service Account ownership for new Shop Order attachments with a
single-owner Google OAuth connection for `w10egat.project@gmail.com`.

The change must:

- continue reading and writing `Order1` with the existing Service Account;
- upload new attachments directly from the browser to Google Drive through a
  resumable upload session;
- make the OAuth account, rather than the Service Account, own new files;
- use the least-privilege `drive.file` scope;
- keep the application usable without Google sign-in for each clerk;
- preserve the current 10 MB attachment limit without sending file bytes
  through a Vercel Function;
- retain legacy Apps Script attachments without attempting to manage them;
- clean up abandoned and replaced OAuth-created files on a defined schedule;
  and
- return safe, actionable Thai errors without exposing OAuth credentials or
  resumable session URLs.

## 2. Confirmed Product Decisions

- This is the B1 model: one OAuth connection serves every Shop Order user.
- The connected owner is `w10egat.project@gmail.com`.
- Users do not sign in. Anyone who can reach the production URL can perform
  the existing Shop Order operations.
- New files are shared as `anyone with the link` / viewer.
- Google Sheets continues to use `GOOGLE_CLIENT_EMAIL` and
  `GOOGLE_PRIVATE_KEY`.
- Google Drive attachment operations use OAuth only. There is no Service
  Account upload fallback.
- OAuth uses `https://www.googleapis.com/auth/drive.file`, not full Drive
  access.
- A local one-time setup utility creates an app-owned folder named
  `Picture-OAuth`. The owner can then move that folder under
  `WebApp ShopOrder` without changing its file ID.
- The existing `Picture` folder and all legacy links remain untouched.
- Accepted attachments are JPEG, PNG, WebP, and PDF, up to 10 MB.
- Only the original attachment is stored. The UI uses Google Drive's generated
  thumbnail instead of uploading a second thumbnail file.
- Stored filenames use
  `SO-{orderNumber}-{yyyyMMdd-HHmmss}-{shortId}.{extension}`. The original
  client filename is not retained in the Drive filename.
- If Drive upload fails, the order is still saved without an attachment and
  the UI clearly warns the user that the file must be added later.
- Abandoned pending uploads are trashed after 24 hours.
- OAuth-created attachments replaced during edit or detached during order
  deletion are scheduled for trash after 30 days.
- Legacy Apps Script files are never automatically trashed.
- Vercel WAF rate-limits Shop Order mutation and upload-session traffic to
  30 requests per source IP per 10-minute fixed window.

## 3. Authentication Boundaries

### 3.1 Sheets

The Service Account remains the Sheets principal. It must retain editor access
to the spreadsheet. Drive scopes are removed from this principal's runtime
configuration because it no longer creates or manages new attachments.

### 3.2 Drive

The server initializes a Google OAuth client with:

- OAuth Client ID;
- OAuth Client Secret; and
- a long-lived Refresh Token issued to `w10egat.project@gmail.com`.

The Refresh Token and client secret stay server-only. The browser receives only
a short-lived resumable session URL after the server validates file metadata.
The session URL is treated as a bearer secret and is never logged, persisted,
placed in query strings, or returned after its upload operation completes.

Required production variables are:

- `GOOGLE_DRIVE_OAUTH_CLIENT_ID`;
- `GOOGLE_DRIVE_OAUTH_CLIENT_SECRET`;
- `GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN`;
- `SHOP_ORDER_DRIVE_FOLDER_ID`; and
- `SHOP_ORDER_CRON_SECRET`.

Existing Sheet variables remain required.

### 3.3 OAuth setup utility

A local Node.js utility performs the one-time owner connection:

1. validate the supplied Client ID and Client Secret without printing them;
2. start a loopback callback on `127.0.0.1`;
3. open or print a Google authorization URL using `access_type=offline`,
   `prompt=consent`, and the `drive.file` scope;
4. exchange the callback code for tokens;
5. create `Picture-OAuth` with the authenticated Drive client;
6. print only the Refresh Token and created folder ID with explicit
   instructions for adding them to Vercel; and
7. exit without writing credentials to the repository.

The OAuth consent configuration must be published in a state that does not
cause the Refresh Token to expire after a short testing window. The connected
Google account is the only required OAuth user.

## 4. Attachment Data Flow

### 4.1 Selection and preview

The browser:

- accepts JPEG, PNG, WebP, and PDF;
- rejects files over 10 MB before a network call;
- validates extension, declared MIME type, and available magic bytes;
- shows a small local preview for images;
- shows a PDF icon and filename for PDFs; and
- revokes local object URLs when the selection changes or the dialog closes.

The original bytes are not recompressed or transformed.

### 4.2 Resumable session creation

`POST /api/shop-order/upload-session` accepts only:

```ts
type UploadSessionRequest = {
  orderNumber: string;
  name: string;
  mimeType: string;
  size: number;
};
```

The server:

1. applies same-origin and JSON content-type checks;
2. validates the six-digit order number and attachment metadata;
3. creates the final sanitized filename;
4. obtains an Access Token through the OAuth Refresh Token;
5. pre-generates a Drive file ID;
6. starts a resumable upload in `SHOP_ORDER_DRIVE_FOLDER_ID`;
7. writes pending app properties containing the expected name, MIME, size,
   creation timestamp, and order number; and
8. returns the file ID, resumable session URL, and expiry timestamp.

The browser uploads the original bytes directly to the returned Google HTTPS
session URL. It reports progress and retries recoverable network or 5xx
failures up to three times with bounded exponential backoff. It does not retry
validation, permission, token, quota, or permanent 4xx failures.

### 4.3 Finalization

The order mutation sends the optional uploaded Drive file ID. Before writing
the Sheet URL, the server uses the OAuth Drive client to verify:

- the ID resolves to a file created by this OAuth application;
- the file has the configured folder as its parent;
- its pending app properties match the expected order number, name, MIME, and
  size;
- its byte size is exact;
- its available leading-byte signature matches the accepted type; and
- it is neither trashed nor already finalized for another order.

After verification, the server:

1. grants `anyone` / `reader` link access;
2. marks the file active and records its order number and finalization time;
3. clears the pending deletion timestamp; and
4. stores the canonical Drive web-view URL in column K.

### 4.4 Upload failure with successful order save

If session creation or byte upload fails, the form continues with the order
mutation and no uploaded file ID. The row is saved with an empty attachment
URL. The success message must include a persistent warning that the order was
saved but the attachment was not, with an action to open the edit dialog and
retry.

If final verification fails, the server does not trust or store the file URL.
It saves the order without an attachment and returns a partial-success result
that distinguishes the successful Sheet mutation from the attachment failure.

If the Sheet mutation itself fails after a completed upload, the file remains
pending and is eligible for the 24-hour cleanup.

## 5. File Lifecycle

OAuth-created files use app properties as the lifecycle source of truth:

```ts
type AttachmentLifecycle =
  | { status: "pending"; pendingSince: string; orderNumber: string }
  | { status: "active"; finalizedAt: string; orderNumber: string }
  | {
      status: "scheduled_delete";
      deleteAfter: string;
      orderNumber: string;
      reason: "replaced" | "order_deleted";
    };
```

### 5.1 Pending cleanup

A daily authenticated cleanup route lists OAuth-created pending files. A file
older than 24 hours is moved to Drive trash. Recent pending files are retained.

### 5.2 Replacement

An edit with a new attachment finalizes the new file and updates column K
first. Only after the Sheet update succeeds does the server mark the previous
OAuth-created attachment for deletion 30 days later.

If the previous link is a legacy Apps Script file, inaccessible to the
`drive.file` client, or outside `Picture-OAuth`, it is left untouched.

### 5.3 Order deletion

The Sheet row is cleared using the existing concurrency-safe behavior. After
the Sheet mutation succeeds, an OAuth-created linked attachment is marked for
deletion 30 days later. Legacy and unrecognized Drive links remain untouched.

### 5.4 Scheduled deletion

The daily cleanup route moves scheduled files to Drive trash only when
`deleteAfter` is in the past. Trash is recoverable through Google Drive until
the owner permanently deletes it or Drive applies its own trash retention
policy. The application never permanently deletes Drive files.

Cleanup is idempotent. A missing or already-trashed file is treated as
complete. A transient Drive failure is logged safely and retried on the next
daily run.

## 6. Thumbnail Flow

No thumbnail file is uploaded. For OAuth-created image and PDF attachments, a
server route requests Drive metadata and returns a short-lived thumbnail
response or redirect only after validating that:

- the requested file ID has the configured app-owned folder as parent;
- the file is active;
- its lifecycle order number matches the requested order; and
- the file is not trashed.

Thumbnail responses are `no-store`. The UI falls back to an image or PDF icon
when Drive does not provide a thumbnail. Selecting the preview opens the
canonical public Drive link in a new tab.

Legacy file links continue to show the existing generic attachment action;
the system does not attempt to derive authenticated thumbnails for them.

## 7. API and Domain Changes

The existing `/api/shop-order` resource remains the Sheet CRUD boundary.
Mutation success responses add an attachment outcome:

```ts
type AttachmentOutcome =
  | { status: "none" }
  | { status: "attached"; fileId: string; fileUrl: string }
  | {
      status: "order_saved_without_attachment";
      code: string;
      message: string;
    };
```

New or changed routes are:

- `POST /api/shop-order/upload-session` — OAuth resumable session creation;
- `GET /api/shop-order/attachment-thumbnail` — validated thumbnail access;
  and
- `GET /api/shop-order/cleanup` — daily cron cleanup authenticated with
  `Authorization: Bearer ${SHOP_ORDER_CRON_SECRET}`.

The cleanup route accepts Vercel Cron only when the secret matches. It returns
counts for scanned, trashed, skipped, and failed files without returning file
names, IDs, URLs, or Drive error bodies.

## 8. Error Handling and Recovery

Errors are classified without exposing credentials:

- `DRIVE_OAUTH_CONFIGURATION_REQUIRED` — a required OAuth variable is absent;
- `DRIVE_OAUTH_REAUTH_REQUIRED` — Refresh Token revoked, expired, or rejected;
- `DRIVE_FOLDER_CONFIGURATION_REQUIRED` — configured folder missing or not
  created/accessible under `drive.file`;
- `DRIVE_QUOTA_EXCEEDED` — owner storage or API quota exhausted;
- `DRIVE_UPLOAD_RETRYABLE` — network, 429, or temporary 5xx failure;
- `DRIVE_UPLOAD_REJECTED` — permanent upload or metadata failure; and
- `ORDER_SAVED_WITHOUT_ATTACHMENT` — Sheet mutation succeeded after an
  attachment failure.

Server logs include operation, safe category, HTTP status, Google reason code
when non-sensitive, duration, deployment request ID, and correlation ID. Logs
must never contain Access Tokens, Refresh Tokens, Client Secrets, authorization
codes, resumable URLs, attachment bytes, original filenames, or complete
Google response bodies.

Re-running the local OAuth setup utility and replacing the Refresh Token in
Vercel restores uploads after revocation. Existing files and Sheet links are
not changed by reauthorization.

## 9. Public Access and Abuse Controls

The approved product has no application login. This is an explicit risk:
possession of the production URL is sufficient to submit Shop Order mutations.

Controls are defense-in-depth, not authentication:

- strict same-origin checks for browser mutations;
- allowed content types and bounded body parsing;
- the 10 MB attachment limit;
- `drive.file` scope to limit OAuth blast radius;
- folder, lifecycle, and metadata verification before a URL reaches Sheets;
- Vercel WAF fixed-window rate limiting of 30 mutation/upload-session requests
  per source IP per 10 minutes; and
- secure, generic errors.

The WAF rule covers non-GET Shop Order API requests while excluding the cleanup
route. A `429` response does not fall back to an unprotected code path.

This design does not claim that a secret URL prevents intentional abuse. If
usage expands beyond the clerk-only context, authentication and an email
allowlist become required follow-up work.

## 10. Performance

- File bytes never transit a Vercel Function.
- No Base64 conversion is used.
- OAuth Access Tokens are refreshed server-side only when needed by the Google
  client library.
- The browser uploads one original file and uses Drive-generated thumbnails.
- Upload progress is based on bytes sent.
- Retry is bounded to prevent duplicate or indefinite work.
- Cleanup runs once daily and processes bounded pages rather than loading every
  Drive item into memory.
- Sheet reads, filters, summaries, and CRUD retain the current implementation.

## 11. Testing Strategy

### 11.1 Unit tests

Cover:

- OAuth environment validation and lazy client initialization;
- strict `drive.file` scope configuration;
- final filename generation without the original filename;
- JPEG, PNG, WebP, PDF, unsupported type, and 10 MB boundary validation;
- Google error classification;
- attachment lifecycle transitions;
- 24-hour and 30-day cutoff calculations;
- attachment outcome construction;
- legacy-versus-OAuth Drive URL recognition; and
- cleanup authorization.

### 11.2 Repository and API integration tests

Using mocked Sheets, OAuth, Drive, clock, and fetch boundaries, verify:

- resumable session creation uses the OAuth token and app-owned folder;
- Sheet calls still use the Service Account client;
- missing/revoked OAuth credentials return safe actionable errors;
- finalized metadata must match parent, lifecycle, order, MIME, and size;
- public link permission is added only after verification;
- a Drive failure saves the order without column K and reports partial success;
- a Sheet failure leaves the uploaded file pending;
- replacement schedules the prior OAuth file only after the Sheet succeeds;
- legacy files remain unchanged;
- deletion schedules OAuth files and leaves legacy files unchanged;
- cleanup trashes stale pending and expired scheduled files only;
- cleanup is idempotent and bounded;
- thumbnail access rejects mismatched, pending, legacy, and trashed files; and
- no API response exposes tokens or resumable URLs beyond the session creation
  response that requires one.

### 11.3 Client tests

Verify:

- image preview and PDF fallback;
- exact upload progress;
- bounded retry behavior;
- permanent upload errors do not retry;
- order save continues after upload failure;
- partial-success warning remains visible and opens edit;
- thumbnail fallback and original-file action;
- object URL cleanup; and
- pending state prevents duplicate form submission.

### 11.4 Setup and production verification

Before production completion:

1. run unit and integration tests;
2. run scoped lint and TypeScript checks;
3. run the production Next.js build;
4. run the OAuth setup utility with the owner account;
5. move `Picture-OAuth` under `WebApp ShopOrder`;
6. set the OAuth, folder, and cron variables in Vercel;
7. redeploy the saved source state;
8. verify Sheet reads still return `200`;
9. upload one approved small test image with explicit user permission;
10. confirm ownership, parent folder, public link, Sheet column K, and thumbnail;
11. verify a simulated Drive rejection produces a saved order without a link;
12. confirm cleanup dry-run classification before allowing trash mutations; and
13. configure and verify the WAF rule.

No production test may permanently delete a file or mutate a real order
without explicit user approval.

## 12. Documentation

Update project documentation with:

- the split Sheets/Drive authentication model;
- Google Cloud OAuth consent and Desktop Client setup;
- the local owner-connection command;
- required Vercel variables;
- moving the app-created folder;
- Refresh Token rotation and recovery;
- WAF setup;
- daily cleanup behavior;
- legacy file limitations; and
- a troubleshooting matrix for every safe error code.

## 13. Acceptance Criteria

The migration is accepted when:

- Shop Order reads and writes Sheets with the existing Service Account;
- new JPEG, PNG, WebP, and PDF files up to 10 MB are owned by
  `w10egat.project@gmail.com`;
- OAuth uses only `drive.file`;
- new files are created inside the configured app-owned folder;
- uploads go directly from browser to Drive with progress and bounded retry;
- new files open through an `anyone with the link` viewer permission;
- upload failure still saves the order without column K and clearly warns the
  user;
- pending files older than 24 hours are moved to trash;
- replaced and order-deleted OAuth files are scheduled for trash after 30 days;
- legacy Apps Script files remain untouched;
- Google-generated thumbnails work with a safe fallback;
- the production URL requires no end-user Google login;
- mutation traffic is limited to 30 requests per IP per 10 minutes;
- secrets and bearer URLs never appear in logs or client bundles; and
- automated, build, browser, and approved production verification pass.
