import { randomUUID } from 'node:crypto';

import {
  buildAttachmentStorageName,
  deletionDate,
  driveFileIdFromCanonicalUrl,
  isExpiredPending,
  parseAttachmentLifecycle,
} from './attachment-lifecycle';
import { assertUploadMetadata, matchesAllowedSignature } from './file-rules';
import { isoToSheetSerial, parseSheetRow } from './domain';
import {
  classifyDriveOAuthError,
  createDriveOAuthClient,
  readDriveOAuthEnvironment,
  type DriveOAuthEnvironment,
  type DriveFailureCode,
} from './drive-oauth';
import type {
  AttachmentCleanupSummary,
  ShopOrder,
  ShopOrderBootstrap,
  ShopOrderInput,
  ShopOrderMutationResult,
  UploadMetadata,
  UploadSession,
  UploadSessionRequest,
} from './types';

const GOOGLE_SHEETS_SCOPE =
  'https://www.googleapis.com/auth/spreadsheets';
const GOOGLE_UPLOAD_ORIGIN = 'https://www.googleapis.com';
const SOURCE_DEPARTMENT = 'หสบ-ช.';
const LEADING_BYTE_RANGE = 'bytes=0-31';
const SESSION_LIFETIME_MS = 60 * 60 * 1000;
const MAX_THUMBNAIL_BYTES = 2 * 1024 * 1024;
const SUPPORTED_ATTACHMENT_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);
const SAFE_THUMBNAIL_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

type JsonRecord = Record<string, unknown>;

interface GoogleValuesClient {
  batchGet(request: JsonRecord): Promise<{ data?: { valueRanges?: Array<{ values?: unknown[][] }> } }>;
  get(request: JsonRecord): Promise<{ data?: { values?: unknown[][] } }>;
  append(request: JsonRecord): Promise<{
    data?: { updates?: { updatedRange?: string | null } };
  }>;
  update(request: JsonRecord): Promise<unknown>;
  clear(request: JsonRecord): Promise<unknown>;
}

interface GoogleSheetsClient {
  spreadsheets: {
    values: GoogleValuesClient;
    get(request: JsonRecord): Promise<{
      data?: {
        sheets?: Array<{
          properties?: { title?: string | null; sheetId?: number | null };
        }>;
      };
    }>;
    batchUpdate(request: JsonRecord): Promise<unknown>;
  };
}

interface GoogleDriveClient {
  files: {
    generateIds(request: JsonRecord): Promise<{ data?: { ids?: string[] | null } }>;
    get(request: JsonRecord): Promise<{ data?: JsonRecord }>;
    list(request: JsonRecord): Promise<{
      data?: { files?: JsonRecord[] | null; nextPageToken?: string | null };
    }>;
    update(request: JsonRecord): Promise<{ data?: JsonRecord }>;
  };
  permissions: {
    create(request: JsonRecord): Promise<{ data?: JsonRecord }>;
    delete(request: JsonRecord): Promise<unknown>;
  };
}

export interface ShopOrderRepositoryDependencies {
  sheets: GoogleSheetsClient;
  drive: GoogleDriveClient;
  getAccessToken: () => Promise<string>;
  authenticatedFetch: typeof fetch;
  config: {
    spreadsheetId: string;
    sheetName: string;
    folderId: string;
  };
  now?: () => Date;
  randomId?: () => string;
}

export interface ShopOrderRepository {
  load(): Promise<ShopOrderBootstrap>;
  listDepartments(): Promise<string[]>;
  create(
    order: ShopOrderInput,
    uploadedFileId?: string,
  ): Promise<ShopOrderMutationResult>;
  update(
    no: number,
    order: ShopOrderInput,
    uploadedFileId?: string,
  ): Promise<ShopOrderMutationResult>;
  remove(no: number): Promise<void>;
  createUploadSession(request: UploadSessionRequest): Promise<UploadSession>;
  getAttachmentThumbnail(
    no: number,
  ): Promise<{ bytes: Uint8Array; contentType: string } | null>;
  cleanupAttachments(): Promise<AttachmentCleanupSummary>;
}

interface LocatedOrder {
  rowNumber: number;
  order: ShopOrder;
}

interface VerifiedUpload {
  fileId: string;
  metadata: UploadMetadata;
  appProperties: Record<string, string>;
}

interface ActivatedUpload extends VerifiedUpload {
  permissionId: string;
  webViewLink: string;
}

type CompensatableUpload = VerifiedUpload & { permissionId: string };

type ShopOrderRepositoryErrorCode =
  | DriveFailureCode
  | 'DRIVE_OAUTH_CONFIGURATION_REQUIRED';

export class ShopOrderRepositoryError extends Error {
  constructor(
    public readonly code: ShopOrderRepositoryErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'ShopOrderRepositoryError';
  }
}

class AttachmentFinalizationError extends Error {
  constructor(
    public readonly failureCode:
      | DriveFailureCode
      | 'DRIVE_UPLOAD_REJECTED',
  ) {
    super('Attachment finalization failed');
    this.name = 'AttachmentFinalizationError';
  }
}

function quoteSheetName(name: string): string {
  return `'${name.replaceAll("'", "''")}'`;
}

function uniqueNonEmpty(values: unknown[][] | undefined): string[] {
  const result: string[] = [];
  const seen = new Set<string>();
  for (const row of values ?? []) {
    const value = row[0] == null ? '' : String(row[0]).trim();
    if (value && !seen.has(value)) {
      seen.add(value);
      result.push(value);
    }
  }
  return result;
}

function parseSequence(value: unknown): number | null {
  const no = Number(value);
  return Number.isSafeInteger(no) && no > 0 ? no : null;
}

function parseUpdatedRow(updatedRange: string | null | undefined): number {
  const match = /!A(\d+):K\d+$/.exec(updatedRange ?? '');
  const rowNumber = match ? Number(match[1]) : Number.NaN;
  if (!Number.isSafeInteger(rowNumber) || rowNumber < 2) {
    throw new Error('Google Sheets did not return the appended row');
  }
  return rowNumber;
}

function safeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeAppProperties(
  value: unknown,
): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  const result: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === 'string') {
      result[key] = entry;
    }
  }
  return result;
}

function isDriveNotFound(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const response = Reflect.get(error, 'response');
  return (
    typeof response === 'object' &&
    response !== null &&
    Reflect.get(response, 'status') === 404
  );
}

function assertGoogleUploadUrl(value: string | null): string {
  if (!value) {
    throw new Error('Google Drive did not return a resumable upload URL');
  }
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('Google Drive returned an invalid resumable upload URL');
  }
  if (
    url.origin !== GOOGLE_UPLOAD_ORIGIN ||
    url.username ||
    url.password
  ) {
    throw new Error('Google Drive returned an invalid resumable upload URL');
  }
  return url.toString();
}

function safeGoogleThumbnailUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    if (
      url.protocol !== 'https:' ||
      !url.hostname.endsWith('.googleusercontent.com') ||
      url.username ||
      url.password ||
      url.port
    ) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

async function readThumbnailBytes(
  response: Response,
): Promise<Uint8Array | null> {
  if (!response.body) return null;

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_THUMBNAIL_BYTES) {
        try {
          await reader.cancel();
        } catch {
          // The size boundary still applies if stream cancellation fails.
        }
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  if (totalBytes === 0) return null;

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

const DRIVE_FAILURE_MESSAGES: Readonly<Record<DriveFailureCode, string>> = {
  DRIVE_OAUTH_REAUTH_REQUIRED:
    'การเชื่อมต่อ Google Drive หมดอายุ',
  DRIVE_QUOTA_EXCEEDED:
    'พื้นที่จัดเก็บหรือโควตา Google Drive เต็ม',
  DRIVE_FOLDER_CONFIGURATION_REQUIRED:
    'ไม่พบโฟลเดอร์ Google Drive ที่กำหนด',
  DRIVE_ACCESS_FORBIDDEN:
    'ไม่สามารถเข้าถึงโฟลเดอร์ Google Drive ได้',
  DRIVE_UNAVAILABLE:
    'Google Drive ไม่พร้อมใช้งานชั่วคราว',
};

async function classifyUploadResponse(
  response: Response,
): Promise<DriveFailureCode> {
  if (response.status === 429) return 'DRIVE_QUOTA_EXCEEDED';

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    data = undefined;
  }
  return classifyDriveOAuthError({
    response: { status: response.status, data },
  });
}

function normalizeOrderInput(order: ShopOrderInput): ShopOrderInput {
  const number = safeString(order.number);
  const to = safeString(order.to);
  const subject = safeString(order.subject);
  if (!/^\d{6}$/.test(number)) {
    throw new Error('เลขที่เอกสารต้องเป็นตัวเลข 6 หลัก');
  }
  if (!to) {
    throw new Error('กรุณาระบุหน่วยงานปลายทาง');
  }
  if (!subject) {
    throw new Error('กรุณาระบุเรื่อง');
  }

  // Conversion performs a strict calendar round-trip and throws on bad dates.
  if (order.dateIn) isoToSheetSerial(order.dateIn);
  if (order.dateOut) isoToSheetSerial(order.dateOut);

  return {
    to,
    number,
    dateIn: order.dateIn || null,
    subject,
    receivingUnit: safeString(order.receivingUnit),
    receiverName: safeString(order.receiverName),
    dateOut: order.dateOut || null,
    note: safeString(order.note),
  };
}

function serializeOrder(
  order: ShopOrderInput,
  fileUrl: string,
): Array<string | number> {
  return [
    SOURCE_DEPARTMENT,
    order.to,
    order.number,
    isoToSheetSerial(order.dateIn) ?? '',
    order.subject,
    order.receivingUnit,
    order.receiverName,
    isoToSheetSerial(order.dateOut) ?? '',
    order.note,
    fileUrl,
  ];
}

function toShopOrder(
  no: number,
  order: ShopOrderInput,
  fileUrl: string,
): ShopOrder {
  return {
    no,
    from: SOURCE_DEPARTMENT,
    ...order,
    fileUrl,
  };
}

export function createShopOrderRepository(
  dependencies: ShopOrderRepositoryDependencies,
): ShopOrderRepository {
  const {
    sheets,
    drive,
    getAccessToken,
    authenticatedFetch,
    config,
    now = () => new Date(),
    randomId = randomUUID,
  } = dependencies;
  const orderSheet = quoteSheetName(config.sheetName);
  let numericSheetId: number | undefined;

  async function readSuggestion(tabName: string): Promise<string[]> {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: config.spreadsheetId,
      range: `${quoteSheetName(tabName)}!A2:A`,
      valueRenderOption: 'UNFORMATTED_VALUE',
    });
    return uniqueNonEmpty(response.data?.values);
  }

  async function listDepartments(): Promise<string[]> {
    return readSuggestion('DepartmentList');
  }

  async function assertDepartmentAllowed(to: string): Promise<void> {
    const departments = await listDepartments();
    if (!departments.includes(to)) {
      throw new Error('ไม่พบหน่วยงานปลายทางที่เลือก');
    }
  }

  async function readSequenceRows(): Promise<unknown[][]> {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: config.spreadsheetId,
      range: `${orderSheet}!A2:A`,
      valueRenderOption: 'UNFORMATTED_VALUE',
    });
    return response.data?.values ?? [];
  }

  async function locateRow(no: number): Promise<number> {
    if (!Number.isSafeInteger(no) || no < 1) {
      throw new Error('เลขลำดับไม่ถูกต้อง');
    }
    const rows = await readSequenceRows();
    const index = rows.findIndex((row) => parseSequence(row[0]) === no);
    if (index < 0) {
      throw new Error('ไม่พบรายการ Shop Order');
    }
    return index + 2;
  }

  async function readLocatedOrder(no: number): Promise<LocatedOrder> {
    const rowNumber = await locateRow(no);
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: config.spreadsheetId,
      range: `${orderSheet}!A${rowNumber}:K${rowNumber}`,
      valueRenderOption: 'UNFORMATTED_VALUE',
      dateTimeRenderOption: 'SERIAL_NUMBER',
    });
    const row = response.data?.values?.[0];
    if (!row || parseSequence(row[0]) !== no) {
      throw new Error('รายการมีการเปลี่ยนแปลง กรุณาลองใหม่');
    }
    return { rowNumber, order: parseSheetRow(row) };
  }

  async function readLocatedOrderForThumbnail(
    no: number,
  ): Promise<LocatedOrder | null> {
    if (!Number.isSafeInteger(no) || no < 1) return null;
    const rows = await readSequenceRows();
    const index = rows.findIndex((row) => parseSequence(row[0]) === no);
    if (index < 0) return null;

    const rowNumber = index + 2;
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: config.spreadsheetId,
      range: `${orderSheet}!A${rowNumber}:K${rowNumber}`,
      valueRenderOption: 'UNFORMATTED_VALUE',
      dateTimeRenderOption: 'SERIAL_NUMBER',
    });
    const row = response.data?.values?.[0];
    if (!row || parseSequence(row[0]) !== no) return null;
    return { rowNumber, order: parseSheetRow(row) };
  }

  async function resolveNumericSheetId(): Promise<number> {
    if (numericSheetId !== undefined) return numericSheetId;
    const response = await sheets.spreadsheets.get({
      spreadsheetId: config.spreadsheetId,
      fields: 'sheets.properties(sheetId,title)',
    });
    const match = response.data?.sheets?.find(
      (sheet) => sheet.properties?.title === config.sheetName,
    );
    const id = match?.properties?.sheetId;
    if (typeof id !== 'number') {
      throw new Error('ไม่พบชีต Order1');
    }
    numericSheetId = id;
    return id;
  }

  async function formatDateCells(rowNumber: number): Promise<void> {
    const sheetId = await resolveNumericSheetId();
    const format = {
      numberFormat: { type: 'DATE', pattern: 'dd/MM/yyyy' },
    };
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: config.spreadsheetId,
      requestBody: {
        requests: [4, 8].map((columnIndex) => ({
          repeatCell: {
            range: {
              sheetId,
              startRowIndex: rowNumber - 1,
              endRowIndex: rowNumber,
              startColumnIndex: columnIndex,
              endColumnIndex: columnIndex + 1,
            },
            cell: { userEnteredFormat: format },
            fields: 'userEnteredFormat.numberFormat',
          },
        })),
      },
    });
  }

  function rejectedAttachment(): AttachmentFinalizationError {
    return new AttachmentFinalizationError('DRIVE_UPLOAD_REJECTED');
  }

  function pendingProperties(
    upload: VerifiedUpload,
  ): Record<string, string> {
    return {
      status: 'pending',
      pendingSince: upload.appProperties.pendingSince,
      orderNumber: upload.appProperties.orderNumber,
      expectedName: upload.metadata.name,
      expectedMime: upload.metadata.mimeType,
      expectedSize: String(upload.metadata.size),
    };
  }

  function attachmentWarning(): ShopOrderMutationResult['attachment'] {
    return {
      status: 'order_saved_without_attachment',
      code: 'ORDER_SAVED_WITHOUT_ATTACHMENT',
      message:
        'บันทึกออเดอร์แล้ว แต่ไม่สามารถแนบไฟล์ได้ กรุณาแก้ไขรายการเพื่อลองใหม่',
    };
  }

  async function verifyPendingUpload(
    fileId: string,
    requestedOrderNumber: string,
  ): Promise<VerifiedUpload> {
    if (!/^[A-Za-z0-9_-]+$/.test(fileId)) {
      throw rejectedAttachment();
    }
    let metadataResponse: Awaited<
      ReturnType<GoogleDriveClient['files']['get']>
    >;
    try {
      metadataResponse = await drive.files.get({
        fileId,
        fields:
          'id,name,mimeType,size,parents,appProperties,webViewLink,trashed',
      });
    } catch (error) {
      throw new AttachmentFinalizationError(
        classifyDriveOAuthError(error),
      );
    }
    const data = metadataResponse.data ?? {};
    const appProperties = normalizeAppProperties(data.appProperties);
    let expectedMetadata: UploadMetadata;
    try {
      expectedMetadata = assertUploadMetadata({
        name: appProperties.expectedName ?? '',
        mimeType: appProperties.expectedMime ?? '',
        size: Number(appProperties.expectedSize),
      });
    } catch {
      throw rejectedAttachment();
    }
    const parents = Array.isArray(data.parents) ? data.parents : [];
    const actualMetadata = {
      name: safeString(data.name),
      mimeType: safeString(data.mimeType).toLowerCase(),
      size: Number(data.size),
    };
    const lifecycle = parseAttachmentLifecycle(appProperties);

    if (
      data.id !== fileId ||
      data.trashed !== false ||
      !parents.includes(config.folderId) ||
      lifecycle?.status !== 'pending' ||
      lifecycle.orderNumber !== requestedOrderNumber ||
      actualMetadata.name !== expectedMetadata.name ||
      actualMetadata.mimeType !== expectedMetadata.mimeType ||
      actualMetadata.size !== expectedMetadata.size
    ) {
      throw rejectedAttachment();
    }

    let mediaResponse: Response;
    try {
      const accessToken = await getAccessToken();
      mediaResponse = await authenticatedFetch(
        `${GOOGLE_UPLOAD_ORIGIN}/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Range: LEADING_BYTE_RANGE,
          },
        },
      );
    } catch (error) {
      if (error instanceof ShopOrderRepositoryError) {
        const code =
          error.code === 'DRIVE_OAUTH_CONFIGURATION_REQUIRED'
            ? 'DRIVE_UNAVAILABLE'
            : error.code;
        throw new AttachmentFinalizationError(code);
      }
      throw new AttachmentFinalizationError(
        classifyDriveOAuthError(error),
      );
    }
    if (!mediaResponse.ok) {
      throw new AttachmentFinalizationError(
        await classifyUploadResponse(mediaResponse),
      );
    }
    let leadingBytes: Uint8Array;
    try {
      leadingBytes = new Uint8Array(await mediaResponse.arrayBuffer());
    } catch (error) {
      throw new AttachmentFinalizationError(
        classifyDriveOAuthError(error),
      );
    }
    if (!matchesAllowedSignature(expectedMetadata, leadingBytes)) {
      throw rejectedAttachment();
    }

    return {
      fileId,
      metadata: expectedMetadata,
      appProperties,
    };
  }

  async function activateUpload(
    upload: VerifiedUpload,
  ): Promise<ActivatedUpload> {
    let permissionId: string;
    try {
      const permission = await drive.permissions.create({
        fileId: upload.fileId,
        fields: 'id',
        requestBody: { type: 'anyone', role: 'reader' },
      });
      permissionId = safeString(permission.data?.id);
      if (!permissionId) {
        throw rejectedAttachment();
      }
    } catch (error) {
      if (error instanceof AttachmentFinalizationError) throw error;
      throw new AttachmentFinalizationError(
        classifyDriveOAuthError(error),
      );
    }

    let finalized: Awaited<
      ReturnType<GoogleDriveClient['files']['update']>
    >;
    try {
      finalized = await drive.files.update({
        fileId: upload.fileId,
        fields: 'id,webViewLink',
        requestBody: {
          appProperties: {
            status: 'active',
            finalizedAt: now().toISOString(),
            orderNumber: upload.appProperties.orderNumber,
            expectedName: upload.metadata.name,
            expectedMime: upload.metadata.mimeType,
            expectedSize: String(upload.metadata.size),
          },
        },
      });
    } catch (error) {
      await restorePendingUpload({ ...upload, permissionId });
      throw new AttachmentFinalizationError(
        classifyDriveOAuthError(error),
      );
    }
    const webViewLink = safeString(finalized.data?.webViewLink);
    let parsedLink: URL;
    try {
      parsedLink = new URL(webViewLink);
    } catch {
      await restorePendingUpload({ ...upload, permissionId });
      throw rejectedAttachment();
    }
    if (
      parsedLink.protocol !== 'https:' ||
      parsedLink.hostname !== 'drive.google.com' ||
      parsedLink.pathname !== `/file/d/${upload.fileId}/view` ||
      parsedLink.username ||
      parsedLink.password ||
      parsedLink.port
    ) {
      await restorePendingUpload({ ...upload, permissionId });
      throw rejectedAttachment();
    }
    return {
      ...upload,
      permissionId,
      webViewLink,
    };
  }

  async function finalizeUpload(
    fileId: string,
    requestedOrderNumber: string,
  ): Promise<ActivatedUpload> {
    return activateUpload(
      await verifyPendingUpload(fileId, requestedOrderNumber),
    );
  }

  async function restorePendingUpload(
    upload: CompensatableUpload,
  ): Promise<void> {
    try {
      await drive.files.update({
        fileId: upload.fileId,
        fields: 'id',
        requestBody: {
          appProperties: pendingProperties(upload),
        },
      });
    } catch {
      // Compensation must not replace the original Sheet failure.
    }
    try {
      await drive.permissions.delete({
        fileId: upload.fileId,
        permissionId: upload.permissionId,
      });
    } catch {
      // Compensation must not replace the original Sheet failure.
    }
  }

  async function scheduleOwnedAttachmentDeletion(
    fileUrl: string,
    orderNumber: string,
    reason: 'replaced' | 'order_deleted',
  ): Promise<void> {
    const fileId = driveFileIdFromCanonicalUrl(fileUrl);
    if (!fileId) return;

    try {
      const response = await drive.files.get({
        fileId,
        fields: 'id,parents,appProperties,trashed',
      });
      const data = response.data ?? {};
      const parents = Array.isArray(data.parents) ? data.parents : [];
      const lifecycle = parseAttachmentLifecycle(
        normalizeAppProperties(data.appProperties),
      );
      if (
        data.id !== fileId ||
        data.trashed !== false ||
        !parents.includes(config.folderId) ||
        lifecycle?.status !== 'active' ||
        lifecycle.orderNumber !== orderNumber
      ) {
        return;
      }

      await drive.files.update({
        fileId,
        fields: 'id',
        requestBody: {
          appProperties: {
            status: 'scheduled_delete',
            deleteAfter: deletionDate(now()),
            orderNumber,
            reason,
          },
        },
      });
    } catch {
      // Attachment retirement is best-effort after the Sheet mutation succeeds.
    }
  }

  async function createUploadSession(
    request: UploadSessionRequest,
  ): Promise<UploadSession> {
    const safeMetadata = assertUploadMetadata(request);
    const sessionCreatedAt = now();
    const storageName = buildAttachmentStorageName(
      { ...safeMetadata, orderNumber: request.orderNumber },
      sessionCreatedAt,
      randomId().replaceAll('-', '').slice(0, 8),
    );
    const generated = await drive.files.generateIds({
      count: 1,
      space: 'drive',
      type: 'files',
    });
    const fileId = generated.data?.ids?.[0];
    if (!fileId) {
      throw new Error('Google Drive did not return a file ID');
    }
    const accessToken = await getAccessToken();
    const response = await authenticatedFetch(
      `${GOOGLE_UPLOAD_ORIGIN}/upload/drive/v3/files?uploadType=resumable&fields=id,webViewLink`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
          'X-Upload-Content-Type': safeMetadata.mimeType,
          'X-Upload-Content-Length': String(safeMetadata.size),
        },
        body: JSON.stringify({
          id: fileId,
          name: storageName,
          parents: [config.folderId],
          appProperties: {
            status: 'pending',
            pendingSince: sessionCreatedAt.toISOString(),
            orderNumber: request.orderNumber,
            expectedName: storageName,
            expectedMime: safeMetadata.mimeType,
            expectedSize: String(safeMetadata.size),
          },
        }),
      },
    );
    if (!response.ok) {
      const code = await classifyUploadResponse(response);
      throw new ShopOrderRepositoryError(
        code,
        DRIVE_FAILURE_MESSAGES[code],
      );
    }
    const uploadUrl = assertGoogleUploadUrl(response.headers.get('location'));
    return {
      fileId,
      uploadUrl,
      expiresAt: new Date(
        sessionCreatedAt.getTime() + SESSION_LIFETIME_MS,
      ).toISOString(),
    };
  }

  async function getAttachmentThumbnail(
    no: number,
  ): Promise<{ bytes: Uint8Array; contentType: string } | null> {
    const current = await readLocatedOrderForThumbnail(no);
    if (!current) return null;

    const fileId = driveFileIdFromCanonicalUrl(current.order.fileUrl);
    if (!fileId) return null;

    let metadataResponse: Awaited<
      ReturnType<GoogleDriveClient['files']['get']>
    >;
    try {
      metadataResponse = await drive.files.get({
        fileId,
        fields:
          'id,mimeType,parents,appProperties,thumbnailLink,trashed',
      });
    } catch (error) {
      if (isDriveNotFound(error)) return null;
      throw error;
    }

    const metadata = metadataResponse.data ?? {};
    const parents = Array.isArray(metadata.parents)
      ? metadata.parents
      : [];
    const mimeType = safeString(metadata.mimeType).toLowerCase();
    const lifecycle = parseAttachmentLifecycle(
      normalizeAppProperties(metadata.appProperties),
    );
    const thumbnailUrl = safeGoogleThumbnailUrl(metadata.thumbnailLink);
    if (
      metadata.id !== fileId ||
      metadata.trashed !== false ||
      !parents.includes(config.folderId) ||
      lifecycle?.status !== 'active' ||
      lifecycle.orderNumber !== current.order.number ||
      !SUPPORTED_ATTACHMENT_MIME_TYPES.has(mimeType) ||
      !thumbnailUrl
    ) {
      return null;
    }

    const accessToken = await getAccessToken();
    const response = await authenticatedFetch(thumbnailUrl, {
      method: 'GET',
      redirect: 'error',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) return null;

    const contentType = response.headers
      .get('Content-Type')
      ?.split(';', 1)[0]
      .trim()
      .toLowerCase();
    if (!contentType || !SAFE_THUMBNAIL_MIME_TYPES.has(contentType)) {
      return null;
    }

    const contentLength = Number(response.headers.get('Content-Length'));
    if (
      Number.isFinite(contentLength) &&
      contentLength > MAX_THUMBNAIL_BYTES
    ) {
      try {
        await response.body?.cancel();
      } catch {
        // The response is rejected regardless of cancellation outcome.
      }
      return null;
    }

    const bytes = await readThumbnailBytes(response);
    if (!bytes) return null;
    return { bytes, contentType };
  }

  async function load(): Promise<ShopOrderBootstrap> {
    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: config.spreadsheetId,
      ranges: [
        `${orderSheet}!A2:K`,
        `${quoteSheetName('DepartmentList')}!A2:A`,
        `${quoteSheetName('ReceiverList')}!A2:A`,
      ],
      valueRenderOption: 'UNFORMATTED_VALUE',
      dateTimeRenderOption: 'SERIAL_NUMBER',
    });
    const ranges = response.data?.valueRanges ?? [];
    const orders: ShopOrder[] = [];
    for (const row of ranges[0]?.values ?? []) {
      if (row.some((cell) => cell !== '' && cell !== null && cell !== undefined)) {
        const parsed = parseSheetRow(row);
        if (parsed.no > 0) orders.push(parsed);
      }
    }
    return {
      orders,
      departments: uniqueNonEmpty(ranges[1]?.values),
      receivers: uniqueNonEmpty(ranges[2]?.values),
      generatedAt: now().toISOString(),
    };
  }

  async function create(
    input: ShopOrderInput,
    uploadedFileId?: string,
  ): Promise<ShopOrderMutationResult> {
    const order = normalizeOrderInput(input);
    await assertDepartmentAllowed(order.to);
    let activatedUpload: ActivatedUpload | undefined;
    let attachment: ShopOrderMutationResult['attachment'] = {
      status: 'none',
    };
    if (uploadedFileId) {
      try {
        activatedUpload = await finalizeUpload(
          uploadedFileId,
          order.number,
        );
        attachment = {
          status: 'attached',
          fileId: activatedUpload.fileId,
          fileUrl: activatedUpload.webViewLink,
        };
      } catch (error) {
        if (!(error instanceof AttachmentFinalizationError)) throw error;
        attachment = attachmentWarning();
      }
    }
    const fileUrl = activatedUpload?.webViewLink ?? '';
    try {
      const appended = await sheets.spreadsheets.values.append({
        spreadsheetId: config.spreadsheetId,
        range: `${orderSheet}!A:K`,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        includeValuesInResponse: false,
        requestBody: { values: [['', ...serializeOrder(order, fileUrl)]] },
      });
      const rowNumber = parseUpdatedRow(
        appended.data?.updates?.updatedRange,
      );
      const no = rowNumber - 1;
      await sheets.spreadsheets.values.update({
        spreadsheetId: config.spreadsheetId,
        range: `${orderSheet}!A${rowNumber}`,
        valueInputOption: 'RAW',
        requestBody: { values: [[no]] },
      });
      await formatDateCells(rowNumber);
      return {
        order: toShopOrder(no, order, fileUrl),
        attachment,
      };
    } catch (error) {
      if (activatedUpload) {
        await restorePendingUpload(activatedUpload);
      }
      throw error;
    }
  }

  async function update(
    no: number,
    input: ShopOrderInput,
    uploadedFileId?: string,
  ): Promise<ShopOrderMutationResult> {
    const order = normalizeOrderInput(input);
    await assertDepartmentAllowed(order.to);
    const current = await readLocatedOrder(no);
    let activatedUpload: ActivatedUpload | undefined;
    let attachment: ShopOrderMutationResult['attachment'] = {
      status: 'none',
    };
    if (uploadedFileId) {
      try {
        activatedUpload = await finalizeUpload(
          uploadedFileId,
          order.number,
        );
        attachment = {
          status: 'attached',
          fileId: activatedUpload.fileId,
          fileUrl: activatedUpload.webViewLink,
        };
      } catch (error) {
        if (!(error instanceof AttachmentFinalizationError)) throw error;
        attachment = attachmentWarning();
      }
    }
    const fileUrl =
      activatedUpload?.webViewLink ?? current.order.fileUrl;
    try {
      const rowNumber = await locateRow(no);
      if (rowNumber !== current.rowNumber) {
        throw new Error('รายการมีการเปลี่ยนแปลง กรุณาลองใหม่');
      }
      await sheets.spreadsheets.values.update({
        spreadsheetId: config.spreadsheetId,
        range: `${orderSheet}!B${rowNumber}:K${rowNumber}`,
        valueInputOption: 'RAW',
        requestBody: { values: [serializeOrder(order, fileUrl)] },
      });
      await formatDateCells(rowNumber);
      if (activatedUpload) {
        await scheduleOwnedAttachmentDeletion(
          current.order.fileUrl,
          current.order.number,
          'replaced',
        );
      }
      return {
        order: toShopOrder(no, order, fileUrl),
        attachment,
      };
    } catch (error) {
      if (activatedUpload) {
        await restorePendingUpload(activatedUpload);
      }
      throw error;
    }
  }

  async function remove(no: number): Promise<void> {
    const current = await readLocatedOrder(no);
    const rowNumber = await locateRow(no);
    if (rowNumber !== current.rowNumber) {
      throw new Error('รายการมีการเปลี่ยนแปลง กรุณาลองใหม่');
    }
    await sheets.spreadsheets.values.clear({
      spreadsheetId: config.spreadsheetId,
      range: `${orderSheet}!A${rowNumber}:K${rowNumber}`,
      requestBody: {},
    });
    await scheduleOwnedAttachmentDeletion(
      current.order.fileUrl,
      current.order.number,
      'order_deleted',
    );
  }

  async function cleanupAttachments(): Promise<AttachmentCleanupSummary> {
    const summary: AttachmentCleanupSummary = {
      inspected: 0,
      trashed: 0,
      skipped: 0,
      failed: 0,
    };
    const cleanupStartedAt = now();

    for (const status of ['pending', 'scheduled_delete'] as const) {
      let pageToken: string | undefined;
      do {
        const response = await drive.files.list({
          q: `'${config.folderId}' in parents and trashed = false and appProperties has { key='status' and value='${status}' }`,
          fields: 'nextPageToken,files(id,trashed,appProperties)',
          pageSize: 1000,
          ...(pageToken ? { pageToken } : {}),
        });

        for (const file of response.data?.files ?? []) {
          summary.inspected += 1;
          const fileId = safeString(file.id);
          const lifecycle = parseAttachmentLifecycle(
            normalizeAppProperties(file.appProperties),
          );
          const expired =
            lifecycle?.status === 'pending'
              ? isExpiredPending(lifecycle.pendingSince, cleanupStartedAt)
              : lifecycle?.status === 'scheduled_delete'
                ? Date.parse(lifecycle.deleteAfter) <= cleanupStartedAt.getTime()
                : false;

          if (!fileId || file.trashed === true || !expired) {
            summary.skipped += 1;
            continue;
          }

          try {
            await drive.files.update({
              fileId,
              fields: 'id,trashed',
              requestBody: { trashed: true },
            });
            summary.trashed += 1;
          } catch (error) {
            if (isDriveNotFound(error)) {
              summary.skipped += 1;
            } else {
              summary.failed += 1;
            }
          }
        }

        pageToken = safeString(response.data?.nextPageToken) || undefined;
      } while (pageToken);
    }

    return summary;
  }

  return {
    load,
    listDepartments,
    create,
    update,
    remove,
    createUploadSession,
    getAttachmentThumbnail,
    cleanupAttachments,
  };
}

function requiredEnvironment(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function normalizePrivateKey(value: string): string {
  let normalized = value.trim();
  if (
    normalized.length >= 2 &&
    normalized.startsWith('"') &&
    normalized.endsWith('"')
  ) {
    normalized = normalized.slice(1, -1);
  }
  normalized = normalized.replace(/\\n/g, '\n');
  const beginMarker = '-----BEGIN PRIVATE KEY-----';
  const endMarker = '-----END PRIVATE KEY-----';
  const begin = normalized.indexOf(beginMarker);
  const end = normalized.indexOf(endMarker, Math.max(0, begin));
  if (begin >= 0 && end >= begin) {
    normalized = normalized.slice(begin, end + endMarker.length);
  }
  return normalized;
}

let defaultRepositoryPromise: Promise<ShopOrderRepository> | undefined;

async function createDefaultRepository(): Promise<ShopOrderRepository> {
  const clientEmail = requiredEnvironment('GOOGLE_CLIENT_EMAIL');
  const privateKey = normalizePrivateKey(
    requiredEnvironment('GOOGLE_PRIVATE_KEY'),
  );
  const spreadsheetId = requiredEnvironment('SHOP_ORDER_SHEET_ID');
  const sheetName = requiredEnvironment('SHOP_ORDER_SHEET_NAME');
  const folderId = requiredEnvironment('SHOP_ORDER_DRIVE_FOLDER_ID');
  const { google } = await import('googleapis');
  const sheetAuth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: [GOOGLE_SHEETS_SCOPE],
  });
  let driveOAuthEnvironment: DriveOAuthEnvironment;
  try {
    driveOAuthEnvironment = readDriveOAuthEnvironment(process.env);
  } catch {
    throw new ShopOrderRepositoryError(
      'DRIVE_OAUTH_CONFIGURATION_REQUIRED',
      'การตั้งค่า Google Drive OAuth ไม่ครบ กรุณาติดต่อผู้ดูแลระบบ',
    );
  }
  const driveAuth = createDriveOAuthClient(
    google,
    driveOAuthEnvironment,
  );
  const sheets = google.sheets({ version: 'v4', auth: sheetAuth });
  const drive = google.drive({ version: 'v3', auth: driveAuth });

  return createShopOrderRepository({
    // The narrow structural boundary keeps tests independent from Google types.
    sheets: sheets as unknown as GoogleSheetsClient,
    drive: drive as unknown as GoogleDriveClient,
    getAccessToken: async () => {
      try {
        const response = await driveAuth.getAccessToken();
        const token =
          typeof response === 'string' ? response : response?.token;
        if (!token) {
          throw new ShopOrderRepositoryError(
            'DRIVE_OAUTH_REAUTH_REQUIRED',
            'Google Drive OAuth authorization is required',
          );
        }
        return token;
      } catch (error) {
        if (error instanceof ShopOrderRepositoryError) throw error;
        throw new ShopOrderRepositoryError(
          classifyDriveOAuthError(error),
          'Google Drive authentication failed',
        );
      }
    },
    authenticatedFetch: fetch,
    config: { spreadsheetId, sheetName, folderId },
  });
}

export function getShopOrderRepository(): Promise<ShopOrderRepository> {
  defaultRepositoryPromise ??= createDefaultRepository();
  return defaultRepositoryPromise;
}
