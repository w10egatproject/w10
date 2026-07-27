import { assertGoogleUploadUrl } from '@/lib/shop-order/repository';
import {
  internalError,
  jsonError,
  jsonSuccess,
  rejectCrossOrigin,
} from '../http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PUT(request: Request): Promise<Response> {
  const originError = rejectCrossOrigin(request);
  if (originError) return originError;

  const targetUrl = request.headers.get('x-upload-url');
  if (!targetUrl) {
    return jsonError('MISSING_UPLOAD_URL', 'ไม่พบ Upload URL', 400);
  }

  let validatedUrl: string;
  try {
    validatedUrl = assertGoogleUploadUrl(targetUrl);
  } catch {
    return jsonError('INVALID_UPLOAD_URL', 'Upload URL ไม่ถูกต้อง', 400);
  }

  const contentType =
    request.headers.get('content-type') || 'application/octet-stream';

  try {
    const body = await request.arrayBuffer();
    const driveResponse = await fetch(validatedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(body.byteLength),
      },
      body,
    });

    if (driveResponse.ok) {
      return jsonSuccess({ ok: true });
    }

    const errorText = await driveResponse.text().catch(() => '');
    console.error(
      `Google Drive upload proxy failed (${driveResponse.status}):`,
      errorText,
    );
    return jsonError(
      'UPLOAD_FAILED',
      'อัปโหลดไปยัง Google Drive ไม่สำเร็จ',
      driveResponse.status >= 400 && driveResponse.status < 600
        ? driveResponse.status
        : 500,
    );
  } catch (error) {
    console.error('Upload proxy internal error:', error);
    return internalError('upload_proxy');
  }
}
