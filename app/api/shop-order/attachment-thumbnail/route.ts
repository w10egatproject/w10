import { getShopOrderRepository } from '@/lib/shop-order/repository';
import { internalError, jsonError } from '../http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const THUMBNAIL_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
  'X-Content-Type-Options': 'nosniff',
  'Content-Security-Policy': "default-src 'none'",
} as const;

function parseSequence(request: Request): number | null {
  const values = new URL(request.url).searchParams.getAll('no');
  if (values.length !== 1 || !/^[1-9]\d*$/.test(values[0])) return null;
  const no = Number(values[0]);
  return Number.isSafeInteger(no) ? no : null;
}

export async function GET(request: Request): Promise<Response> {
  const no = parseSequence(request);
  if (no === null) {
    return jsonError(
      'VALIDATION_ERROR',
      'เลขลำดับ Shop Order ไม่ถูกต้อง',
      400,
    );
  }

  try {
    const repository = await getShopOrderRepository();
    const thumbnail = await repository.getAttachmentThumbnail(no);
    if (!thumbnail) {
      return jsonError(
        'THUMBNAIL_NOT_FOUND',
        'ไม่พบรูปตัวอย่างไฟล์แนบ',
        404,
      );
    }

    return new Response(new Uint8Array(thumbnail.bytes), {
      status: 200,
      headers: {
        ...THUMBNAIL_HEADERS,
        'Content-Type': thumbnail.contentType,
      },
    });
  } catch {
    return internalError('attachment_thumbnail');
  }
}
