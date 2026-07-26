# Shop Order Drive OAuth B1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** เปลี่ยนระบบไฟล์แนบ Shop Order ให้ Google OAuth ของ `w10egat.project@gmail.com` เป็นเจ้าของไฟล์ รองรับอัปโหลดตรงจากเบราว์เซอร์, Partial Success, Thumbnail และวงจรล้างไฟล์ โดยคง Service Account ไว้สำหรับ Google Sheets เท่านั้น

**Architecture:** แยกการยืนยันตัวตนเป็น Service Account สำหรับ Sheets และ OAuth `drive.file` สำหรับ Drive แต่คง Repository เป็นจุดประสานธุรกรรม Sheet/Attachment เพียงจุดเดียว ไฟล์ถูกอัปโหลดตรงไปยัง Google Resumable Session และติดตามสถานะด้วย Drive App Properties ส่วน Vercel Cron เรียก Route ที่ยืนยัน Bearer Secret เพื่อย้ายไฟล์หมดอายุเข้าถังขยะ

**Tech Stack:** Next.js 16.2.6 App Router Route Handlers, React 19.2.4, TypeScript 5, `googleapis` 171.4.0, Vitest 4.1.10, React Testing Library, Vercel Cron และ Vercel WAF

## Global Constraints

- ปฏิบัติตาม `docs/superpowers/specs/2026-07-27-shop-order-drive-oauth-b1-design.md`
- ใช้ TDD: เขียน Test ให้แดงก่อน เขียน Implementation ขั้นต่ำให้เขียว แล้ว Refactor
- Service Account ใช้ Scope `spreadsheets` เท่านั้น; Drive ใช้ OAuth Scope `drive.file` เท่านั้น
- ห้ามส่ง Access Token, Refresh Token, Client Secret, Authorization Code, Resumable URL หรือไบต์ไฟล์ลง Log
- รองรับเฉพาะ JPEG, PNG, WebP และ PDF ขนาดไม่เกิน 10 MB
- เก็บไบต์ต้นฉบับเพียงไฟล์เดียว ไม่บีบอัด ไม่แปลง และไม่เก็บชื่อไฟล์ต้นฉบับใน Drive
- Browser ส่งไบต์ตรงไป Google Drive; Vercel รับเฉพาะ JSON และรับส่ง Thumbnail ขนาดเล็ก
- ไฟล์ใหม่ต้องตั้ง `anyone/reader`; ไฟล์เก่าจาก Apps Script ต้องไม่ถูกแก้ไขหรือล้าง
- Pending เกิน 24 ชั่วโมงและ Scheduled Delete ครบ 30 วันให้ย้ายเข้า Trash เท่านั้น ห้ามลบถาวร
- ถ้าอัปโหลดหรือตรวจไฟล์ล้มเหลว ให้บันทึกข้อมูลออเดอร์ต่อและคืน Partial Success
- Same-origin และ WAF เป็น Defense-in-depth ไม่ใช่ Authentication; ระบบยังเป็น Public-by-link ตามสเปก
- ตั้ง Vercel WAF จำกัด 30 คำขอต่อ Source IP ต่อ 10 นาทีสำหรับ Mutation และการสร้าง Upload Session
- Route Handler ที่อ่าน Runtime Secret หรือ Google API ต้องใช้ Node.js Runtime, `force-dynamic` และ `no-store`
- ทำ Commit แยกหลังแต่ละ Task และไม่รวมไฟล์ที่ไม่เกี่ยวข้อง

## File Map

**Create**

- `lib/shop-order/attachment-lifecycle.ts`
- `lib/shop-order/attachment-lifecycle.test.ts`
- `lib/shop-order/drive-oauth.ts`
- `lib/shop-order/drive-oauth.test.ts`
- `app/api/shop-order/attachment-thumbnail/route.ts`
- `app/api/shop-order/attachment-thumbnail/route.test.ts`
- `app/api/shop-order/cleanup/route.ts`
- `app/api/shop-order/cleanup/route.test.ts`
- `scripts/setup-shop-order-drive-oauth.mjs`
- `scripts/setup-shop-order-drive-oauth.test.mjs`
- `vercel.json`

**Modify**

- `lib/shop-order/types.ts`
- `lib/shop-order/file-rules.ts`
- `lib/shop-order/file-rules.test.ts`
- `lib/shop-order/upload-client.ts`
- `lib/shop-order/upload-client.test.ts`
- `lib/shop-order/repository.ts`
- `lib/shop-order/repository.test.ts`
- `app/api/shop-order/route.ts`
- `app/api/shop-order/route.test.ts`
- `app/api/shop-order/upload-session/route.ts`
- `app/api/shop-order/upload-session/route.test.ts`
- `components/shop-order/ShopOrderDashboard.tsx`
- `components/shop-order/ShopOrderDashboard.test.tsx`
- `components/shop-order/OrderFormDialog.tsx`
- `components/shop-order/OrderDetailDialog.tsx`
- `components/shop-order/dialogs.test.tsx`
- `.env.example`
- `package.json`
- `README.md`

---

### Task 1: จำกัดชนิดไฟล์และสร้าง Domain ของ Attachment Lifecycle

**Files:**
- Modify: `lib/shop-order/types.ts`
- Modify: `lib/shop-order/file-rules.ts`
- Modify: `lib/shop-order/file-rules.test.ts`
- Create: `lib/shop-order/attachment-lifecycle.ts`
- Create: `lib/shop-order/attachment-lifecycle.test.ts`

**Interfaces:**

```ts
export interface UploadSessionRequest extends UploadMetadata {
  orderNumber: string;
}

export type AttachmentOutcome =
  | { status: 'none' }
  | { status: 'attached'; fileId: string; fileUrl: string }
  | {
      status: 'order_saved_without_attachment';
      code: string;
      message: string;
    };

export interface ShopOrderMutationResult {
  order: ShopOrder;
  attachment: AttachmentOutcome;
}
```

- [ ] **Step 1: เขียน Test ให้เหลือ Allowlist สี่ชนิด**

แก้ `lib/shop-order/file-rules.test.ts` ให้ตรวจ JPEG, PNG, WebP, PDF และปฏิเสธ GIF, HEIC, Word, Excel:

```ts
it.each([
  ['photo.gif', 'image/gif'],
  ['photo.heic', 'image/heic'],
  ['letter.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  ['sheet.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
])('rejects removed attachment type %s', async (name, mimeType) => {
  await expect(inspectLocalFile(new File(['data'], name, { type: mimeType })))
    .rejects.toThrow('รองรับเฉพาะไฟล์ JPEG, PNG, WebP และ PDF');
});
```

- [ ] **Step 2: เขียน Test ของชื่อไฟล์และเวลา Lifecycle**

สร้าง `lib/shop-order/attachment-lifecycle.test.ts`:

```ts
it('builds a sanitized storage name without the original name', () => {
  expect(buildAttachmentStorageName(
    { orderNumber: '123456', name: 'เงินเดือนลับ.png', mimeType: 'image/png', size: 8 },
    new Date('2026-07-27T08:09:10.000Z'),
    'a1b2c3d4',
  )).toBe('SO-123456-20260727-080910-a1b2c3d4.png');
});

it('uses exact pending and scheduled-delete boundaries', () => {
  expect(isExpiredPending('2026-07-26T00:00:00.000Z',
    new Date('2026-07-27T00:00:00.000Z'))).toBe(true);
  expect(deletionDate(new Date('2026-07-27T00:00:00.000Z')))
    .toBe('2026-08-26T00:00:00.000Z');
});
```

- [ ] **Step 3: Verify Red**

Run:

```powershell
npm run test:unit -- lib/shop-order/file-rules.test.ts lib/shop-order/attachment-lifecycle.test.ts
```

Expected: FAIL เพราะชนิดไฟล์เดิมยังได้รับอนุญาตและ Module Lifecycle ยังไม่มี

- [ ] **Step 4: Implement Domain ขั้นต่ำ**

ใน `attachment-lifecycle.ts` ให้ export:

```ts
export const PENDING_TTL_MS = 24 * 60 * 60 * 1000;
export const DELETE_DELAY_MS = 30 * 24 * 60 * 60 * 1000;

export type AttachmentLifecycle =
  | { status: 'pending'; pendingSince: string; orderNumber: string }
  | { status: 'active'; finalizedAt: string; orderNumber: string }
  | {
      status: 'scheduled_delete';
      deleteAfter: string;
      orderNumber: string;
      reason: 'replaced' | 'order_deleted';
    };

export function buildAttachmentStorageName(
  request: UploadSessionRequest,
  now: Date,
  shortId: string,
): string;
export function parseAttachmentLifecycle(
  properties: Record<string, string>,
): AttachmentLifecycle | null;
export function isExpiredPending(pendingSince: string, now: Date): boolean;
export function deletionDate(now: Date): string;
export function driveFileIdFromCanonicalUrl(url: string): string | null;
```

ใช้ UTC ทั้งหมด, ตรวจ `orderNumber` ด้วย `/^\d{6}$/`, แปลง `.jpeg` เป็น `.jpg`, และอนุญาต Short ID เฉพาะ `[a-z0-9]{8}` เท่านั้น

ลบชนิดไฟล์อื่นจาก `ALLOWED_FILE_TYPES` และแก้ข้อความ Validation ใน `file-rules.ts`

- [ ] **Step 5: Verify Green และ Commit**

```powershell
npm run test:unit -- lib/shop-order/file-rules.test.ts lib/shop-order/attachment-lifecycle.test.ts
git add lib/shop-order/types.ts lib/shop-order/file-rules.ts lib/shop-order/file-rules.test.ts lib/shop-order/attachment-lifecycle.ts lib/shop-order/attachment-lifecycle.test.ts
git commit -m "feat: define shop order attachment lifecycle"
```

Expected: PASS

---

### Task 2: แยก OAuth Drive ออกจาก Service Account ของ Sheets

**Files:**
- Create: `lib/shop-order/drive-oauth.ts`
- Create: `lib/shop-order/drive-oauth.test.ts`
- Modify: `lib/shop-order/repository.ts`
- Modify: `lib/shop-order/repository.test.ts`

**Interfaces:**

```ts
export const DRIVE_FILE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
export interface DriveOAuthEnvironment {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}
export function readDriveOAuthEnvironment(
  env: NodeJS.ProcessEnv,
): DriveOAuthEnvironment;
export function classifyDriveOAuthError(error: unknown): DriveFailureCode;
```

- [ ] **Step 1: เขียน Test การอ่าน Secret และจำแนก Error**

```ts
it('requires all three server-only OAuth values', () => {
  expect(() => readDriveOAuthEnvironment({
    GOOGLE_DRIVE_OAUTH_CLIENT_ID: 'id',
    GOOGLE_DRIVE_OAUTH_CLIENT_SECRET: 'secret',
  })).toThrow('GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN');
});

it.each([
  [{ response: { status: 401 }, code: 'invalid_grant' }, 'DRIVE_OAUTH_REAUTH_REQUIRED'],
  [{ response: { status: 403 }, errors: [{ reason: 'storageQuotaExceeded' }] }, 'DRIVE_QUOTA_EXCEEDED'],
  [{ response: { status: 404 } }, 'DRIVE_FOLDER_CONFIGURATION_REQUIRED'],
])('maps Google failures without returning response bodies', (error, expected) => {
  expect(classifyDriveOAuthError(error)).toBe(expected);
});
```

- [ ] **Step 2: Verify Red**

```powershell
npm run test:unit -- lib/shop-order/drive-oauth.test.ts
```

Expected: FAIL เพราะ `drive-oauth.ts` ยังไม่มี

- [ ] **Step 3: Implement OAuth Factory และแยก Client**

`drive-oauth.ts` ต้องสร้าง `google.auth.OAuth2(clientId, clientSecret)`, เรียก `setCredentials({ refresh_token })` และสร้าง Drive v3 Client แบบ Lazy Singleton โดยไม่ export Credential

แก้ `createDefaultRepository()`:

```ts
const sheetAuth = new google.auth.JWT({
  email: clientEmail,
  key: privateKey,
  scopes: [GOOGLE_SHEETS_SCOPE],
});
const driveAuth = createDriveOAuthClient(google, readDriveOAuthEnvironment(process.env));
const sheets = google.sheets({ version: 'v4', auth: sheetAuth });
const drive = google.drive({ version: 'v3', auth: driveAuth });
```

`getAccessToken` สำหรับ Drive ต้องใช้ `driveAuth.getAccessToken()` เท่านั้น และลบ `GOOGLE_DRIVE_SCOPE` แบบ Full Drive ออกจากไฟล์

- [ ] **Step 4: เพิ่ม Repository Test ป้องกัน Regression**

Mock Factory แล้ว assert ว่า:

```ts
expect(sheetScopes).toEqual(['https://www.googleapis.com/auth/spreadsheets']);
expect(driveScopes).toEqual(['https://www.googleapis.com/auth/drive.file']);
expect(serializedClientBundle).not.toContain('refresh-token');
```

- [ ] **Step 5: Verify และ Commit**

```powershell
npm run test:unit -- lib/shop-order/drive-oauth.test.ts lib/shop-order/repository.test.ts
git add lib/shop-order/drive-oauth.ts lib/shop-order/drive-oauth.test.ts lib/shop-order/repository.ts lib/shop-order/repository.test.ts
git commit -m "feat: authenticate shop order drive with oauth"
```

Expected: PASS

---

### Task 3: สร้าง OAuth Resumable Session ด้วยชื่อและ Pending Metadata ใหม่

**Files:**
- Modify: `lib/shop-order/repository.ts`
- Modify: `lib/shop-order/repository.test.ts`
- Modify: `app/api/shop-order/upload-session/route.ts`
- Modify: `app/api/shop-order/upload-session/route.test.ts`

- [ ] **Step 1: เขียน Route Test ของ Request Contract**

```ts
const request = jsonRequest({
  orderNumber: '123456',
  name: 'ต้นฉบับลับ.png',
  mimeType: 'image/png',
  size: 8,
});
const response = await POST(request);
expect(response.status).toBe(201);
expect(repository.createUploadSession).toHaveBeenCalledWith({
  orderNumber: '123456',
  name: 'ต้นฉบับลับ.png',
  mimeType: 'image/png',
  size: 8,
});
```

เพิ่ม Test ปฏิเสธเลขไม่ครบหกหลักด้วย `400 INVALID_UPLOAD_METADATA`

- [ ] **Step 2: เขียน Repository Test ของ Drive Metadata**

กำหนดเวลา `2026-07-27T08:09:10.000Z` และ UUID
`a1b2c3d4-e5f6-4789-8abc-def012345678` แล้ว assert Body:

```ts
expect(JSON.parse(fetchInit.body as string)).toMatchObject({
  id: 'generated-id',
  name: 'SO-123456-20260727-080910-a1b2c3d4.png',
  parents: ['oauth-folder-id'],
  appProperties: {
    status: 'pending',
    pendingSince: '2026-07-27T08:09:10.000Z',
    orderNumber: '123456',
    expectedName: 'SO-123456-20260727-080910-a1b2c3d4.png',
    expectedMime: 'image/png',
    expectedSize: '8',
  },
});
expect(fetchInit.body).not.toContain('ต้นฉบับลับ');
```

- [ ] **Step 3: Verify Red**

```powershell
npm run test:unit -- app/api/shop-order/upload-session/route.test.ts lib/shop-order/repository.test.ts
```

Expected: FAIL เพราะ Request ยังไม่มี `orderNumber` และ Drive ยังใช้ชื่อเดิม

- [ ] **Step 4: Implement Session Flow**

- Validate Same-origin และ JSON เหมือนเดิม
- ใช้ `randomUUID().replaceAll('-', '').slice(0, 8)` เป็น Short ID
- ส่ง OAuth Bearer Token เฉพาะ Header ไป `https://www.googleapis.com/upload/drive/v3/files`
- ตรวจ `Location` ว่าต้องเป็น HTTPS exact host `www.googleapis.com`
- Map OAuth/Folder/Quota Error เป็นรหัสภาษาไทยตามสเปก โดยไม่กล่าวถึง Service Account

- [ ] **Step 5: Verify และ Commit**

```powershell
npm run test:unit -- app/api/shop-order/upload-session/route.test.ts lib/shop-order/repository.test.ts
git add lib/shop-order/repository.ts lib/shop-order/repository.test.ts app/api/shop-order/upload-session
git commit -m "feat: create oauth drive upload sessions"
```

Expected: PASS

---

### Task 4: Finalize ไฟล์และคืน Partial-success จาก CRUD

**Files:**
- Modify: `lib/shop-order/repository.ts`
- Modify: `lib/shop-order/repository.test.ts`
- Modify: `app/api/shop-order/route.ts`
- Modify: `app/api/shop-order/route.test.ts`

**Repository Contract:**

```ts
create(order: ShopOrderInput, uploadedFileId?: string):
  Promise<ShopOrderMutationResult>;
update(no: number, order: ShopOrderInput, uploadedFileId?: string):
  Promise<ShopOrderMutationResult>;
```

- [ ] **Step 1: เขียน Test ของไฟล์ที่ตรวจผ่าน**

Test ต้องตรวจลำดับ:

1. `drive.files.get` ตรวจ Parent, Pending, Order Number, Name, MIME, Size, Trash
2. GET Leading Bytes ด้วย OAuth Token
3. สร้าง `anyone/reader`
4. เปลี่ยน Properties เป็น Active
5. เขียน Canonical URL ลง Sheet

```ts
expect(drive.files.update).toHaveBeenCalledWith({
  fileId: 'generated-id',
  fields: 'id,webViewLink',
  requestBody: {
    appProperties: {
      status: 'active',
      finalizedAt: '2026-07-27T08:10:00.000Z',
      orderNumber: '123456',
      expectedName: 'SO-123456-20260727-080910-a1b2c3d4.png',
      expectedMime: 'image/png',
      expectedSize: '8',
    },
  },
});
expect(result.attachment.status).toBe('attached');
```

- [ ] **Step 2: เขียน Test ของ Partial Success**

```ts
drive.files.get.mockRejectedValueOnce(new Error('invalid upload'));
const result = await repository.create(validOrder, 'bad-file-id');
expect(result).toMatchObject({
  order: { fileUrl: '' },
  attachment: {
    status: 'order_saved_without_attachment',
    code: 'ORDER_SAVED_WITHOUT_ATTACHMENT',
  },
});
expect(sheets.spreadsheets.values.append).toHaveBeenCalled();
```

สำหรับ Edit หากไฟล์ใหม่เสีย ให้คง URL เดิมไว้และคืน Warning; ห้ามกำหนดลบไฟล์เดิม

- [ ] **Step 3: เขียน Test การชดเชยเมื่อ Sheet ล้มเหลว**

เมื่อ Activate สำเร็จแต่ Sheet ล้มเหลว ต้องพยายามคืน Properties เป็น Pending และลบ Permission ที่เพิ่งสร้าง:

```ts
sheets.spreadsheets.values.append.mockRejectedValueOnce(new Error('sheet down'));
await expect(repository.create(validOrder, 'generated-id')).rejects.toThrow();
expect(drive.permissions.delete).toHaveBeenCalledWith({
  fileId: 'generated-id',
  permissionId: 'public-permission-id',
});
expect(drive.files.update).toHaveBeenLastCalledWith(expect.objectContaining({
  requestBody: { appProperties: expect.objectContaining({ status: 'pending' }) },
}));
```

- [ ] **Step 4: Verify Red**

```powershell
npm run test:unit -- lib/shop-order/repository.test.ts app/api/shop-order/route.test.ts
```

Expected: FAIL เพราะ CRUD เดิมคืน `ShopOrder` และโยน 500 เมื่อ Attachment Verification ล้มเหลว

- [ ] **Step 5: Implement Transaction Boundary**

แยก `verifyPendingUpload`, `activateUpload`, `restorePendingUpload` และ `attachmentWarning` ออกจากกัน ห้าม Catch ความล้มเหลวของ Sheet เป็น Attachment Warning

Route ส่ง `ShopOrderMutationResult` ตรงใน Success Envelope:

```ts
return jsonSuccess(await repository.create(order, uploadedFile.value), 201);
```

เฉพาะ Drive Attachment Error ที่จำแนกแล้วเท่านั้นจึงกลายเป็น Partial Success; Validation ของออเดอร์, Department และ Sheet Error ยังเป็น Error ตามเดิม

- [ ] **Step 6: Verify และ Commit**

```powershell
npm run test:unit -- lib/shop-order/repository.test.ts app/api/shop-order/route.test.ts
git add lib/shop-order/repository.ts lib/shop-order/repository.test.ts lib/shop-order/types.ts app/api/shop-order/route.ts app/api/shop-order/route.test.ts
git commit -m "feat: save shop orders with attachment outcomes"
```

Expected: PASS

---

### Task 5: กำหนดลบไฟล์ OAuth ที่ถูกแทนที่หรือแยกจากออเดอร์

**Files:**
- Modify: `lib/shop-order/repository.ts`
- Modify: `lib/shop-order/repository.test.ts`

- [ ] **Step 1: เขียน Test การแทนที่หลัง Sheet สำเร็จ**

```ts
await repository.update(1, validOrder, 'new-file-id');
expect(sheets.spreadsheets.values.update).toHaveBeenCalled();
expect(drive.files.update).toHaveBeenCalledWith({
  fileId: 'old-oauth-file-id',
  fields: 'id',
  requestBody: {
    appProperties: {
      status: 'scheduled_delete',
      deleteAfter: '2026-08-26T00:00:00.000Z',
      orderNumber: '123456',
      reason: 'replaced',
    },
  },
});
```

ใช้ `invocationCallOrder` ยืนยันว่าการ Schedule เกิดหลัง Sheet Update

- [ ] **Step 2: เขียน Test ลบออเดอร์และ Legacy No-op**

```ts
await repository.remove(1);
expect(sheets.spreadsheets.values.clear).toHaveBeenCalled();
expect(scheduleCall).toMatchObject({
  reason: 'order_deleted',
  deleteAfter: '2026-08-26T00:00:00.000Z',
});
```

เพิ่ม Cases ที่ URL ไม่ใช่ Canonical Drive, Drive ตอบ 403/404, Parent ผิด, ไม่มี Lifecycle หรือสถานะไม่ใช่ Active แล้ว assert ว่าไม่ Update Properties และการแก้ Sheet ยังสำเร็จ

- [ ] **Step 3: Verify Red**

```powershell
npm run test:unit -- lib/shop-order/repository.test.ts
```

Expected: FAIL เพราะ Repository เดิมไม่จัดการไฟล์เก่า

- [ ] **Step 4: Implement Safe Scheduling**

สร้าง `scheduleOwnedAttachmentDeletion(fileUrl, orderNumber, reason)`:

- แยก File ID จาก Canonical URL เท่านั้น
- `files.get` ต้องขอ `id,parents,appProperties,trashed`
- ต้อง Parent ตรง Folder และ Lifecycle เป็น `active`
- 403/404/Legacy ให้คืน `{ status: 'skipped' }`
- หลัง Sheet สำเร็จค่อยเขียน `scheduled_delete`
- Error ชั่วคราวให้ Safe Log แล้วไม่ Rollback การแก้ Sheet ที่สำเร็จ

- [ ] **Step 5: Verify และ Commit**

```powershell
npm run test:unit -- lib/shop-order/repository.test.ts
git add lib/shop-order/repository.ts lib/shop-order/repository.test.ts lib/shop-order/attachment-lifecycle.ts lib/shop-order/attachment-lifecycle.test.ts
git commit -m "feat: schedule retired shop order attachments"
```

Expected: PASS

---

### Task 6: เพิ่ม Idempotent Daily Cleanup Route

**Files:**
- Modify: `lib/shop-order/repository.ts`
- Modify: `lib/shop-order/repository.test.ts`
- Create: `app/api/shop-order/cleanup/route.ts`
- Create: `app/api/shop-order/cleanup/route.test.ts`
- Create: `vercel.json`

**Interface:**

```ts
export interface AttachmentCleanupSummary {
  inspected: number;
  trashed: number;
  skipped: number;
  failed: number;
}
cleanupAttachments(): Promise<AttachmentCleanupSummary>;
```

- [ ] **Step 1: เขียน Repository Test ของ Pagination และ Boundary**

Mock `files.list` สอง Query คือ `status=pending` และ `status=scheduled_delete`, รวมหลายหน้า แล้วตรวจว่า:

- Pending อายุเท่ากับ/เกิน 24 ชั่วโมงถูก Trash
- Pending ใหม่กว่า 24 ชั่วโมงถูก Skip
- Scheduled ที่ `deleteAfter <= now` ถูก Trash
- Scheduled ในอนาคตถูก Skip
- ไฟล์ที่ Trash แล้ว/ไม่พบถือเป็นสำเร็จแบบ Idempotent
- Error ของไฟล์หนึ่งเพิ่ม `failed` แต่ไม่หยุดไฟล์ถัดไป

```ts
expect(summary).toEqual({
  inspected: 6,
  trashed: 2,
  skipped: 3,
  failed: 1,
});
```

- [ ] **Step 2: เขียน Route Test ของ Bearer Secret**

```ts
expect((await GET(new Request(url))).status).toBe(401);
expect((await GET(new Request(url, {
  headers: { Authorization: 'Bearer wrong' },
}))).status).toBe(401);
expect((await GET(new Request(url, {
  headers: { Authorization: 'Bearer cron-secret' },
}))).status).toBe(200);
```

ตรวจ Response ว่ามีเฉพาะ Counter ไม่มี File ID, Name, URL หรือ Google Body

- [ ] **Step 3: Verify Red**

```powershell
npm run test:unit -- lib/shop-order/repository.test.ts app/api/shop-order/cleanup/route.test.ts
```

Expected: FAIL เพราะ Cleanup API ยังไม่มี

- [ ] **Step 4: Implement Cleanup**

เพิ่ม `files.list` และ `files.update({ requestBody: { trashed: true } })` ใน Drive Boundary ใช้ `pageToken` จนหมด และ Query เฉพาะ App Properties ที่แอปสร้าง

สร้าง Route:

```ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<Response> {
  if (!isValidCronAuthorization(
    request.headers.get('authorization'),
    process.env.SHOP_ORDER_CRON_SECRET,
  )) return jsonError('UNAUTHORIZED', 'ไม่ได้รับอนุญาต', 401);
  return jsonSuccess(await (await getShopOrderRepository()).cleanupAttachments());
}
```

เปรียบเทียบ Secret ด้วย `timingSafeEqual` หลังตรวจความยาว
Vercel ใช้ Environment ชื่อ `CRON_SECRET` สำหรับสร้าง Authorization Header
จึงต้องตั้ง `CRON_SECRET` และ `SHOP_ORDER_CRON_SECRET` เป็นค่า Random เดียวกัน
โดย Route อ่านค่าจาก `SHOP_ORDER_CRON_SECRET` ตาม Domain Config ที่อนุมัติ

สร้าง `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/shop-order/cleanup",
      "schedule": "17 18 * * *"
    }
  ]
}
```

เวลา `18:17 UTC` คือ `01:17` ของวันถัดไปในประเทศไทย และเข้ากับข้อจำกัดขั้นต่ำวันละครั้งของ Vercel Hobby

- [ ] **Step 5: Verify และ Commit**

```powershell
npm run test:unit -- lib/shop-order/repository.test.ts app/api/shop-order/cleanup/route.test.ts
git add lib/shop-order/repository.ts lib/shop-order/repository.test.ts lib/shop-order/types.ts app/api/shop-order/cleanup vercel.json
git commit -m "feat: clean expired shop order attachments"
```

Expected: PASS

---

### Task 7: เพิ่ม Authenticated Drive Thumbnail Proxy

**Files:**
- Modify: `lib/shop-order/repository.ts`
- Modify: `lib/shop-order/repository.test.ts`
- Create: `app/api/shop-order/attachment-thumbnail/route.ts`
- Create: `app/api/shop-order/attachment-thumbnail/route.test.ts`
- Modify: `components/shop-order/OrderDetailDialog.tsx`
- Modify: `components/shop-order/dialogs.test.tsx`

- [ ] **Step 1: เขียน Repository Test การตรวจ Ownership**

`getAttachmentThumbnail(no)` ต้อง:

- อ่านแถวปัจจุบันจาก Sheet
- แยก File ID จาก Column K
- ตรวจ Parent, `active`, Order Number, MIME และ Trash
- อ่าน `thumbnailLink` ด้วย OAuth Authorization
- คืน `{ bytes, contentType }` เฉพาะ `image/*`

Test Legacy URL, Parent ผิด, Order Number ผิด, ไม่มี Thumbnail และไฟล์ Trash ให้คืน `null` โดยไม่ Fetch Thumbnail

- [ ] **Step 2: เขียน Route และ UI Test**

```ts
const response = await GET(new Request(
  'https://dashboard.example/api/shop-order/attachment-thumbnail?no=7',
));
expect(response.status).toBe(200);
expect(response.headers.get('Cache-Control')).toContain('no-store');
expect(response.headers.get('Content-Type')).toBe('image/png');
```

ใน Dialog Test:

```ts
expect(screen.getByRole('img', {
  name: 'ตัวอย่างไฟล์แนบรายการ 7',
}).getAttribute('src')).toBe(
  '/api/shop-order/attachment-thumbnail?no=7',
);
fireEvent.error(screen.getByRole('img', { name: /ตัวอย่างไฟล์แนบ/ }));
expect(screen.getByText('ไม่พบรูปตัวอย่าง')).toBeDefined();
```

- [ ] **Step 3: Verify Red**

```powershell
npm run test:unit -- lib/shop-order/repository.test.ts app/api/shop-order/attachment-thumbnail/route.test.ts components/shop-order/dialogs.test.tsx
```

Expected: FAIL เพราะ Route และ Preview ยังไม่มี

- [ ] **Step 4: Implement Thumbnail**

Route รับ `no` เป็น Positive Safe Integer เท่านั้น, คืน `404` เมื่อเป็น Legacy/ไม่มี Thumbnail, จำกัด Body ที่รับจาก Drive ไม่เกิน 2 MB และส่ง Header:

```ts
{
  'Content-Type': thumbnail.contentType,
  'Cache-Control': 'no-store, max-age=0',
  'X-Content-Type-Options': 'nosniff',
  'Content-Security-Policy': "default-src 'none'",
}
```

Dialog แสดง Thumbnail เฉพาะเมื่อมี `fileUrl`; หาก Error ให้แสดงไอคอนตาม MIME ที่ทราบจาก URL ไม่ได้ จึงใช้ข้อความกลาง “ไม่พบรูปตัวอย่าง” และคงปุ่มเปิดไฟล์ต้นฉบับในแท็บใหม่

- [ ] **Step 5: Verify และ Commit**

```powershell
npm run test:unit -- lib/shop-order/repository.test.ts app/api/shop-order/attachment-thumbnail/route.test.ts components/shop-order/dialogs.test.tsx
git add lib/shop-order/repository.ts lib/shop-order/repository.test.ts app/api/shop-order/attachment-thumbnail components/shop-order/OrderDetailDialog.tsx components/shop-order/dialogs.test.tsx
git commit -m "feat: show verified drive attachment thumbnails"
```

Expected: PASS

---

### Task 8: Retry Upload และบันทึกออเดอร์ต่อเมื่อไฟล์ล้มเหลว

**Files:**
- Modify: `lib/shop-order/upload-client.ts`
- Modify: `lib/shop-order/upload-client.test.ts`
- Modify: `components/shop-order/ShopOrderDashboard.tsx`
- Modify: `components/shop-order/ShopOrderDashboard.test.tsx`
- Modify: `components/shop-order/OrderFormDialog.tsx`
- Modify: `components/shop-order/dialogs.test.tsx`

- [ ] **Step 1: เขียน Upload Retry Tests**

Inject `requestFactory` และ `wait` เพื่อไม่หน่วง Test จริง:

```ts
await uploadToDriveSession(file, session, onProgress, {
  requestFactory,
  wait,
  retryDelaysMs: [250, 750],
});
expect(requestFactory).toHaveBeenCalledTimes(3);
expect(wait).toHaveBeenNthCalledWith(1, 250);
expect(wait).toHaveBeenNthCalledWith(2, 750);
```

Cases ที่ Retry: Network Error, 429, 500–599; Cases ที่ไม่ Retry: 400, 401, 403, 404 และ Validation Error

- [ ] **Step 2: เขียน Client Partial-success Test**

จำลอง Session Request หรือ Direct Upload ล้มเหลว แล้ว assert ว่า Dashboard ยัง POST/PATCH `/api/shop-order` โดยไม่มี `uploadedFileId`

```ts
expect(fetch).toHaveBeenCalledWith('/api/shop-order', expect.objectContaining({
  method: 'POST',
  body: JSON.stringify({ order: expect.any(Object) }),
}));
expect(await screen.findByRole('status')).toHaveTextContent(
  'บันทึกออเดอร์แล้ว แต่แนบไฟล์ไม่สำเร็จ',
);
expect(screen.getByRole('button', { name: 'เพิ่มไฟล์อีกครั้ง' })).toBeDefined();
```

จำลอง Server คืน `order_saved_without_attachment` แล้วตรวจ Warning เดียวกัน

- [ ] **Step 3: เขียน Dialog Test ของ Allowlist**

```ts
expect(screen.getByLabelText(/ไฟล์แนบ/).getAttribute('accept'))
  .toBe('.jpg,.jpeg,.png,.webp,.pdf');
```

PDF แสดงไอคอน/คำว่า PDF และชื่อไฟล์; รูปยังแสดง Preview 80×80 และ Revoke Object URL เมื่อเปลี่ยนไฟล์หรือปิด

- [ ] **Step 4: Verify Red**

```powershell
npm run test:unit -- lib/shop-order/upload-client.test.ts components/shop-order/ShopOrderDashboard.test.tsx components/shop-order/dialogs.test.tsx
```

Expected: FAIL เพราะ Client ปัจจุบันไม่ Retry และหยุดทั้งการบันทึกเมื่ออัปโหลดล้มเหลว

- [ ] **Step 5: Implement Retry และ Warning State**

- ส่ง `orderNumber` ไป Upload Session
- Catch เฉพาะขั้น Session/Upload แล้วจำ Warning จากนั้นบันทึกออเดอร์ต่อ
- ถ้า Edit มีไฟล์เดิมและ Upload ใหม่ล้มเหลว ให้คงไฟล์เดิม
- หลังบันทึกสำเร็จ ปิด Dialog, Refresh ข้อมูล และแสดง Banner `role="status"`
- ปุ่ม “เพิ่มไฟล์อีกครั้ง” เปิด Edit Dialog ของออเดอร์ที่เพิ่งบันทึก
- Validation ฝั่ง Client ไม่เรียก Network และไม่บันทึกจนผู้ใช้แก้ไฟล์/ถอดไฟล์

- [ ] **Step 6: Verify และ Commit**

```powershell
npm run test:unit -- lib/shop-order/upload-client.test.ts components/shop-order/ShopOrderDashboard.test.tsx components/shop-order/dialogs.test.tsx
git add lib/shop-order/upload-client.ts lib/shop-order/upload-client.test.ts components/shop-order/ShopOrderDashboard.tsx components/shop-order/ShopOrderDashboard.test.tsx components/shop-order/OrderFormDialog.tsx components/shop-order/dialogs.test.tsx
git commit -m "feat: preserve shop orders when uploads fail"
```

Expected: PASS

---

### Task 9: สร้าง Local OAuth Setup Utility

**Files:**
- Create: `scripts/setup-shop-order-drive-oauth.mjs`
- Create: `scripts/setup-shop-order-drive-oauth.test.mjs`
- Modify: `package.json`

- [ ] **Step 1: เขียน Test ของ Authorization URL และผลลัพธ์**

ใช้ `node:test` และ Dependency Injection:

```js
assert.equal(params.get('access_type'), 'offline');
assert.equal(params.get('prompt'), 'consent');
assert.equal(params.get('scope'),
  'https://www.googleapis.com/auth/drive.file');
assert.match(output, /SHOP_ORDER_DRIVE_FOLDER_ID=/);
assert.match(output, /GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN=/);
assert.doesNotMatch(output, /access_token/);
```

Test ต้องตรวจ `state` แบบ Random, Callback State ไม่ตรงถูกปฏิเสธ, Folder Body เป็น `{ name: 'Picture-OAuth', mimeType: 'application/vnd.google-apps.folder' }` และ Script ไม่เขียน `.env`

- [ ] **Step 2: Verify Red**

```powershell
node --test scripts/setup-shop-order-drive-oauth.test.mjs
```

Expected: FAIL เพราะ Script ยังไม่มี

- [ ] **Step 3: Implement Utility**

Script ต้อง:

1. อ่าน `GOOGLE_DRIVE_OAUTH_CLIENT_ID` และ `GOOGLE_DRIVE_OAUTH_CLIENT_SECRET` จาก Environment
2. เปิด Loopback Server บน `127.0.0.1` ด้วย Port แบบ Dynamic
3. สร้าง Authorization URL ด้วย `access_type=offline`, `prompt=consent`, `include_granted_scopes=false`, exact Scope `drive.file`, Redirect URI และ Random State
4. พิมพ์ URL ให้ผู้ใช้เปิด โดยไม่เปิด Browser อัตโนมัติ
5. รับ Code เฉพาะ Callback ที่ State ตรง
6. แลก Token, ปฏิเสธกรณีไม่มี Refresh Token
7. สร้าง `Picture-OAuth`
8. พิมพ์เฉพาะ Refresh Token, Folder ID และคำแนะนำย้าย Folder
9. ปิด Server ใน `finally`

แยก `runSetup(dependencies)` เป็น Named Export สำหรับ Test และเรียกจริงเฉพาะ
เมื่อ `import.meta.url === pathToFileURL(process.argv[1]).href` เพื่อไม่ให้ Test
เปิด Port หรือเรียก Google โดยไม่ตั้งใจ

เพิ่ม Script:

```json
"shop-order:setup-drive": "node scripts/setup-shop-order-drive-oauth.mjs",
"test:oauth-setup": "node --test scripts/setup-shop-order-drive-oauth.test.mjs"
```

- [ ] **Step 4: Verify และ Commit**

```powershell
npm run test:oauth-setup
git add scripts/setup-shop-order-drive-oauth.mjs scripts/setup-shop-order-drive-oauth.test.mjs package.json
git commit -m "feat: add shop order drive oauth setup"
```

Expected: PASS โดยไม่เรียก Google จริงใน Test

---

### Task 10: Environment, Deployment, WAF และ Runbook

**Files:**
- Modify: `.env.example`
- Modify: `README.md`

- [ ] **Step 1: เขียนรายการ Environment ที่ครบ**

`.env.example`:

```dotenv
GOOGLE_CLIENT_EMAIL=
GOOGLE_PRIVATE_KEY=
SHOP_ORDER_SHEET_ID=1ZtFnQhPortoyUgKzQuruq5kU7q5V9l1GYbsSgL-9oco
SHOP_ORDER_SHEET_NAME=Order1
GOOGLE_DRIVE_OAUTH_CLIENT_ID=
GOOGLE_DRIVE_OAUTH_CLIENT_SECRET=
GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN=
SHOP_ORDER_DRIVE_FOLDER_ID=
SHOP_ORDER_CRON_SECRET=
CRON_SECRET=
```

ไม่มีค่าจริงของ Secret และ Folder ID เดิม โดย `CRON_SECRET` ต้องมีค่าเดียวกับ
`SHOP_ORDER_CRON_SECRET` เพื่อให้ Vercel แนบ Bearer Header มากับ Cron

- [ ] **Step 2: เขียน README Runbook ภาษาไทย**

README ต้องมีขั้นตอนที่ตรวจทำตามได้:

1. ตั้ง OAuth Consent ให้พร้อม Production และเพิ่ม `w10egat.project@gmail.com`
2. สร้าง OAuth Client แบบ Desktop
3. รัน `npm run shop-order:setup-drive`
4. ย้าย `Picture-OAuth` ใต้ `WebApp ShopOrder`
5. เพิ่ม Environment ทั้ง Production/Preview ตามที่ต้องการ และ Redeploy
6. ทดสอบสร้าง, แก้ไขแทนไฟล์, ลบ, Partial Success, Thumbnail
7. ตรวจ Cron เฉพาะ Production และวิธี Invoke ด้วย Bearer Secret
8. วิธี Reauthorize เมื่อ Token ถูกยกเลิก
9. ระบุชัดว่า Legacy `Picture` ไม่ถูกแตะ

เพิ่ม WAF Runbook:

- Path ครอบคลุม `/api/shop-order` และ `/api/shop-order/upload-session`
- Method เป็น `POST`, `PATCH`, `DELETE`
- Fixed Window 30 Requests ต่อ Source IP ต่อ 10 นาที
- Action `Rate Limit`
- ทดสอบใน Production และตรวจว่า GET/Thumbnail/Cron ไม่ติด Rule

- [ ] **Step 3: ตรวจว่าไม่มีข้อความเก่าขัดแย้ง**

```powershell
rg -n "service account.*Drive|GIF|HEIC|Word|Excel|ไม่ลบไฟล์เดิม" README.md .env.example
```

Expected: ไม่พบข้อความเก่าที่บอกให้ Service Account อัปโหลด Drive หรือรองรับชนิดไฟล์ที่ถูกตัดออก

- [ ] **Step 4: Commit**

```powershell
git add .env.example README.md
git commit -m "docs: add shop order oauth deployment runbook"
```

---

### Task 11: Full Verification และ Production Readiness

**Files:**
- Verify all modified files

- [ ] **Step 1: รัน Unit และ Integration Tests ทั้งหมด**

```powershell
npm run test:unit
npm run test:oauth-setup
```

Expected: Tests ทั้งหมด PASS และไม่มี Unhandled Rejection

- [ ] **Step 2: รัน Static Checks และ Production Build**

```powershell
npm run lint
npm run build
```

Expected: Exit Code 0 ทั้งสองคำสั่ง; Build แสดง Route:

- `/api/shop-order`
- `/api/shop-order/upload-session`
- `/api/shop-order/attachment-thumbnail`
- `/api/shop-order/cleanup`
- `/shop-order`

- [ ] **Step 3: ตรวจ Secret Leakage และ Scope**

```powershell
rg -n "auth/drive($|[^.]|$)|access_token|refresh_token|client_secret|uploadUrl" app components lib README.md .env.example
rg -n "auth/drive.file|GOOGLE_DRIVE_OAUTH" lib scripts README.md .env.example
```

Expected:

- ไม่มี Full Drive Scope `https://www.googleapis.com/auth/drive`
- Secret identifiers พบเฉพาะ Server/Script/Docs ที่ตั้งใจ
- `uploadUrl` พบใน Server Response Type และ Direct-upload Client เท่านั้น ไม่พบใน Log/Persistence

- [ ] **Step 4: ตรวจ Git Diff**

```powershell
git status --short
git diff --check
git log --oneline -12
```

Expected: ไม่มี Whitespace Error และทุก Task มี Commit แยก

- [ ] **Step 5: Production Smoke Checklist หลังตั้ง Secret และ Deploy**

ดำเนินการกับ Test Order หนึ่งรายการ:

1. GET `/api/shop-order` ได้ 200
2. เพิ่มออเดอร์เลข `123456` พร้อม PNG แล้วพบชื่อที่ตรง
   `SO-123456-{yyyyMMdd-HHmmss}-{shortId}.png` ใน `Picture-OAuth`
3. เปิด Link และ Thumbnail ได้โดยไม่ Login
4. แก้ไขเป็น PDF แล้ว Column K เปลี่ยน และไฟล์เดิมเป็น `scheduled_delete`
5. จำลอง Upload Fail แล้วออเดอร์ยังบันทึกพร้อม Warning และปุ่ม Retry
6. ลบออเดอร์แล้วไฟล์ใหม่เป็น `scheduled_delete`
7. เรียก Cleanup ด้วย Secret ผิดได้ 401 และ Secret ถูกได้ Counter เท่านั้น
8. ตรวจ Vercel Cron แสดง Schedule วันละครั้ง
9. ตรวจ WAF Request ที่ 31 ภายใน 10 นาทีถูก Rate-limit โดยไม่กระทบ GET

- [ ] **Step 6: Commit การแก้ไขเฉพาะที่เกิดจาก Verification (ถ้ามี)**

ตรวจ `git status --short`, ระบุรายชื่อไฟล์ที่แก้จากผลตรวจอย่างชัดเจน แล้วใช้
`git add` กับแต่ละ Path แบบเจาะจงก่อน Commit:

```powershell
git commit -m "fix: harden shop order oauth verification"
```

หากไม่มีไฟล์แก้ ไม่ Stage และไม่สร้าง Empty Commit
