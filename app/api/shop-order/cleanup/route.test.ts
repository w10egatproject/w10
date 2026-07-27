import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const repository = vi.hoisted(() => ({
  cleanupAttachments: vi.fn(),
}));

vi.mock('@/lib/shop-order/repository', () => ({
  getShopOrderRepository: vi.fn(async () => repository),
}));

import { GET } from './route';

const cleanupSummary = {
  inspected: 6,
  trashed: 2,
  skipped: 3,
  failed: 1,
};

function cleanupRequest(authorization?: string): Request {
  return new Request('https://dashboard.example/api/shop-order/cleanup', {
    headers: authorization ? { Authorization: authorization } : {},
  });
}

describe('Shop Order attachment cleanup route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('SHOP_ORDER_CRON_SECRET', 'cron-secret');
    repository.cleanupAttachments.mockResolvedValue(cleanupSummary);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each([
    ['a missing bearer value', undefined],
    ['a wrong bearer value', 'Bearer wrong'],
    ['a malformed scheme', 'Basic cron-secret'],
    ['a bearer token with the wrong byte length', 'Bearer cron-secret-extra'],
  ])('returns 401 for %s', async (_label, authorization) => {
    const response = await GET(cleanupRequest(authorization));

    expect(response.status).toBe(401);
    expect(response.headers.get('Cache-Control')).toContain('no-store');
    expect(await response.json()).toMatchObject({
      ok: false,
      error: { code: 'UNAUTHORIZED' },
    });
    expect(repository.cleanupAttachments).not.toHaveBeenCalled();
  });

  it('returns only aggregate counters for a valid bearer secret', async () => {
    const response = await GET(cleanupRequest('Bearer cron-secret'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toContain('no-store');
    expect(body).toEqual({ ok: true, data: cleanupSummary });
    expect(JSON.stringify(body)).not.toMatch(
      /fileId|fileName|name|url|https?:\/\//i,
    );
  });

  it('returns a generic safe error when cleanup cannot complete', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    repository.cleanupAttachments.mockRejectedValue(
      new Error('Drive secret body: file-id-sensitive'),
    );

    const response = await GET(cleanupRequest('Bearer cron-secret'));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toMatchObject({
      ok: false,
      error: { code: 'INTERNAL_ERROR' },
    });
    expect(JSON.stringify(body)).not.toContain('file-id-sensitive');
  });
});
