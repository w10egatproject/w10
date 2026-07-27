import { timingSafeEqual } from 'node:crypto';

import { getShopOrderRepository } from '@/lib/shop-order/repository';
import { internalError, jsonError, jsonSuccess } from '../http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isValidCronAuthorization(
  authorization: string | null,
  secret: string | undefined,
): boolean {
  if (!authorization || !secret) return false;

  const actual = Buffer.from(authorization, 'utf8');
  const expected = Buffer.from(`Bearer ${secret}`, 'utf8');
  return (
    actual.byteLength === expected.byteLength &&
    timingSafeEqual(actual, expected)
  );
}

export async function GET(request: Request): Promise<Response> {
  if (
    !isValidCronAuthorization(
      request.headers.get('authorization'),
      process.env.SHOP_ORDER_CRON_SECRET,
    )
  ) {
    return jsonError('UNAUTHORIZED', 'ไม่ได้รับอนุญาต', 401);
  }

  try {
    const repository = await getShopOrderRepository();
    return jsonSuccess(await repository.cleanupAttachments());
  } catch {
    return internalError('shop_order_attachment_cleanup');
  }
}
