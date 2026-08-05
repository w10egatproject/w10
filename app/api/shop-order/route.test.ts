import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  ShopOrder,
  ShopOrderBootstrap,
  ShopOrderInput,
  ShopOrderMutationResult,
} from '@/lib/shop-order/types';

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

import { DELETE, GET, PATCH, POST } from './route';

const validOrderInput: ShopOrderInput = {
  to: 'หน่วยงาน ก',
  number: '123456',
  dateIn: '2026-07-01',
  subject: 'ทดสอบระบบ',
  receivingUnit: 'W11',
  receiverName: 'สมชาย',
  dateOut: null,
  note: 'ข้อมูลส่วนตัวห้ามบันทึกใน log',
};

const savedOrder: ShopOrder = {
  no: 7,
  from: 'หสบ-ช.',
  fileUrl: '',
  repairFileUrl: '',
  ...validOrderInput,
};
const savedMutation: ShopOrderMutationResult = {
  order: savedOrder,
  attachment: { status: 'none' },
  repairAttachment: { status: 'none' },
};

const bootstrap: ShopOrderBootstrap = {
  orders: [savedOrder],
  departments: ['หน่วยงาน ก'],
  receivers: ['สมชาย'],
  generatedAt: '2026-07-26T00:00:00.000Z',
};

function jsonRequest(
  body: unknown,
  method = 'POST',
  headers: HeadersInit = {},
): Request {
  return new Request('https://dashboard.example/api/shop-order', {
    method,
    headers: {
      'Content-Type': 'application/json',
      Origin: 'https://dashboard.example',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  repository.load.mockResolvedValue(bootstrap);
  repository.listDepartments.mockResolvedValue(['หน่วยงาน ก']);
  repository.create.mockResolvedValue(savedMutation);
  repository.update.mockResolvedValue(savedMutation);
  repository.remove.mockResolvedValue(undefined);
});

describe('Shop Order route handlers', () => {
  it('returns a no-store success envelope from GET', async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toContain('no-store');
    expect(await response.json()).toEqual({ ok: true, data: bootstrap });
  });

  it('creates an order and returns its mutation outcome', async () => {
    const response = await POST(
      jsonRequest({
        order: validOrderInput,
        uploadedFileId: 'generated-file-id',
      }),
    );

    expect(response.status).toBe(201);
    expect(response.headers.get('Cache-Control')).toContain('no-store');
    expect(await response.json()).toEqual({
      ok: true,
      data: savedMutation,
    });
    expect(repository.create).toHaveBeenCalledWith(
      validOrderInput,
      'generated-file-id',
      undefined,
    );
  });

  it('updates and deletes by stable sequence', async () => {
    const patchResponse = await PATCH(
      jsonRequest(
        {
          no: 7,
          order: validOrderInput,
          uploadedFileId: 'replacement-id',
        },
        'PATCH',
      ),
    );
    const deleteResponse = await DELETE(
      jsonRequest({ no: 7 }, 'DELETE'),
    );

    expect(patchResponse.status).toBe(200);
    expect(await patchResponse.json()).toEqual({
      ok: true,
      data: savedMutation,
    });
    expect(repository.update).toHaveBeenCalledWith(
      7,
      validOrderInput,
      'replacement-id',
      undefined,
    );
    expect(deleteResponse.status).toBe(200);
    expect(await deleteResponse.json()).toEqual({
      ok: true,
      data: { no: 7 },
    });
    expect(repository.remove).toHaveBeenCalledWith(7);
  });

  it('rejects malformed JSON and unsupported content types', async () => {
    const malformed = new Request(
      'https://dashboard.example/api/shop-order',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'https://dashboard.example',
        },
        body: '{',
      },
    );
    const unsupported = new Request(
      'https://dashboard.example/api/shop-order',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          Origin: 'https://dashboard.example',
        },
        body: '{}',
      },
    );

    const malformedResponse = await POST(malformed);
    const unsupportedResponse = await POST(unsupported);

    expect(malformedResponse.status).toBe(400);
    expect(await malformedResponse.json()).toMatchObject({
      ok: false,
      error: { code: 'INVALID_JSON' },
    });
    expect(unsupportedResponse.status).toBe(415);
    expect(await unsupportedResponse.json()).toMatchObject({
      ok: false,
      error: { code: 'UNSUPPORTED_MEDIA_TYPE' },
    });
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('rejects a cross-origin browser mutation when Origin is present', async () => {
    const response = await POST(
      jsonRequest(
        { order: validOrderInput },
        'POST',
        { Origin: 'https://attacker.example' },
      ),
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({
      ok: false,
      error: { code: 'ORIGIN_NOT_ALLOWED' },
    });
    expect(repository.listDepartments).not.toHaveBeenCalled();
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('accepts a non-browser request with no Origin header', async () => {
    const request = jsonRequest({ order: validOrderInput });
    request.headers.delete('Origin');

    const response = await POST(request);

    expect(response.status).toBe(201);
  });

  it('validates the order body and re-reads allowed departments', async () => {
    const invalidBody = await POST(
      jsonRequest({
        order: { ...validOrderInput, number: '12' },
      }),
    );
    repository.listDepartments.mockResolvedValueOnce(['หน่วยงาน ข']);
    const invalidDepartment = await POST(
      jsonRequest({ order: validOrderInput }),
    );

    expect(invalidBody.status).toBe(400);
    expect(await invalidBody.json()).toMatchObject({
      ok: false,
      error: { code: 'VALIDATION_ERROR' },
    });
    expect(invalidDepartment.status).toBe(400);
    expect(await invalidDepartment.json()).toMatchObject({
      ok: false,
      error: { code: 'INVALID_DEPARTMENT' },
    });
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('rejects invalid stable sequences', async () => {
    const patchResponse = await PATCH(
      jsonRequest({ no: 0, order: validOrderInput }, 'PATCH'),
    );
    const deleteResponse = await DELETE(
      jsonRequest({ no: 1.5 }, 'DELETE'),
    );

    expect(patchResponse.status).toBe(400);
    expect(deleteResponse.status).toBe(400);
    expect(repository.update).not.toHaveBeenCalled();
    expect(repository.remove).not.toHaveBeenCalled();
  });

  it('returns a generic correlated 500 and logs no private error data', async () => {
    const privateKey = '-----BEGIN PRIVATE KEY-----secret';
    const sessionUrl =
      'https://www.googleapis.com/upload/drive/v3/files?upload_id=secret';
    repository.create.mockRejectedValueOnce(
      new Error(`${privateKey} ${sessionUrl} ${validOrderInput.note}`),
    );
    const errorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    const response = await POST(
      jsonRequest({
        order: validOrderInput,
        uploadedFileId: 'private-file-id',
      }),
    );
    const body = await response.json();
    const logs = JSON.stringify(errorSpy.mock.calls);

    expect(response.status).toBe(500);
    expect(body).toMatchObject({
      ok: false,
      error: { code: 'INTERNAL_ERROR' },
    });
    expect(body.error.message).toMatch(/รหัสอ้างอิง: [0-9a-f-]{36}/);
    expect(logs).not.toContain(privateKey);
    expect(logs).not.toContain(sessionUrl);
    expect(logs).not.toContain(validOrderInput.note);
    expect(logs).not.toContain('private-file-id');
    expect(errorSpy).toHaveBeenCalledWith({
      operation: 'create',
      category: 'repository_error',
      correlationId: expect.stringMatching(/^[0-9a-f-]{36}$/),
    });
  });
});
