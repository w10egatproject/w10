import { assertUploadMetadata } from '@/lib/shop-order/file-rules';
import { getShopOrderRepository } from '@/lib/shop-order/repository';
import type { UploadMetadata } from '@/lib/shop-order/types';
import {
  internalError,
  jsonError,
  jsonSuccess,
  parseJsonObject,
  rejectCrossOrigin,
} from '../http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
): UploadMetadata | null {
  if (
    typeof body.name !== 'string' ||
    typeof body.mimeType !== 'string' ||
    typeof body.size !== 'number'
  ) {
    return null;
  }

  try {
    return assertUploadMetadata({
      name: body.name,
      mimeType: body.mimeType,
      size: body.size,
    });
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
    if (hasErrorCode(error, 'DRIVE_ACCESS_FORBIDDEN')) {
      return jsonError(
        'DRIVE_CONFIGURATION_REQUIRED',
        'ระบบยังเชื่อมต่อ Google Drive ไม่ได้ กรุณาเปิด Google Drive API และแชร์โฟลเดอร์ให้ Service Account เป็น Editor',
        503,
      );
    }
    return internalError('create_upload_session');
  }
}
