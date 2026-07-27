import { beforeEach, describe, expect, it, vi } from 'vitest';

const repository = vi.hoisted(() => ({
  getAttachmentThumbnail: vi.fn(),
}));

vi.mock('@/lib/shop-order/repository', () => ({
  getShopOrderRepository: vi.fn(async () => repository),
}));

import { GET } from './route';

beforeEach(() => {
  vi.clearAllMocks();
  repository.getAttachmentThumbnail.mockResolvedValue({
    bytes: new Uint8Array([1, 2, 3]),
    contentType: 'image/png',
  });
});

describe('Shop Order attachment thumbnail route', () => {
  it('returns verified image bytes with defensive no-cache headers', async () => {
    const response = await GET(
      new Request(
        'https://dashboard.example/api/shop-order/attachment-thumbnail?no=7',
      ),
    );

    expect(response.status).toBe(200);
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(
      new Uint8Array([1, 2, 3]),
    );
    expect(response.headers.get('Content-Type')).toBe('image/png');
    expect(response.headers.get('Cache-Control')).toContain('no-store');
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(response.headers.get('Content-Security-Policy')).toBe(
      "default-src 'none'",
    );
    expect(repository.getAttachmentThumbnail).toHaveBeenCalledWith(7);
  });

  it.each([
    '',
    '?no=',
    '?no=0',
    '?no=-1',
    '?no=1.5',
    '?no=01',
    '?no=7x',
    `?no=${Number.MAX_SAFE_INTEGER + 1}`,
  ])('rejects an invalid positive safe integer query: %s', async (query) => {
    const response = await GET(
      new Request(
        `https://dashboard.example/api/shop-order/attachment-thumbnail${query}`,
      ),
    );

    expect(response.status).toBe(400);
    expect(repository.getAttachmentThumbnail).not.toHaveBeenCalled();
  });

  it('returns 404 when the current attachment has no verified thumbnail', async () => {
    repository.getAttachmentThumbnail.mockResolvedValueOnce(null);

    const response = await GET(
      new Request(
        'https://dashboard.example/api/shop-order/attachment-thumbnail?no=7',
      ),
    );

    expect(response.status).toBe(404);
    expect(response.headers.get('Cache-Control')).toContain('no-store');
  });

  it('returns a generic correlated 500 without leaking repository errors', async () => {
    const secret = 'oauth-secret-must-not-leak';
    repository.getAttachmentThumbnail.mockRejectedValueOnce(
      new Error(secret),
    );
    const errorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    const response = await GET(
      new Request(
        'https://dashboard.example/api/shop-order/attachment-thumbnail?no=7',
      ),
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toMatchObject({
      ok: false,
      error: { code: 'INTERNAL_ERROR' },
    });
    expect(body.error.message).toMatch(/รหัสอ้างอิง: [0-9a-f-]{36}/);
    expect(JSON.stringify(errorSpy.mock.calls)).not.toContain(secret);
  });
});
