import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UploadSession } from '@/lib/shop-order/types';

const repository = vi.hoisted(() => ({
  load: vi.fn(),
  listDepartments: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  createUploadSession: vi.fn(),
}));

vi.mock('@/lib/shop-order/repository', () => ({
  getShopOrderRepository: vi.fn(async () => repository),
}));

import { POST } from './route';

const session: UploadSession = {
  fileId: 'generated-file-id',
  uploadUrl:
    'https://www.googleapis.com/upload/drive/v3/files?upload_id=secret',
  expiresAt: '2026-07-26T01:00:00.000Z',
};

function jsonRequest(
  body: unknown,
  headers: HeadersInit = {},
): Request {
  return new Request(
    'https://dashboard.example/api/shop-order/upload-session',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://dashboard.example',
        ...headers,
      },
      body: JSON.stringify(body),
    },
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  repository.createUploadSession.mockResolvedValue(session);
});

describe('Shop Order upload-session route', () => {
  it('validates metadata and returns a no-store created envelope', async () => {
    const metadata = {
      orderNumber: '123456',
      name: 'ต้นฉบับลับ.png',
      mimeType: 'image/png',
      size: 8,
    };

    const response = await POST(jsonRequest(metadata));

    expect(response.status).toBe(201);
    expect(response.headers.get('Cache-Control')).toContain('no-store');
    expect(await response.json()).toEqual({ ok: true, data: session });
    expect(repository.createUploadSession).toHaveBeenCalledWith(metadata);
  });

  it('rejects malformed JSON and a cross-origin request', async () => {
    const malformed = new Request(
      'https://dashboard.example/api/shop-order/upload-session',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'https://dashboard.example',
        },
        body: '{',
      },
    );
    const crossOrigin = jsonRequest(
      {
        orderNumber: '123456',
        name: 'photo.png',
        mimeType: 'image/png',
        size: 1024,
      },
      { Origin: 'https://attacker.example' },
    );

    const malformedResponse = await POST(malformed);
    const crossOriginResponse = await POST(crossOrigin);

    expect(malformedResponse.status).toBe(400);
    expect(await malformedResponse.json()).toMatchObject({
      ok: false,
      error: { code: 'INVALID_JSON' },
    });
    expect(crossOriginResponse.status).toBe(403);
    expect(repository.createUploadSession).not.toHaveBeenCalled();
  });

  it('rejects unsupported content types and oversized metadata', async () => {
    const unsupported = new Request(
      'https://dashboard.example/api/shop-order/upload-session',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          Origin: 'https://dashboard.example',
        },
        body: '{}',
      },
    );
    const oversized = jsonRequest({
      orderNumber: '123456',
      name: 'large.pdf',
      mimeType: 'application/pdf',
      size: 10 * 1024 * 1024 + 1,
    });

    const unsupportedResponse = await POST(unsupported);
    const oversizedResponse = await POST(oversized);

    expect(unsupportedResponse.status).toBe(415);
    expect(oversizedResponse.status).toBe(400);
    expect(await oversizedResponse.json()).toMatchObject({
      ok: false,
      error: { code: 'INVALID_UPLOAD_METADATA' },
    });
    expect(repository.createUploadSession).not.toHaveBeenCalled();
  });

  it.each(['12345', '1234567', 'abcdef', '', 123456])(
    'rejects an invalid six-digit order number %#',
    async (orderNumber) => {
      const response = await POST(jsonRequest({
        orderNumber,
        name: 'photo.png',
        mimeType: 'image/png',
        size: 1024,
      }));

      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        ok: false,
        error: { code: 'INVALID_UPLOAD_METADATA' },
      });
      expect(repository.createUploadSession).not.toHaveBeenCalled();
    },
  );

  it('returns a generic correlated 500 without logging credentials, metadata, or the session URL', async () => {
    const privateKey = '-----BEGIN PRIVATE KEY-----secret';
    const uploadUrl =
      'https://www.googleapis.com/upload/drive/v3/files?upload_id=secret';
    const metadata = {
      orderNumber: '123456',
      name: 'private-customer-file.pdf',
      mimeType: 'application/pdf',
      size: 1024,
    };
    repository.createUploadSession.mockRejectedValueOnce(
      new Error(`${privateKey} ${uploadUrl} ${metadata.name}`),
    );
    const errorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    const response = await POST(jsonRequest(metadata));
    const body = await response.json();
    const logs = JSON.stringify(errorSpy.mock.calls);

    expect(response.status).toBe(500);
    expect(body).toMatchObject({
      ok: false,
      error: { code: 'INTERNAL_ERROR' },
    });
    expect(body.error.message).toMatch(/รหัสอ้างอิง: [0-9a-f-]{36}/);
    expect(logs).not.toContain(privateKey);
    expect(logs).not.toContain(uploadUrl);
    expect(logs).not.toContain(metadata.name);
    expect(errorSpy).toHaveBeenCalledWith({
      operation: 'create_upload_session',
      category: 'repository_error',
      correlationId: expect.stringMatching(/^[0-9a-f-]{36}$/),
    });
  });

  it.each([
    [
      'DRIVE_OAUTH_CONFIGURATION_REQUIRED',
      'DRIVE_OAUTH_CONFIGURATION_REQUIRED',
      'การตั้งค่า Google Drive OAuth ไม่ครบ กรุณาติดต่อผู้ดูแลระบบ',
    ],
    [
      'DRIVE_OAUTH_REAUTH_REQUIRED',
      'DRIVE_OAUTH_REAUTH_REQUIRED',
      'การเชื่อมต่อ Google Drive หมดอายุ กรุณาเชื่อมต่อบัญชีใหม่',
    ],
    [
      'DRIVE_FOLDER_CONFIGURATION_REQUIRED',
      'DRIVE_FOLDER_CONFIGURATION_REQUIRED',
      'ไม่พบโฟลเดอร์ Google Drive ที่กำหนด กรุณาตรวจสอบการตั้งค่าโฟลเดอร์',
    ],
    [
      'DRIVE_ACCESS_FORBIDDEN',
      'DRIVE_FOLDER_CONFIGURATION_REQUIRED',
      'ไม่พบโฟลเดอร์ Google Drive ที่กำหนด กรุณาตรวจสอบการตั้งค่าโฟลเดอร์',
    ],
    [
      'DRIVE_QUOTA_EXCEEDED',
      'DRIVE_QUOTA_EXCEEDED',
      'พื้นที่จัดเก็บหรือโควตา Google Drive เต็ม กรุณาติดต่อผู้ดูแลระบบ',
    ],
    [
      'DRIVE_UNAVAILABLE',
      'DRIVE_UNAVAILABLE',
      'Google Drive ไม่พร้อมใช้งานชั่วคราว กรุณาลองใหม่ภายหลัง',
    ],
  ])(
    'returns a safe actionable response for %s',
    async (repositoryCode, responseCode, message) => {
      repository.createUploadSession.mockRejectedValueOnce(
        Object.assign(new Error('hidden google response'), {
          code: repositoryCode,
        }),
      );

      const response = await POST(jsonRequest({
        orderNumber: '123456',
        name: 'photo.png',
        mimeType: 'image/png',
        size: 1024,
      }));
      const body = await response.json();

      expect(response.status).toBe(503);
      expect(body).toEqual({
        ok: false,
        error: { code: responseCode, message },
      });
      expect(JSON.stringify(body)).not.toContain('Service Account');
      expect(JSON.stringify(body)).not.toContain('hidden google response');
    },
  );
});
