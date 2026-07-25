import { randomUUID } from 'node:crypto';
import type { ApiResult } from '@/lib/shop-order/types';

export const noStoreHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
} as const;

type JsonObject = Record<string, unknown>;

type ParsedJson =
  | { ok: true; value: JsonObject }
  | { ok: false; response: Response };

export function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function jsonSuccess<T>(data: T, status = 200): Response {
  return Response.json(
    { ok: true, data } satisfies ApiResult<T>,
    { status, headers: noStoreHeaders },
  );
}

export function jsonError(
  code: string,
  message: string,
  status: number,
): Response {
  return Response.json(
    { ok: false, error: { code, message } } satisfies ApiResult<never>,
    { status, headers: noStoreHeaders },
  );
}

export function rejectCrossOrigin(request: Request): Response | null {
  const origin = request.headers.get('Origin');
  if (!origin) return null;

  let requestOrigin: string;
  try {
    requestOrigin = new URL(request.url).origin;
  } catch {
    return jsonError(
      'ORIGIN_NOT_ALLOWED',
      'ไม่อนุญาตให้ส่งข้อมูลจากเว็บไซต์อื่น',
      403,
    );
  }

  return origin === requestOrigin
    ? null
    : jsonError(
        'ORIGIN_NOT_ALLOWED',
        'ไม่อนุญาตให้ส่งข้อมูลจากเว็บไซต์อื่น',
        403,
      );
}

export async function parseJsonObject(request: Request): Promise<ParsedJson> {
  const mediaType = request.headers
    .get('Content-Type')
    ?.split(';', 1)[0]
    .trim()
    .toLowerCase();
  if (mediaType !== 'application/json') {
    return {
      ok: false,
      response: jsonError(
        'UNSUPPORTED_MEDIA_TYPE',
        'รองรับเฉพาะข้อมูล JSON',
        415,
      ),
    };
  }

  try {
    const value: unknown = await request.json();
    if (!isJsonObject(value)) {
      return {
        ok: false,
        response: jsonError(
          'VALIDATION_ERROR',
          'รูปแบบข้อมูลไม่ถูกต้อง',
          400,
        ),
      };
    }
    return { ok: true, value };
  } catch {
    return {
      ok: false,
      response: jsonError(
        'INVALID_JSON',
        'ข้อมูล JSON ไม่ถูกต้อง',
        400,
      ),
    };
  }
}

export function internalError(
  operation: string,
  category = 'repository_error',
): Response {
  const correlationId = randomUUID();
  console.error({ operation, category, correlationId });
  return jsonError(
    'INTERNAL_ERROR',
    `ระบบขัดข้อง กรุณาลองใหม่ภายหลัง (รหัสอ้างอิง: ${correlationId})`,
    500,
  );
}
