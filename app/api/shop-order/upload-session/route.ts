import { assertUploadMetadata } from '@/lib/shop-order/file-rules';
import { getShopOrderRepository } from '@/lib/shop-order/repository';
import type { UploadSessionRequest } from '@/lib/shop-order/types';
import {
  internalError,
  jsonError,
  jsonSuccess,
  parseJsonObject,
  rejectCrossOrigin,
} from '../http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SAFE_DRIVE_ERRORS: Readonly<
  Record<string, { code: string; message: string }>
> = {
  DRIVE_OAUTH_CONFIGURATION_REQUIRED: {
    code: 'DRIVE_OAUTH_CONFIGURATION_REQUIRED',
    message:
      'การตั้งค่า Google Drive OAuth ไม่ครบ กรุณาติดต่อผู้ดูแลระบบ',
  },
  DRIVE_OAUTH_REAUTH_REQUIRED: {
    code: 'DRIVE_OAUTH_REAUTH_REQUIRED',
    message:
      'การเชื่อมต่อ Google Drive หมดอายุ กรุณาเชื่อมต่อบัญชีใหม่',
  },
  DRIVE_FOLDER_CONFIGURATION_REQUIRED: {
    code: 'DRIVE_FOLDER_CONFIGURATION_REQUIRED',
    message:
      'ไม่พบโฟลเดอร์ Google Drive ที่กำหนด กรุณาตรวจสอบการตั้งค่าโฟลเดอร์',
  },
  DRIVE_ACCESS_FORBIDDEN: {
    code: 'DRIVE_FOLDER_CONFIGURATION_REQUIRED',
    message:
      'ไม่พบโฟลเดอร์ Google Drive ที่กำหนด กรุณาตรวจสอบการตั้งค่าโฟลเดอร์',
  },
  DRIVE_QUOTA_EXCEEDED: {
    code: 'DRIVE_QUOTA_EXCEEDED',
    message:
      'พื้นที่จัดเก็บหรือโควตา Google Drive เต็ม กรุณาติดต่อผู้ดูแลระบบ',
  },
  DRIVE_UNAVAILABLE: {
    code: 'DRIVE_UNAVAILABLE',
    message:
      'Google Drive ไม่พร้อมใช้งานชั่วคราว กรุณาลองใหม่ภายหลัง',
  },
};

function hasErrorCode(
  error: unknown,
  code: string,
): error is Error & { code: string } {
  return (
    error instanceof Error &&
    'code' in error &&
    error.code === code
  );
}

function readUploadMetadata(
  body: Record<string, unknown>,
): UploadSessionRequest | null {
  if (
    typeof body.orderNumber !== 'string' ||
    !/^\d{6}$/.test(body.orderNumber) ||
    typeof body.name !== 'string' ||
    typeof body.mimeType !== 'string' ||
    typeof body.size !== 'number'
  ) {
    return null;
  }

  try {
    const metadata = assertUploadMetadata({
      name: body.name,
      mimeType: body.mimeType,
      size: body.size,
    });
    return {
      orderNumber: body.orderNumber,
      ...metadata,
    };
  } catch {
    return null;
  }
}

export async function POST(request: Request): Promise<Response> {
  const originError = rejectCrossOrigin(request);
  if (originError) return originError;

  const parsed = await parseJsonObject(request);
  if (!parsed.ok) return parsed.response;
  const metadata = readUploadMetadata(parsed.value);
  if (!metadata) {
    return jsonError(
      'INVALID_UPLOAD_METADATA',
      'ข้อมูลไฟล์ไม่ถูกต้องหรือไฟล์มีขนาดเกิน 10 MB',
      400,
    );
  }

  try {
    const repository = await getShopOrderRepository();
    return jsonSuccess(
      await repository.createUploadSession(metadata),
      201,
    );
  } catch (error) {
    const matched = Object.keys(SAFE_DRIVE_ERRORS).find((code) =>
      hasErrorCode(error, code));
    if (matched) {
      const safeError = SAFE_DRIVE_ERRORS[matched];
      return jsonError(safeError.code, safeError.message, 503);
    }
    return internalError('create_upload_session');
  }
}
