import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PUT } from './route';

const originalFetch = globalThis.fetch;

describe('Shop Order upload-proxy route', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('rejects request with cross-origin origin header', async () => {
    const response = await PUT(
      new Request('https://dashboard.example/api/shop-order/upload-proxy', {
        method: 'PUT',
        headers: {
          Origin: 'https://malicious.example',
          'x-upload-url':
            'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable',
        },
      }),
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      ok: false,
      error: {
        code: 'ORIGIN_NOT_ALLOWED',
        message: 'ไม่อนุญาตให้ส่งข้อมูลจากเว็บไซต์อื่น',
      },
    });
  });

  it('returns 400 if x-upload-url header is missing', async () => {
    const response = await PUT(
      new Request('https://dashboard.example/api/shop-order/upload-proxy', {
        method: 'PUT',
        headers: {
          Origin: 'https://dashboard.example',
        },
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      ok: false,
      error: {
        code: 'MISSING_UPLOAD_URL',
        message: 'ไม่พบ Upload URL',
      },
    });
  });

  it('returns 400 if x-upload-url is not a valid Google Drive upload URL', async () => {
    const response = await PUT(
      new Request('https://dashboard.example/api/shop-order/upload-proxy', {
        method: 'PUT',
        headers: {
          Origin: 'https://dashboard.example',
          'x-upload-url': 'https://evil.example/upload',
        },
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      ok: false,
      error: {
        code: 'INVALID_UPLOAD_URL',
        message: 'Upload URL ไม่ถูกต้อง',
      },
    });
  });

  it('proxies upload stream to Google Drive and returns success', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'file-123' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    globalThis.fetch = fetchMock;

    const fileContent = new Uint8Array([1, 2, 3, 4]);
    const response = await PUT(
      new Request('https://dashboard.example/api/shop-order/upload-proxy', {
        method: 'PUT',
        headers: {
          Origin: 'https://dashboard.example',
          'x-upload-url':
            'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&upload_id=abc',
          'content-type': 'image/jpeg',
        },
        body: fileContent,
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      data: { ok: true },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&upload_id=abc',
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          'Content-Type': 'image/jpeg',
          'Content-Length': '4',
        }),
      }),
    );
  });

  it('handles Google Drive non-200 failure gracefully', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response('Quota exceeded', {
        status: 507,
      }),
    );
    globalThis.fetch = fetchMock;

    const response = await PUT(
      new Request('https://dashboard.example/api/shop-order/upload-proxy', {
        method: 'PUT',
        headers: {
          Origin: 'https://dashboard.example',
          'x-upload-url':
            'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&upload_id=abc',
        },
        body: new Uint8Array([1, 2]),
      }),
    );

    expect(response.status).toBe(507);
    expect(await response.json()).toEqual({
      ok: false,
      error: {
        code: 'UPLOAD_FAILED',
        message: 'อัปโหลดไปยัง Google Drive ไม่สำเร็จ',
      },
    });
  });
});
