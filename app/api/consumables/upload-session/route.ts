import { extractDriveFolderId } from '@/lib/utils/drive-images';
import { assertUploadMetadata } from '@/lib/shop-order/file-rules';
import { getShopOrderRepository } from '@/lib/shop-order/repository';
import type { UploadSessionRequest } from '@/lib/shop-order/types';
import {
  internalError,
  jsonError,
  jsonSuccess,
  parseJsonObject,
  rejectCrossOrigin,
} from '@/app/api/shop-order/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function readUploadMetadata(
  body: Record<string, unknown>,
): UploadSessionRequest | null {
  if (
    typeof body.name !== 'string' ||
    typeof body.mimeType !== 'string' ||
    typeof body.size !== 'number'
  ) {
    return null;
  }

  const orderNumber =
    typeof body.orderNumber === 'string' && body.orderNumber.length > 0
      ? body.orderNumber
      : 'CONSUMABLE';

  try {
    const metadata = assertUploadMetadata({
      name: body.name,
      mimeType: body.mimeType,
      size: body.size,
    });
    return {
      orderNumber,
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
    const folderId = extractDriveFolderId(process.env.CONSUMABLES_DRIVE_FOLDER_ID) || undefined;
    return jsonSuccess(await repository.createUploadSession(metadata, folderId), 201);
  } catch (error) {
    console.error('Error creating consumable upload session:', error);
    return internalError('create_consumable_upload_session');
  }
}
