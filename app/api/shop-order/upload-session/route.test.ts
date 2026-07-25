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
      name: 'photo.png',
      mimeType: 'image/png',
      size: 1024,
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
      { name: 'photo.png', mimeType: 'image/png', size: 1024 },
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

  it('returns a generic correlated 500 without logging credentials, metadata, or the session URL', async () => {
    const privateKey = '-----BEGIN PRIVATE KEY-----secret';
    const uploadUrl =
      'https://www.googleapis.com/upload/drive/v3/files?upload_id=secret';
    const metadata = {
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
});
