import type { UploadSessionRequest } from './types';

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

const ORDER_NUMBER_PATTERN = /^\d{6}$/;
const SHORT_ID_PATTERN = /^[a-z0-9]{8}$/;
const DRIVE_FILE_ID_PATTERN = /^[A-Za-z0-9_-]+$/;

const EXTENSION_BY_MIME_TYPE: Readonly<Record<string, string>> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const ACCEPTED_EXTENSIONS_BY_MIME_TYPE: Readonly<Record<string, string[]>> = {
  'application/pdf': ['pdf'],
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp'],
};

function isCanonicalTimestamp(value: string): boolean {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString() === value;
}

function extensionFromName(name: string): string {
  const finalDot = name.lastIndexOf('.');
  return finalDot >= 0 ? name.slice(finalDot + 1).toLowerCase() : '';
}

export function buildAttachmentStorageName(
  request: UploadSessionRequest,
  now: Date,
  shortId?: string,
): string {
  if (!ORDER_NUMBER_PATTERN.test(request.orderNumber)) {
    throw new Error('เลข Shop Order ต้องเป็นตัวเลข 6 หลัก');
  }
  if (shortId !== undefined && !SHORT_ID_PATTERN.test(shortId)) {
    throw new Error('Short ID ไม่ถูกต้อง');
  }

  const extension = EXTENSION_BY_MIME_TYPE[request.mimeType];
  const acceptedExtensions = ACCEPTED_EXTENSIONS_BY_MIME_TYPE[request.mimeType];
  if (
    !extension ||
    !acceptedExtensions.includes(extensionFromName(request.name))
  ) {
    throw new Error('ชนิดไฟล์ไม่ถูกต้อง');
  }

  const date = now.toISOString().slice(0, 10).replaceAll('-', '');

  return `shoporder-${date}-${request.orderNumber}.${extension}`;
}

export function parseAttachmentLifecycle(
  properties: Record<string, string>,
): AttachmentLifecycle | null {
  if (!ORDER_NUMBER_PATTERN.test(properties.orderNumber ?? '')) {
    return null;
  }

  if (
    properties.status === 'pending' &&
    isCanonicalTimestamp(properties.pendingSince ?? '')
  ) {
    return {
      status: 'pending',
      pendingSince: properties.pendingSince,
      orderNumber: properties.orderNumber,
    };
  }

  if (
    properties.status === 'active' &&
    isCanonicalTimestamp(properties.finalizedAt ?? '')
  ) {
    return {
      status: 'active',
      finalizedAt: properties.finalizedAt,
      orderNumber: properties.orderNumber,
    };
  }

  if (
    properties.status === 'scheduled_delete' &&
    isCanonicalTimestamp(properties.deleteAfter ?? '') &&
    (properties.reason === 'replaced' ||
      properties.reason === 'order_deleted')
  ) {
    return {
      status: 'scheduled_delete',
      deleteAfter: properties.deleteAfter,
      orderNumber: properties.orderNumber,
      reason: properties.reason,
    };
  }

  return null;
}

export function isExpiredPending(pendingSince: string, now: Date): boolean {
  if (!isCanonicalTimestamp(pendingSince) || !Number.isFinite(now.getTime())) {
    return false;
  }

  return now.getTime() - Date.parse(pendingSince) >= PENDING_TTL_MS;
}

export function deletionDate(now: Date): string {
  return new Date(now.getTime() + DELETE_DELAY_MS).toISOString();
}

export function driveFileIdFromCanonicalUrl(url: string): string | null {
  try {
    const parsedUrl = new URL(url);
    const match = parsedUrl.pathname.match(/^\/file\/d\/([^/]+)\/view$/);
    const fileId = match?.[1] ?? '';

    if (
      parsedUrl.protocol !== 'https:' ||
      parsedUrl.hostname !== 'drive.google.com' ||
      parsedUrl.port ||
      parsedUrl.username ||
      parsedUrl.password ||
      !DRIVE_FILE_ID_PATTERN.test(fileId)
    ) {
      return null;
    }

    return fileId;
  } catch {
    return null;
  }
}

export function driveFilePreviewUrlFromCanonicalUrl(
  url: string,
): string | null {
  const fileId = driveFileIdFromCanonicalUrl(url);
  return fileId
    ? `https://drive.google.com/uc?export=view&id=${encodeURIComponent(fileId)}`
    : null;
}
