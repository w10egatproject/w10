import { randomUUID } from 'node:crypto';

import { buildAttachmentStorageName } from './attachment-lifecycle';
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
  ShopOrder,
  ShopOrderBootstrap,
  ShopOrderInput,
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
    update(request: JsonRecord): Promise<{ data?: JsonRecord }>;
  };
  permissions: {
    create(request: JsonRecord): Promise<unknown>;
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
  create(order: ShopOrderInput, uploadedFileId?: string): Promise<ShopOrder>;
  update(
    no: number,
    order: ShopOrderInput,
    uploadedFileId?: string,
  ): Promise<ShopOrder>;
  remove(no: number): Promise<void>;
  createUploadSession(request: UploadSessionRequest): Promise<UploadSession>;
}

interface LocatedOrder {
  rowNumber: number;
  order: ShopOrder;
}

interface VerifiedUpload {
  fileId: string;
  metadata: UploadMetadata;
  webViewLink: string;
  appProperties: Record<string, string>;
}

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

  async function verifyAndFinalizeUpload(
    fileId: string,
  ): Promise<VerifiedUpload> {
    if (!fileId || typeof fileId !== 'string') {
      throw new Error('รหัสไฟล์ไม่ถูกต้อง');
    }
    const metadataResponse = await drive.files.get({
      fileId,
      fields:
        'id,name,mimeType,size,parents,appProperties,webViewLink,trashed',
    });
    const data = metadataResponse.data ?? {};
    const appProperties = normalizeAppProperties(data.appProperties);
    const expectedMetadata = assertUploadMetadata({
      name: appProperties.expectedName ?? '',
      mimeType: appProperties.expectedMime ?? '',
      size: Number(appProperties.expectedSize),
    });
    const parents = Array.isArray(data.parents) ? data.parents : [];
    const actualMetadata = {
      name: safeString(data.name),
      mimeType: safeString(data.mimeType).toLowerCase(),
      size: Number(data.size),
    };

    if (
      data.id !== fileId ||
      data.trashed !== false ||
      !parents.includes(config.folderId) ||
      appProperties.shopOrderUpload !== 'pending' ||
      actualMetadata.name !== expectedMetadata.name ||
      actualMetadata.mimeType !== expectedMetadata.mimeType ||
      actualMetadata.size !== expectedMetadata.size
    ) {
      throw new Error('ข้อมูลไฟล์อัปโหลดไม่ตรงกับที่อนุญาต');
    }

    const accessToken = await getAccessToken();
    const mediaResponse = await authenticatedFetch(
      `${GOOGLE_UPLOAD_ORIGIN}/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Range: LEADING_BYTE_RANGE,
        },
      },
    );
    if (!mediaResponse.ok) {
      throw new Error('ไม่สามารถตรวจสอบไฟล์อัปโหลดได้');
    }
    const leadingBytes = new Uint8Array(await mediaResponse.arrayBuffer());
    if (!matchesAllowedSignature(expectedMetadata, leadingBytes)) {
      throw new Error('Uploaded file signature is not allowed');
    }

    await drive.permissions.create({
      fileId,
      requestBody: { type: 'anyone', role: 'reader' },
    });
    const finalized = await drive.files.update({
      fileId,
      fields: 'webViewLink',
      requestBody: {
        appProperties: {
          shopOrderUpload: 'finalized',
          expectedName: expectedMetadata.name,
          expectedMime: expectedMetadata.mimeType,
          expectedSize: String(expectedMetadata.size),
        },
      },
    });
    const webViewLink = safeString(finalized.data?.webViewLink);
    if (!webViewLink.startsWith('https://drive.google.com/')) {
      throw new Error('Google Drive did not return a public file link');
    }
    return {
      fileId,
      metadata: expectedMetadata,
      webViewLink,
      appProperties,
    };
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
  ): Promise<ShopOrder> {
    const order = normalizeOrderInput(input);
    await assertDepartmentAllowed(order.to);
    const fileUrl = uploadedFileId
      ? (await verifyAndFinalizeUpload(uploadedFileId)).webViewLink
      : '';
    const appended = await sheets.spreadsheets.values.append({
      spreadsheetId: config.spreadsheetId,
      range: `${orderSheet}!A:K`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      includeValuesInResponse: false,
      requestBody: { values: [['', ...serializeOrder(order, fileUrl)]] },
    });
    const rowNumber = parseUpdatedRow(appended.data?.updates?.updatedRange);
    const no = rowNumber - 1;
    await sheets.spreadsheets.values.update({
      spreadsheetId: config.spreadsheetId,
      range: `${orderSheet}!A${rowNumber}`,
      valueInputOption: 'RAW',
      requestBody: { values: [[no]] },
    });
    await formatDateCells(rowNumber);
    return toShopOrder(no, order, fileUrl);
  }

  async function update(
    no: number,
    input: ShopOrderInput,
    uploadedFileId?: string,
  ): Promise<ShopOrder> {
    const order = normalizeOrderInput(input);
    await assertDepartmentAllowed(order.to);
    const current = await readLocatedOrder(no);
    const fileUrl = uploadedFileId
      ? (await verifyAndFinalizeUpload(uploadedFileId)).webViewLink
      : current.order.fileUrl;
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
    return toShopOrder(no, order, fileUrl);
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
  }

  return {
    load,
    listDepartments,
    create,
    update,
    remove,
    createUploadSession,
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
