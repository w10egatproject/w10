import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createShopOrderRepository,
  normalizePrivateKey,
  type ShopOrderRepositoryDependencies,
} from './repository';
import type { ShopOrderInput, UploadMetadata } from './types';

const PNG_BYTES = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

const validOrder: ShopOrderInput = {
  to: 'หบพ-ช.',
  number: '123456',
  dateIn: '2026-07-01',
  subject: 'ทดสอบ',
  receivingUnit: 'W11',
  receiverName: 'สมชาย',
  dateOut: null,
  note: '',
};

const uploadMetadata: UploadMetadata = {
  name: 'photo.png',
  mimeType: 'image/png',
  size: PNG_BYTES.byteLength,
};
const storedUploadName =
  'SO-123456-20260727-080910-a1b2c3d4.png';
const pendingSince = '2026-07-27T08:09:10.000Z';
const uploadSessionRequest = {
  orderNumber: '123456',
  ...uploadMetadata,
};

function makeDependencies() {
  const sheets = {
    spreadsheets: {
      values: {
        batchGet: vi.fn().mockResolvedValue({
          data: {
            valueRanges: [
              { values: [[1, 'หสบ-ช.', 'หบพ-ช.', '123456', 46204, 'เรื่อง', 'W11', '', '', '', '']] },
              { values: [['หบพ-ช.']] },
              { values: [['สมชาย']] },
            ],
          },
        }),
        get: vi.fn().mockImplementation(({ range }: { range: string }) => {
          if (range.includes('DepartmentList')) {
            return Promise.resolve({ data: { values: [['หบพ-ช.']] } });
          }
          if (range.endsWith('!A2:A')) {
            return Promise.resolve({ data: { values: [[1]] } });
          }
          if (/!A2:L2$/.test(range)) {
            return Promise.resolve({
              data: {
                values: [[1, 'หสบ-ช.', 'หบพ-ช.', '123456', 46204, 'เรื่อง', 'W11', '', '', '', '']],
              },
            });
          }
          return Promise.resolve({ data: { values: [] } });
        }),
        append: vi.fn().mockResolvedValue({
          data: { updates: { updatedRange: "'Order1'!A3:L3" } },
        }),
        update: vi.fn().mockResolvedValue({ data: {} }),
        clear: vi.fn().mockResolvedValue({ data: {} }),
      },
      get: vi.fn().mockResolvedValue({
        data: {
          sheets: [{ properties: { title: 'Order1', sheetId: 42 } }],
        },
      }),
      batchUpdate: vi.fn().mockResolvedValue({ data: {} }),
    },
  };

  const drive = {
    files: {
      generateIds: vi.fn().mockResolvedValue({ data: { ids: ['generated-id'] } }),
      get: vi.fn().mockResolvedValue({
        data: {
          id: 'generated-id',
          name: storedUploadName,
          mimeType: uploadMetadata.mimeType,
          size: String(uploadMetadata.size),
          parents: ['folder-id'],
          appProperties: {
            status: 'pending',
            pendingSince,
            orderNumber: validOrder.number,
            expectedName: storedUploadName,
            expectedMime: uploadMetadata.mimeType,
            expectedSize: String(uploadMetadata.size),
          },
          webViewLink: 'https://drive.google.com/file/d/generated-id/view',
          trashed: false,
        },
      }),
      list: vi.fn().mockResolvedValue({ data: { files: [] } }),
      update: vi.fn().mockResolvedValue({
        data: {
          webViewLink: 'https://drive.google.com/file/d/generated-id/view',
        },
      }),
    },
    permissions: {
      create: vi.fn().mockResolvedValue({
        data: { id: 'public-permission-id' },
      }),
      delete: vi.fn().mockResolvedValue({ data: {} }),
    },
  };

  const authenticatedFetch = vi.fn()
    .mockResolvedValueOnce(new Response(null, {
      status: 200,
      headers: { location: 'https://www.googleapis.com/upload/session-id' },
    }))
    .mockResolvedValue(new Response(PNG_BYTES, { status: 206 }));

  const dependencies = {
    sheets,
    drive,
    getAccessToken: vi.fn().mockResolvedValue('access-token'),
    authenticatedFetch,
    config: {
      spreadsheetId: 'spreadsheet-id',
      sheetName: 'Order1',
      folderId: 'folder-id',
    },
    now: () => new Date('2026-07-25T00:00:00.000Z'),
    randomId: () => 'a1b2c3d4-e5f6-4789-8abc-def012345678',
  } satisfies ShopOrderRepositoryDependencies;

  return {
    sheets,
    drive,
    authenticatedFetch,
    dependencies,
  };
}

function setCurrentAttachment(
  sheets: ReturnType<typeof makeDependencies>['sheets'],
  fileUrl: string,
) {
  sheets.spreadsheets.values.get.mockImplementation(
    ({ range }: { range: string }) => {
      if (range.includes('DepartmentList')) {
        return Promise.resolve({ data: { values: [['หบพ-ช.']] } });
      }
      if (range.endsWith('!A2:A')) {
        return Promise.resolve({ data: { values: [[1]] } });
      }
      if (/!A2:L2$/.test(range)) {
        return Promise.resolve({
          data: {
            values: [[
              1,
              'หสบ-ช.',
              'หบพ-ช.',
              '123456',
              46204,
              'เรื่อง',
              'W11',
              '',
              '',
              '',
              fileUrl,
            ]],
          },
        });
      }
      return Promise.resolve({ data: { values: [] } });
    },
  );
}

describe('ShopOrderRepository', () => {
  it('normalizes quoted private keys with platform prefixes safely', () => {
    expect(
      normalizePrivateKey(
        '"prefix-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----suffix"',
      ),
    ).toBe('-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----');
  });
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('paginates app-owned pending and scheduled-delete files and trashes only exact-boundary expirations', async () => {
    const { dependencies, drive } = makeDependencies();
    dependencies.now = () => new Date('2026-07-27T00:00:00.000Z');
    drive.files.list = vi
      .fn()
      .mockResolvedValueOnce({
        data: {
          files: [
            {
              id: 'pending-boundary',
              trashed: false,
              appProperties: {
                status: 'pending',
                pendingSince: '2026-07-26T00:00:00.000Z',
                orderNumber: '123456',
              },
            },
            {
              id: 'pending-newer',
              trashed: false,
              appProperties: {
                status: 'pending',
                pendingSince: '2026-07-26T00:00:00.001Z',
                orderNumber: '123456',
              },
            },
          ],
          nextPageToken: 'pending-page-2',
        },
      })
      .mockResolvedValueOnce({
        data: {
          files: [
            {
              id: 'pending-malformed',
              trashed: false,
              appProperties: {
                status: 'pending',
                pendingSince: 'invalid',
                orderNumber: '123456',
              },
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        data: {
          files: [
            {
              id: 'scheduled-boundary',
              trashed: false,
              appProperties: {
                status: 'scheduled_delete',
                deleteAfter: '2026-07-27T00:00:00.000Z',
                orderNumber: '123456',
                reason: 'replaced',
              },
            },
            {
              id: 'scheduled-future',
              trashed: false,
              appProperties: {
                status: 'scheduled_delete',
                deleteAfter: '2026-07-27T00:00:00.001Z',
                orderNumber: '123456',
                reason: 'order_deleted',
              },
            },
          ],
          nextPageToken: 'scheduled-page-2',
        },
      })
      .mockResolvedValueOnce({
        data: { files: [] },
      });
    drive.files.update.mockResolvedValue({ data: {} });
    const repository = createShopOrderRepository(dependencies);

    await expect(repository.cleanupAttachments()).resolves.toEqual({
      inspected: 5,
      trashed: 2,
      skipped: 3,
      failed: 0,
    });
    expect(drive.files.list).toHaveBeenNthCalledWith(1, {
      q: "'folder-id' in parents and trashed = false and appProperties has { key='status' and value='pending' }",
      fields: 'nextPageToken,files(id,trashed,appProperties)',
      pageSize: 1000,
    });
    expect(drive.files.list).toHaveBeenNthCalledWith(2, {
      q: "'folder-id' in parents and trashed = false and appProperties has { key='status' and value='pending' }",
      fields: 'nextPageToken,files(id,trashed,appProperties)',
      pageSize: 1000,
      pageToken: 'pending-page-2',
    });
    expect(drive.files.list).toHaveBeenNthCalledWith(3, {
      q: "'folder-id' in parents and trashed = false and appProperties has { key='status' and value='scheduled_delete' }",
      fields: 'nextPageToken,files(id,trashed,appProperties)',
      pageSize: 1000,
    });
    expect(drive.files.list).toHaveBeenNthCalledWith(4, {
      q: "'folder-id' in parents and trashed = false and appProperties has { key='status' and value='scheduled_delete' }",
      fields: 'nextPageToken,files(id,trashed,appProperties)',
      pageSize: 1000,
      pageToken: 'scheduled-page-2',
    });
    expect(drive.files.update.mock.calls).toEqual([
      [
        {
          fileId: 'pending-boundary',
          fields: 'id,trashed',
          requestBody: { trashed: true },
        },
      ],
      [
        {
          fileId: 'scheduled-boundary',
          fields: 'id,trashed',
          requestBody: { trashed: true },
        },
      ],
    ]);
  });

  it('continues after per-file failures and treats already-trashed or missing files idempotently', async () => {
    const { dependencies, drive } = makeDependencies();
    dependencies.now = () => new Date('2026-07-27T00:00:00.000Z');
    drive.files.list = vi
      .fn()
      .mockResolvedValueOnce({
        data: {
          files: [
            {
              id: 'already-trashed',
              trashed: true,
              appProperties: {
                status: 'pending',
                pendingSince: '2026-07-25T00:00:00.000Z',
                orderNumber: '123456',
              },
            },
            {
              id: 'missing-race',
              trashed: false,
              appProperties: {
                status: 'pending',
                pendingSince: '2026-07-25T00:00:00.000Z',
                orderNumber: '123456',
              },
            },
            {
              id: 'temporary-failure',
              trashed: false,
              appProperties: {
                status: 'pending',
                pendingSince: '2026-07-25T00:00:00.000Z',
                orderNumber: '123456',
              },
            },
            {
              id: 'continues-after-failure',
              trashed: false,
              appProperties: {
                status: 'pending',
                pendingSince: '2026-07-25T00:00:00.000Z',
                orderNumber: '123456',
              },
            },
          ],
        },
      })
      .mockResolvedValueOnce({ data: { files: [] } });
    drive.files.update
      .mockRejectedValueOnce({ response: { status: 404 } })
      .mockRejectedValueOnce({ response: { status: 503 } })
      .mockResolvedValueOnce({ data: {} });
    const repository = createShopOrderRepository(dependencies);

    await expect(repository.cleanupAttachments()).resolves.toEqual({
      inspected: 4,
      trashed: 1,
      skipped: 2,
      failed: 1,
    });
    expect(drive.files.update.mock.calls.map(([request]) => request.fileId)).toEqual([
      'missing-race',
      'temporary-failure',
      'continues-after-failure',
    ]);
  });

  it('loads raw A-K values and both suggestion lists', async () => {
    const { dependencies, sheets } = makeDependencies();
    const repository = createShopOrderRepository(dependencies);

    await expect(repository.load()).resolves.toMatchObject({
      orders: [{ no: 1, to: 'หบพ-ช.', number: '123456' }],
      departments: ['หบพ-ช.'],
      receivers: ['สมชาย'],
      generatedAt: '2026-07-25T00:00:00.000Z',
    });
    expect(sheets.spreadsheets.values.batchGet).toHaveBeenCalledWith({
      spreadsheetId: 'spreadsheet-id',
      ranges: ["'Order1'!A2:L", "'DepartmentList'!A2:A", "'ReceiverList'!A2:A"],
      valueRenderOption: 'UNFORMATTED_VALUE',
      dateTimeRenderOption: 'SERIAL_NUMBER',
    });
  });

  it('creates pending Drive metadata with a generated name and no original filename', async () => {
    const { dependencies, drive, authenticatedFetch } = makeDependencies();
    dependencies.config.folderId = 'oauth-folder-id';
    dependencies.now = () => new Date('2026-07-27T08:09:10.000Z');
    const repository = createShopOrderRepository(dependencies);

    const session = await repository.createUploadSession({
      ...uploadSessionRequest,
      name: 'ต้นฉบับลับ.png',
    });

    expect(drive.files.generateIds).toHaveBeenCalledWith({
      count: 1,
      space: 'drive',
      type: 'files',
    });
    expect(authenticatedFetch).toHaveBeenCalledTimes(1);
    const [requestUrl, fetchInit] = authenticatedFetch.mock.calls[0];
    expect(requestUrl).toBe(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,webViewLink',
    );
    expect(fetchInit).toMatchObject({
      method: 'POST',
      headers: {
        Authorization: 'Bearer access-token',
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Type': 'image/png',
        'X-Upload-Content-Length': '8',
      },
    });
    expect(JSON.parse(fetchInit.body as string)).toEqual({
      id: 'generated-id',
      name: 'SO-123456-20260727-080910-a1b2c3d4.png',
      parents: ['oauth-folder-id'],
      appProperties: {
        status: 'pending',
        pendingSince: '2026-07-27T08:09:10.000Z',
        orderNumber: '123456',
        expectedName: 'SO-123456-20260727-080910-a1b2c3d4.png',
        expectedMime: 'image/png',
        expectedSize: '8',
      },
    });
    expect(fetchInit.body as string).not.toContain('ต้นฉบับลับ');
    expect(session).toEqual({
      fileId: 'generated-id',
      uploadUrl: 'https://www.googleapis.com/upload/session-id',
      expiresAt: '2026-07-27T09:09:10.000Z',
    });
  });

  it.each([
    'https://www.googleapis.com.evil.test/session',
    'https://www.googleapis.com:444/session',
    'http://www.googleapis.com/session',
    'https://user@www.googleapis.com/session',
  ])('rejects a resumable URI outside the exact Google HTTPS origin: %s', async (location) => {
    const { dependencies, authenticatedFetch } = makeDependencies();
    authenticatedFetch.mockReset().mockResolvedValue(
      new Response(null, {
        status: 200,
        headers: { location },
      }),
    );
    const repository = createShopOrderRepository(dependencies);

    await expect(repository.createUploadSession(uploadSessionRequest))
      .rejects.toThrow('resumable');
  });

  it('classifies a forbidden Drive folder without exposing Google details', async () => {
    const { dependencies, authenticatedFetch } = makeDependencies();
    authenticatedFetch.mockReset().mockResolvedValue(
      new Response(null, { status: 403 }),
    );
    const repository = createShopOrderRepository(dependencies);

    await expect(repository.createUploadSession(uploadSessionRequest)).rejects.toMatchObject({
      code: 'DRIVE_ACCESS_FORBIDDEN',
      message: 'ไม่สามารถเข้าถึงโฟลเดอร์ Google Drive ได้',
    });
  });

  it.each([
    [401, undefined, 'DRIVE_OAUTH_REAUTH_REQUIRED'],
    [404, undefined, 'DRIVE_FOLDER_CONFIGURATION_REQUIRED'],
    [429, undefined, 'DRIVE_QUOTA_EXCEEDED'],
    [
      403,
      {
        error: {
          errors: [{ reason: 'storageQuotaExceeded' }],
        },
      },
      'DRIVE_QUOTA_EXCEEDED',
    ],
    [503, undefined, 'DRIVE_UNAVAILABLE'],
  ])(
    'maps a failed Drive session response %s to %s without exposing its body',
    async (status, responseBody, expectedCode) => {
      const { dependencies, authenticatedFetch } = makeDependencies();
      authenticatedFetch.mockReset().mockResolvedValue(
        new Response(
          responseBody ? JSON.stringify(responseBody) : null,
          {
            status,
            headers: responseBody
              ? { 'Content-Type': 'application/json' }
              : undefined,
          },
        ),
      );
      const repository = createShopOrderRepository(dependencies);

      await expect(
        repository.createUploadSession(uploadSessionRequest),
      ).rejects.toMatchObject({
        code: expectedCode,
      });
    },
  );

  it.each([
    ['wrong parent', { parents: ['other-folder'] }],
    [
      'wrong lifecycle',
      { appProperties: { status: 'active' } },
    ],
    [
      'missing pending timestamp',
      {
        appProperties: {
          status: 'pending',
          orderNumber: validOrder.number,
          expectedName: storedUploadName,
          expectedMime: uploadMetadata.mimeType,
          expectedSize: String(uploadMetadata.size),
        },
      },
    ],
    [
      'wrong order number',
      {
        appProperties: {
          status: 'pending',
          pendingSince,
          orderNumber: '654321',
          expectedName: storedUploadName,
          expectedMime: uploadMetadata.mimeType,
          expectedSize: String(uploadMetadata.size),
        },
      },
    ],
    ['wrong name', { name: 'other.png' }],
    ['wrong mime', { mimeType: 'application/pdf' }],
    ['wrong size', { size: '999' }],
    ['trashed', { trashed: true }],
  ])('saves without an attachment when uploaded metadata is invalid: %s', async (_label, patch) => {
    const { dependencies, drive, sheets } = makeDependencies();
    drive.files.get.mockResolvedValueOnce({
      data: {
        ...(await drive.files.get({})).data,
        ...patch,
      },
    });
    drive.files.get.mockClear();
    const repository = createShopOrderRepository(dependencies);

    await expect(
      repository.create(validOrder, 'generated-id'),
    ).resolves.toMatchObject({
      order: { no: 2, fileUrl: '' },
      attachment: {
        status: 'order_saved_without_attachment',
        code: 'ORDER_SAVED_WITHOUT_ATTACHMENT',
      },
    });
    expect(drive.permissions.create).not.toHaveBeenCalled();
    expect(sheets.spreadsheets.values.append).toHaveBeenCalledWith(
      expect.objectContaining({
        requestBody: {
          values: [[
            '',
            'หสบ-ช.',
            'หบพ-ช.',
            '123456',
            expect.any(Number),
            'ทดสอบ',
            'W11',
            'สมชาย',
            '',
            '',
            '',
            '',
          ]],
        },
      }),
    );
  });

  it('saves without an attachment when its leading signature is forbidden', async () => {
    const { dependencies, authenticatedFetch, drive, sheets } = makeDependencies();
    authenticatedFetch.mockReset().mockResolvedValue(
      new Response(new TextEncoder().encode('<script>'), { status: 206 }),
    );
    const repository = createShopOrderRepository(dependencies);

    await expect(
      repository.create(validOrder, 'generated-id'),
    ).resolves.toMatchObject({
      order: { fileUrl: '' },
      attachment: {
        status: 'order_saved_without_attachment',
        code: 'ORDER_SAVED_WITHOUT_ATTACHMENT',
      },
    });
    expect(authenticatedFetch).toHaveBeenCalledWith(
      expect.stringContaining('/drive/v3/files/generated-id?alt=media'),
      expect.objectContaining({
        headers: expect.objectContaining({ Range: 'bytes=0-31' }),
      }),
    );
    expect(drive.permissions.create).not.toHaveBeenCalled();
    expect(sheets.spreadsheets.values.append).toHaveBeenCalled();
  });

  it('saves without an attachment when Drive cannot return its leading bytes', async () => {
    const { dependencies, authenticatedFetch, sheets } =
      makeDependencies();
    authenticatedFetch.mockReset().mockResolvedValue({
      ok: true,
      arrayBuffer: vi
        .fn()
        .mockRejectedValue(new Error('private response failure')),
    } as unknown as Response);
    const repository = createShopOrderRepository(dependencies);

    await expect(
      repository.create(validOrder, 'generated-id'),
    ).resolves.toMatchObject({
      order: { fileUrl: '' },
      attachment: {
        status: 'order_saved_without_attachment',
        code: 'ORDER_SAVED_WITHOUT_ATTACHMENT',
      },
    });
    expect(sheets.spreadsheets.values.append).toHaveBeenCalled();
  });

  it('restores pending state when Drive returns an unsafe finalized link', async () => {
    const { dependencies, authenticatedFetch, drive } =
      makeDependencies();
    authenticatedFetch.mockReset().mockImplementation(
      async () => new Response(PNG_BYTES, { status: 206 }),
    );
    drive.files.update.mockResolvedValueOnce({
      data: {
        id: 'generated-id',
        webViewLink:
          'https://drive.google.com.evil.test/file/d/generated-id/view',
      },
    });
    const repository = createShopOrderRepository(dependencies);

    await expect(
      repository.create(validOrder, 'generated-id'),
    ).resolves.toMatchObject({
      order: { fileUrl: '' },
      attachment: {
        status: 'order_saved_without_attachment',
        code: 'ORDER_SAVED_WITHOUT_ATTACHMENT',
      },
    });
    expect(drive.files.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        fileId: 'generated-id',
        requestBody: {
          appProperties: {
            status: 'pending',
            pendingSince,
            orderNumber: '123456',
            expectedName: storedUploadName,
            expectedMime: 'image/png',
            expectedSize: '8',
          },
        },
      }),
    );
    expect(drive.permissions.delete).toHaveBeenCalledWith({
      fileId: 'generated-id',
      permissionId: 'public-permission-id',
    });
  });

  it('activates a verified pending file before appending RAW values and returns the attachment outcome', async () => {
    const { dependencies, authenticatedFetch, drive, sheets } = makeDependencies();
    dependencies.now = () => new Date('2026-07-27T08:10:00.000Z');
    authenticatedFetch.mockReset().mockImplementation(
      async () => new Response(PNG_BYTES, { status: 206 }),
    );
    const repository = createShopOrderRepository(dependencies);

    const created = await repository.create(validOrder, 'generated-id');

    expect(drive.permissions.create).toHaveBeenCalledWith({
      fileId: 'generated-id',
      fields: 'id',
      requestBody: { type: 'anyone', role: 'reader' },
    });
    expect(drive.files.update).toHaveBeenCalledWith({
      fileId: 'generated-id',
      fields: 'id,webViewLink',
      requestBody: {
        appProperties: {
          status: 'active',
          finalizedAt: '2026-07-27T08:10:00.000Z',
          orderNumber: '123456',
          expectedName: storedUploadName,
          expectedMime: uploadMetadata.mimeType,
          expectedSize: String(uploadMetadata.size),
        },
      },
    });
    expect(sheets.spreadsheets.values.append).toHaveBeenCalledWith(
      expect.objectContaining({
        spreadsheetId: 'spreadsheet-id',
        range: "'Order1'!A:L",
        valueInputOption: 'RAW',
        requestBody: {
          values: [[
            '',
            'หสบ-ช.',
            'หบพ-ช.',
            '123456',
            expect.any(Number),
            'ทดสอบ',
            'W11',
            'สมชาย',
            '',
            '',
            'https://drive.google.com/file/d/generated-id/view',
            '',
          ]],
        },
      }),
    );
    expect(sheets.spreadsheets.values.update).toHaveBeenCalledWith({
      spreadsheetId: 'spreadsheet-id',
      range: "'Order1'!A3",
      valueInputOption: 'RAW',
      requestBody: { values: [[2]] },
    });
    expect(drive.files.update.mock.invocationCallOrder[0]).toBeLessThan(
      sheets.spreadsheets.values.append.mock.invocationCallOrder[0],
    );
    expect(sheets.spreadsheets.batchUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        spreadsheetId: 'spreadsheet-id',
        requestBody: {
          requests: expect.arrayContaining([
            expect.objectContaining({
              repeatCell: expect.objectContaining({
                cell: {
                  userEnteredFormat: {
                    numberFormat: { type: 'DATE', pattern: 'dd/MM/yyyy' },
                  },
                },
              }),
            }),
          ]),
        },
      }),
    );
    expect(created).toEqual({
      order: expect.objectContaining({
        no: 2,
        fileUrl:
          'https://drive.google.com/file/d/generated-id/view',
      }),
      attachment: {
        status: 'attached',
        fileId: 'generated-id',
        fileUrl:
          'https://drive.google.com/file/d/generated-id/view',
      },
      repairAttachment: { status: 'none' },
    });
  });

  it('finalizes both uploads and writes Pic and Picแจ้งซ่อม links', async () => {
    const { dependencies, authenticatedFetch, drive, sheets } =
      makeDependencies();
    const repository = createShopOrderRepository(dependencies);
    const primaryUrl =
      'https://drive.google.com/file/d/generated-id/view';
    const repairUrl =
      'https://drive.google.com/file/d/repair-generated-id/view';

    drive.files.get.mockImplementation(
      ({ fileId }: { fileId: string }) =>
        Promise.resolve({
          data: {
            id: fileId,
            name: storedUploadName,
            mimeType: uploadMetadata.mimeType,
            size: String(uploadMetadata.size),
            parents: ['folder-id'],
            appProperties: {
              status: 'pending',
              pendingSince,
              orderNumber: validOrder.number,
              expectedName: storedUploadName,
              expectedMime: uploadMetadata.mimeType,
              expectedSize: String(uploadMetadata.size),
            },
            webViewLink:
              'https://drive.google.com/file/d/' + fileId + '/view',
            trashed: false,
          },
        }),
    );
    drive.files.update.mockImplementation(
      ({ fileId }: { fileId: string }) =>
        Promise.resolve({
          data: {
            webViewLink:
              'https://drive.google.com/file/d/' + fileId + '/view',
          },
        }),
    );
    authenticatedFetch.mockReset().mockImplementation(
      async () => new Response(PNG_BYTES, { status: 206 }),
    );

    const created = await repository.create(
      validOrder,
      'generated-id',
      'repair-generated-id',
    );

    expect(sheets.spreadsheets.values.append).toHaveBeenCalledWith(
      expect.objectContaining({
        range: "'Order1'!A:L",
        requestBody: {
          values: [[
            expect.anything(),
            expect.anything(),
            expect.anything(),
            '123456',
            expect.any(Number),
            expect.any(String),
            'W11',
            expect.any(String),
            '',
            '',
            primaryUrl,
            repairUrl,
          ]],
        },
      }),
    );
    expect(created).toMatchObject({
      order: {
        fileUrl: primaryUrl,
        repairFileUrl: repairUrl,
      },
      attachment: {
        status: 'attached',
        fileId: 'generated-id',
        fileUrl: primaryUrl,
      },
      repairAttachment: {
        status: 'attached',
        fileId: 'repair-generated-id',
        fileUrl: repairUrl,
      },
    });
  });
  it('returns no attachment outcome when a new order has no upload', async () => {
    const { dependencies, drive } = makeDependencies();
    const repository = createShopOrderRepository(dependencies);

    await expect(repository.create(validOrder)).resolves.toMatchObject({
      order: { no: 2, fileUrl: '' },
      attachment: { status: 'none' },
    });
    expect(drive.files.get).not.toHaveBeenCalled();
  });

  it('rechecks a stable sequence before updating B-K and retains the old Drive file', async () => {
    const { dependencies, sheets, drive } = makeDependencies();
    const repository = createShopOrderRepository(dependencies);

    const result = await repository.update(
      1,
      { ...validOrder, subject: 'แก้ไข' },
    );

    const aColumnReads = sheets.spreadsheets.values.get.mock.calls
      .filter(([request]) => request.range === "'Order1'!A2:A");
    expect(aColumnReads).toHaveLength(2);
    expect(sheets.spreadsheets.values.update).toHaveBeenCalledWith(
      expect.objectContaining({
        range: "'Order1'!B2:L2",
        valueInputOption: 'RAW',
        requestBody: {
          values: [[
            'หสบ-ช.', 'หบพ-ช.', '123456', expect.any(Number), 'แก้ไข',
            'W11', 'สมชาย', '', '', '', '',
          ]],
        },
      }),
    );
    expect(drive.files.update).not.toHaveBeenCalled();
    expect(drive.permissions.create).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      order: {
        no: 1,
        fileUrl: '',
      },
      attachment: { status: 'none' },
    });
  });

  it('preserves the current attachment when a replacement cannot be verified', async () => {
    const { dependencies, sheets, drive } = makeDependencies();
    const currentFileUrl =
      'https://drive.google.com/file/d/current-file/view';
    sheets.spreadsheets.values.get.mockImplementation(
      ({ range }: { range: string }) => {
        if (range.includes('DepartmentList')) {
          return Promise.resolve({ data: { values: [['หบพ-ช.']] } });
        }
        if (range.endsWith('!A2:A')) {
          return Promise.resolve({ data: { values: [[1]] } });
        }
        if (/!A2:L2$/.test(range)) {
          return Promise.resolve({
            data: {
              values: [[
                1,
                'หสบ-ช.',
                'หบพ-ช.',
                '123456',
                46204,
                'เรื่อง',
                'W11',
                '',
                '',
                '',
                currentFileUrl,
              ]],
            },
          });
        }
        return Promise.resolve({ data: { values: [] } });
      },
    );
    drive.files.get.mockRejectedValueOnce({
      response: { status: 404 },
    });
    const repository = createShopOrderRepository(dependencies);

    await expect(
      repository.update(
        1,
        { ...validOrder, subject: 'แก้ไข' },
        'bad-file-id',
      ),
    ).resolves.toMatchObject({
      order: { no: 1, fileUrl: currentFileUrl },
      attachment: {
        status: 'order_saved_without_attachment',
        code: 'ORDER_SAVED_WITHOUT_ATTACHMENT',
      },
    });
    expect(sheets.spreadsheets.values.update).toHaveBeenCalledWith(
      expect.objectContaining({
        requestBody: {
          values: [[
            'หสบ-ช.',
            'หบพ-ช.',
            '123456',
            expect.any(Number),
            'แก้ไข',
            'W11',
            'สมชาย',
            '',
            '',
            currentFileUrl,
            '',
          ]],
        },
      }),
    );
  });

  it('rechecks the sequence before clearing A-K and never deletes its Drive file', async () => {
    const { dependencies, sheets, drive } = makeDependencies();
    const repository = createShopOrderRepository(dependencies);

    await repository.remove(1);

    const aColumnReads = sheets.spreadsheets.values.get.mock.calls
      .filter(([request]) => request.range === "'Order1'!A2:A");
    expect(aColumnReads).toHaveLength(2);
    expect(sheets.spreadsheets.values.clear).toHaveBeenCalledWith({
      spreadsheetId: 'spreadsheet-id',
      range: "'Order1'!A2:L2",
      requestBody: {},
    });
    expect(drive.files.update).not.toHaveBeenCalled();
  });

  it('schedules the previous owned active attachment after a replacement is saved to Sheets', async () => {
    const { dependencies, authenticatedFetch, sheets, drive } =
      makeDependencies();
    dependencies.now = () => new Date('2026-07-27T00:00:00.000Z');
    setCurrentAttachment(
      sheets,
      'https://drive.google.com/file/d/old-oauth-file-id/view',
    );
    authenticatedFetch.mockReset().mockImplementation(
      async () => new Response(PNG_BYTES, { status: 206 }),
    );
    drive.files.get
      .mockResolvedValueOnce({
        data: {
          id: 'generated-id',
          name: storedUploadName,
          mimeType: uploadMetadata.mimeType,
          size: String(uploadMetadata.size),
          parents: ['folder-id'],
          appProperties: {
            status: 'pending',
            pendingSince,
            orderNumber: validOrder.number,
            expectedName: storedUploadName,
            expectedMime: uploadMetadata.mimeType,
            expectedSize: String(uploadMetadata.size),
          },
          webViewLink:
            'https://drive.google.com/file/d/generated-id/view',
          trashed: false,
        },
      })
      .mockResolvedValueOnce({
        data: {
          id: 'old-oauth-file-id',
          parents: ['folder-id'],
          appProperties: {
            status: 'active',
            finalizedAt: '2026-07-01T00:00:00.000Z',
            orderNumber: '123456',
          },
          trashed: false,
        },
      });
    const repository = createShopOrderRepository(dependencies);

    await expect(
      repository.update(1, validOrder, 'generated-id'),
    ).resolves.toMatchObject({
      order: {
        fileUrl:
          'https://drive.google.com/file/d/generated-id/view',
      },
      attachment: { status: 'attached', fileId: 'generated-id' },
    });

    expect(drive.files.get).toHaveBeenLastCalledWith({
      fileId: 'old-oauth-file-id',
      fields: 'id,parents,appProperties,trashed',
    });
    expect(drive.files.update).toHaveBeenLastCalledWith({
      fileId: 'old-oauth-file-id',
      fields: 'id',
      requestBody: {
        appProperties: {
          status: 'scheduled_delete',
          deleteAfter: '2026-08-26T00:00:00.000Z',
          orderNumber: '123456',
          reason: 'replaced',
        },
      },
    });
    const scheduleCallIndex = drive.files.update.mock.calls.findIndex(
      ([request]) => request.fileId === 'old-oauth-file-id',
    );
    expect(
      sheets.spreadsheets.values.update.mock.invocationCallOrder.at(-1),
    ).toBeLessThan(
      drive.files.update.mock.invocationCallOrder[scheduleCallIndex],
    );
  });

  it('schedules an owned active attachment after its order is cleared from Sheets', async () => {
    const { dependencies, sheets, drive } = makeDependencies();
    dependencies.now = () => new Date('2026-07-27T00:00:00.000Z');
    setCurrentAttachment(
      sheets,
      'https://drive.google.com/file/d/old-oauth-file-id/view',
    );
    drive.files.get.mockResolvedValueOnce({
      data: {
        id: 'old-oauth-file-id',
        parents: ['folder-id'],
        appProperties: {
          status: 'active',
          finalizedAt: '2026-07-01T00:00:00.000Z',
          orderNumber: '123456',
        },
        trashed: false,
      },
    });
    const repository = createShopOrderRepository(dependencies);

    await expect(repository.remove(1)).resolves.toBeUndefined();

    expect(drive.files.update).toHaveBeenCalledWith({
      fileId: 'old-oauth-file-id',
      fields: 'id',
      requestBody: {
        appProperties: {
          status: 'scheduled_delete',
          deleteAfter: '2026-08-26T00:00:00.000Z',
          orderNumber: '123456',
          reason: 'order_deleted',
        },
      },
    });
    expect(
      sheets.spreadsheets.values.clear.mock.invocationCallOrder[0],
    ).toBeLessThan(drive.files.update.mock.invocationCallOrder[0]);
  });

  it.each([
    [
      'a noncanonical legacy URL',
      'https://example.com/legacy-file',
      undefined,
    ],
    [
      'a lookalike Drive URL',
      'https://drive.google.com.evil.test/file/d/old-oauth-file-id/view',
      undefined,
    ],
    [
      'Drive metadata forbidden to this OAuth client',
      'https://drive.google.com/file/d/old-oauth-file-id/view',
      { error: { response: { status: 403 } } },
    ],
    [
      'Drive metadata missing',
      'https://drive.google.com/file/d/old-oauth-file-id/view',
      { error: { response: { status: 404 } } },
    ],
    [
      'a file in another parent folder',
      'https://drive.google.com/file/d/old-oauth-file-id/view',
      {
        data: {
          id: 'old-oauth-file-id',
          parents: ['other-folder-id'],
          appProperties: {
            status: 'active',
            finalizedAt: '2026-07-01T00:00:00.000Z',
            orderNumber: '123456',
          },
          trashed: false,
        },
      },
    ],
    [
      'a file without lifecycle metadata',
      'https://drive.google.com/file/d/old-oauth-file-id/view',
      {
        data: {
          id: 'old-oauth-file-id',
          parents: ['folder-id'],
          appProperties: {},
          trashed: false,
        },
      },
    ],
    [
      'a file that is not active',
      'https://drive.google.com/file/d/old-oauth-file-id/view',
      {
        data: {
          id: 'old-oauth-file-id',
          parents: ['folder-id'],
          appProperties: {
            status: 'pending',
            pendingSince: '2026-07-01T00:00:00.000Z',
            orderNumber: '123456',
          },
          trashed: false,
        },
      },
    ],
    [
      'a file that is already trashed',
      'https://drive.google.com/file/d/old-oauth-file-id/view',
      {
        data: {
          id: 'old-oauth-file-id',
          parents: ['folder-id'],
          appProperties: {
            status: 'active',
            finalizedAt: '2026-07-01T00:00:00.000Z',
            orderNumber: '123456',
          },
          trashed: true,
        },
      },
    ],
  ])('safely skips scheduling %s after deleting the order', async (
    _caseName,
    fileUrl,
    driveResult,
  ) => {
    const { dependencies, sheets, drive } = makeDependencies();
    setCurrentAttachment(sheets, fileUrl);
    if (driveResult && 'error' in driveResult) {
      drive.files.get.mockRejectedValueOnce(driveResult.error);
    } else if (driveResult) {
      drive.files.get.mockResolvedValueOnce(driveResult);
    }
    const repository = createShopOrderRepository(dependencies);

    await expect(repository.remove(1)).resolves.toBeUndefined();

    expect(sheets.spreadsheets.values.clear).toHaveBeenCalledTimes(1);
    expect(drive.files.update).not.toHaveBeenCalled();
  });

  it('does not schedule an attachment when clearing its Sheet row fails', async () => {
    const { dependencies, sheets, drive } = makeDependencies();
    setCurrentAttachment(
      sheets,
      'https://drive.google.com/file/d/old-oauth-file-id/view',
    );
    sheets.spreadsheets.values.clear.mockRejectedValueOnce(
      new Error('sheet failed'),
    );
    const repository = createShopOrderRepository(dependencies);

    await expect(repository.remove(1)).rejects.toThrow('sheet failed');

    expect(drive.files.get).not.toHaveBeenCalled();
    expect(drive.files.update).not.toHaveBeenCalled();
  });

  it('keeps a successful Sheet delete when scheduling temporarily fails', async () => {
    const { dependencies, sheets, drive } = makeDependencies();
    setCurrentAttachment(
      sheets,
      'https://drive.google.com/file/d/old-oauth-file-id/view',
    );
    drive.files.get.mockRejectedValueOnce({
      response: { status: 500 },
    });
    const repository = createShopOrderRepository(dependencies);

    await expect(repository.remove(1)).resolves.toBeUndefined();

    expect(sheets.spreadsheets.values.clear).toHaveBeenCalledTimes(1);
    expect(drive.files.update).not.toHaveBeenCalled();
  });

  it('keeps a successful replacement when its retired attachment cannot be scheduled', async () => {
    const { dependencies, authenticatedFetch, sheets, drive } =
      makeDependencies();
    setCurrentAttachment(
      sheets,
      'https://drive.google.com/file/d/old-oauth-file-id/view',
    );
    authenticatedFetch.mockReset().mockImplementation(
      async () => new Response(PNG_BYTES, { status: 206 }),
    );
    drive.files.get
      .mockResolvedValueOnce({
        data: {
          id: 'generated-id',
          name: storedUploadName,
          mimeType: uploadMetadata.mimeType,
          size: String(uploadMetadata.size),
          parents: ['folder-id'],
          appProperties: {
            status: 'pending',
            pendingSince,
            orderNumber: validOrder.number,
            expectedName: storedUploadName,
            expectedMime: uploadMetadata.mimeType,
            expectedSize: String(uploadMetadata.size),
          },
          webViewLink:
            'https://drive.google.com/file/d/generated-id/view',
          trashed: false,
        },
      })
      .mockResolvedValueOnce({
        data: {
          id: 'old-oauth-file-id',
          parents: ['folder-id'],
          appProperties: {
            status: 'active',
            finalizedAt: '2026-07-01T00:00:00.000Z',
            orderNumber: '123456',
          },
          trashed: false,
        },
      });
    drive.files.update
      .mockResolvedValueOnce({
        data: {
          id: 'generated-id',
          webViewLink:
            'https://drive.google.com/file/d/generated-id/view',
        },
      })
      .mockRejectedValueOnce({ response: { status: 500 } });
    const repository = createShopOrderRepository(dependencies);

    await expect(
      repository.update(1, validOrder, 'generated-id'),
    ).resolves.toMatchObject({
      order: {
        fileUrl:
          'https://drive.google.com/file/d/generated-id/view',
      },
      attachment: { status: 'attached', fileId: 'generated-id' },
    });

    expect(sheets.spreadsheets.values.update).toHaveBeenCalled();
    expect(drive.permissions.delete).not.toHaveBeenCalled();
  });

  it('does not inspect the old attachment when a replacement Sheet update fails', async () => {
    const { dependencies, authenticatedFetch, sheets, drive } =
      makeDependencies();
    setCurrentAttachment(
      sheets,
      'https://drive.google.com/file/d/old-oauth-file-id/view',
    );
    authenticatedFetch.mockReset().mockImplementation(
      async () => new Response(PNG_BYTES, { status: 206 }),
    );
    sheets.spreadsheets.values.update.mockRejectedValueOnce(
      new Error('sheet failed'),
    );
    const repository = createShopOrderRepository(dependencies);

    await expect(
      repository.update(1, validOrder, 'generated-id'),
    ).rejects.toThrow('sheet failed');

    expect(drive.files.get).toHaveBeenCalledTimes(1);
    expect(drive.files.get).not.toHaveBeenCalledWith(
      expect.objectContaining({ fileId: 'old-oauth-file-id' }),
    );
  });

  it('restores pending metadata and removes its new permission when Sheet append fails', async () => {
    const { dependencies, authenticatedFetch, sheets, drive } = makeDependencies();
    authenticatedFetch.mockReset().mockImplementation(
      async () => new Response(PNG_BYTES, { status: 206 }),
    );
    sheets.spreadsheets.values.append.mockRejectedValue(new Error('sheet failed'));
    const repository = createShopOrderRepository(dependencies);

    await expect(repository.create(validOrder, 'generated-id')).rejects.toThrow('sheet failed');
    expect(drive.permissions.delete).toHaveBeenCalledWith({
      fileId: 'generated-id',
      permissionId: 'public-permission-id',
    });
    expect(drive.files.update).toHaveBeenLastCalledWith({
      fileId: 'generated-id',
      fields: 'id',
      requestBody: {
        appProperties: {
          status: 'pending',
          pendingSince,
          orderNumber: '123456',
          expectedName: storedUploadName,
          expectedMime: 'image/png',
          expectedSize: '8',
        },
      },
    });
    expect(sheets.spreadsheets.values.clear).not.toHaveBeenCalled();
  });

  it('does not convert order or Sheet validation failures into attachment warnings', async () => {
    const { dependencies, sheets } = makeDependencies();
    const repository = createShopOrderRepository(dependencies);

    await expect(
      repository.create({ ...validOrder, number: 'invalid' }),
    ).rejects.toThrow('6');
    sheets.spreadsheets.values.append.mockRejectedValueOnce(
      new Error('sheet down'),
    );
    await expect(repository.create(validOrder)).rejects.toThrow(
      'sheet down',
    );
  });

  it('lazily uses Sheets-only JWT and refresh-token OAuth for Drive', async () => {
    vi.resetModules();
    const previousEnvironment = {
      clientEmail: process.env.GOOGLE_CLIENT_EMAIL,
      privateKey: process.env.GOOGLE_PRIVATE_KEY,
      spreadsheetId: process.env.SHOP_ORDER_SHEET_ID,
      sheetName: process.env.SHOP_ORDER_SHEET_NAME,
      folderId: process.env.SHOP_ORDER_DRIVE_FOLDER_ID,
      oauthClientId: process.env.GOOGLE_DRIVE_OAUTH_CLIENT_ID,
      oauthClientSecret: process.env.GOOGLE_DRIVE_OAUTH_CLIENT_SECRET,
      oauthRefreshToken: process.env.GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN,
    };
    Object.assign(process.env, {
      GOOGLE_CLIENT_EMAIL: 'sheets@example.iam.gserviceaccount.com',
      GOOGLE_PRIVATE_KEY:
        '-----BEGIN PRIVATE KEY-----\\nkey\\n-----END PRIVATE KEY-----',
      SHOP_ORDER_SHEET_ID: 'spreadsheet-id',
      SHOP_ORDER_SHEET_NAME: 'Order1',
      SHOP_ORDER_DRIVE_FOLDER_ID: 'folder-id',
      GOOGLE_DRIVE_OAUTH_CLIENT_ID: 'oauth-client-id',
      GOOGLE_DRIVE_OAUTH_CLIENT_SECRET: 'oauth-client-secret',
      GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN: 'refresh-token',
    });

    const sheetAuth = { getAccessToken: vi.fn() };
    const driveAuth = {
      setCredentials: vi.fn(),
      getAccessToken: vi.fn().mockResolvedValue({ token: 'drive-access-token' }),
    };
    const JWT = vi.fn(function JwtConstructor() {
      return sheetAuth;
    });
    const OAuth2 = vi.fn(function OAuth2Constructor() {
      return driveAuth;
    });
    const sheetsClient = { spreadsheets: {} };
    const driveClient = { files: {}, permissions: {} };
    const sheets = vi.fn().mockReturnValue(sheetsClient);
    const drive = vi.fn().mockReturnValue(driveClient);
    vi.doMock('googleapis', () => ({
      google: {
        auth: { JWT, OAuth2 },
        sheets,
        drive,
      },
    }));

    try {
      const repositoryModule = await import('./repository');

      expect(JWT).not.toHaveBeenCalled();
      expect(OAuth2).not.toHaveBeenCalled();

      const repository = await repositoryModule.getShopOrderRepository();

      expect(JWT).toHaveBeenCalledWith({
        email: 'sheets@example.iam.gserviceaccount.com',
        key: '-----BEGIN PRIVATE KEY-----\nkey\n-----END PRIVATE KEY-----',
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
      expect(OAuth2).toHaveBeenCalledWith(
        'oauth-client-id',
        'oauth-client-secret',
      );
      expect(driveAuth.setCredentials).toHaveBeenCalledWith({
        refresh_token: 'refresh-token',
      });
      expect(sheets).toHaveBeenCalledWith({ version: 'v4', auth: sheetAuth });
      expect(drive).toHaveBeenCalledWith({ version: 'v3', auth: driveAuth });
      expect(JSON.stringify(repository)).not.toContain('refresh-token');
    } finally {
      vi.doUnmock('googleapis');
      for (const [name, value] of Object.entries({
        GOOGLE_CLIENT_EMAIL: previousEnvironment.clientEmail,
        GOOGLE_PRIVATE_KEY: previousEnvironment.privateKey,
        SHOP_ORDER_SHEET_ID: previousEnvironment.spreadsheetId,
        SHOP_ORDER_SHEET_NAME: previousEnvironment.sheetName,
        SHOP_ORDER_DRIVE_FOLDER_ID: previousEnvironment.folderId,
        GOOGLE_DRIVE_OAUTH_CLIENT_ID: previousEnvironment.oauthClientId,
        GOOGLE_DRIVE_OAUTH_CLIENT_SECRET:
          previousEnvironment.oauthClientSecret,
        GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN:
          previousEnvironment.oauthRefreshToken,
      })) {
        if (value === undefined) {
          delete process.env[name];
        } else {
          process.env[name] = value;
        }
      }
      vi.resetModules();
    }
  });

  it.each([
    'GOOGLE_DRIVE_OAUTH_CLIENT_ID',
    'GOOGLE_DRIVE_OAUTH_CLIENT_SECRET',
    'GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN',
  ])(
    'classifies a missing %s without exposing OAuth configuration',
    async (missingVariable) => {
      vi.resetModules();
      const oauthSecret = 'oauth-secret-must-not-leak';
      const previousEnvironment = { ...process.env };
      Object.assign(process.env, {
        GOOGLE_CLIENT_EMAIL: 'sheets@example.iam.gserviceaccount.com',
        GOOGLE_PRIVATE_KEY:
          '-----BEGIN PRIVATE KEY-----\\nkey\\n-----END PRIVATE KEY-----',
        SHOP_ORDER_SHEET_ID: 'spreadsheet-id',
        SHOP_ORDER_SHEET_NAME: 'Order1',
        SHOP_ORDER_DRIVE_FOLDER_ID: 'folder-id',
        GOOGLE_DRIVE_OAUTH_CLIENT_ID: oauthSecret,
        GOOGLE_DRIVE_OAUTH_CLIENT_SECRET: oauthSecret,
        GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN: oauthSecret,
      });
      delete process.env[missingVariable];

      const JWT = vi.fn(function JwtConstructor() {
        return {};
      });
      const OAuth2 = vi.fn();
      vi.doMock('googleapis', () => ({
        google: {
          auth: { JWT, OAuth2 },
          sheets: vi.fn(),
          drive: vi.fn(),
        },
      }));
      const errorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);

      try {
        const repositoryModule = await import('./repository');

        await expect(
          repositoryModule.getShopOrderRepository(),
        ).rejects.toMatchObject({
          code: 'DRIVE_OAUTH_CONFIGURATION_REQUIRED',
          message:
            'การตั้งค่า Google Drive OAuth ไม่ครบ กรุณาติดต่อผู้ดูแลระบบ',
        });
        expect(JSON.stringify(errorSpy.mock.calls)).not.toContain(oauthSecret);
        expect(OAuth2).not.toHaveBeenCalled();

        // Second call should re-attempt repository creation
        await expect(
          repositoryModule.getShopOrderRepository(),
        ).rejects.toMatchObject({
          code: 'DRIVE_OAUTH_CONFIGURATION_REQUIRED',
        });
      } finally {
        vi.doUnmock('googleapis');
        for (const name of Object.keys(process.env)) {
          if (!(name in previousEnvironment)) {
            delete process.env[name];
          }
        }
        Object.assign(process.env, previousEnvironment);
        errorSpy.mockRestore();
        vi.resetModules();
      }
    },
  );

  it.each(['image/png', 'application/pdf'])(
    'returns an authenticated image thumbnail for an active owned %s attachment on the current Sheet order',
    async (mimeType) => {
      const { dependencies, sheets, drive, authenticatedFetch } =
        makeDependencies();
      const thumbnailBytes = new Uint8Array([1, 2, 3, 4]);
      const thumbnailLink =
        'https://lh3.googleusercontent.com/drive-thumbnail-id=s220';
      setCurrentAttachment(
        sheets,
        'https://drive.google.com/file/d/current-file-id/view',
      );
      drive.files.get.mockResolvedValueOnce({
        data: {
          id: 'current-file-id',
          mimeType,
          parents: ['folder-id'],
          appProperties: {
            status: 'active',
            finalizedAt: '2026-07-27T08:09:10.000Z',
            orderNumber: '123456',
          },
          thumbnailLink,
          trashed: false,
        },
      });
      authenticatedFetch.mockReset().mockResolvedValueOnce(
        new Response(thumbnailBytes, {
          status: 200,
          headers: { 'Content-Type': 'image/png' },
        }),
      );
      const repository = createShopOrderRepository(dependencies);

      await expect(repository.getAttachmentThumbnail(1)).resolves.toEqual({
        bytes: thumbnailBytes,
        contentType: 'image/png',
      });

      expect(drive.files.get).toHaveBeenCalledWith({
        fileId: 'current-file-id',
        fields:
          'id,mimeType,parents,appProperties,thumbnailLink,trashed',
      });
      expect(authenticatedFetch).toHaveBeenCalledWith(thumbnailLink, {
        method: 'GET',
        headers: { Authorization: 'Bearer access-token' },
        redirect: 'error',
      });
    },
  );

  it.each([
    [
      'a legacy URL',
      'https://example.com/legacy-file',
      undefined,
    ],
    [
      'a mismatched Drive response id',
      'https://drive.google.com/file/d/current-file-id/view',
      {
        id: 'different-file-id',
        mimeType: 'image/png',
        parents: ['folder-id'],
        appProperties: {
          status: 'active',
          finalizedAt: '2026-07-27T08:09:10.000Z',
          orderNumber: '123456',
        },
        thumbnailLink:
          'https://lh3.googleusercontent.com/drive-thumbnail-id=s220',
        trashed: false,
      },
    ],
    [
      'a file in another parent',
      'https://drive.google.com/file/d/current-file-id/view',
      {
        id: 'current-file-id',
        mimeType: 'image/png',
        parents: ['other-folder-id'],
        appProperties: {
          status: 'active',
          finalizedAt: '2026-07-27T08:09:10.000Z',
          orderNumber: '123456',
        },
        thumbnailLink:
          'https://lh3.googleusercontent.com/drive-thumbnail-id=s220',
        trashed: false,
      },
    ],
    [
      'a file for another order number',
      'https://drive.google.com/file/d/current-file-id/view',
      {
        id: 'current-file-id',
        mimeType: 'image/png',
        parents: ['folder-id'],
        appProperties: {
          status: 'active',
          finalizedAt: '2026-07-27T08:09:10.000Z',
          orderNumber: '654321',
        },
        thumbnailLink:
          'https://lh3.googleusercontent.com/drive-thumbnail-id=s220',
        trashed: false,
      },
    ],
    [
      'a pending file',
      'https://drive.google.com/file/d/current-file-id/view',
      {
        id: 'current-file-id',
        mimeType: 'image/png',
        parents: ['folder-id'],
        appProperties: {
          status: 'pending',
          pendingSince: '2026-07-27T08:09:10.000Z',
          orderNumber: '123456',
        },
        thumbnailLink:
          'https://lh3.googleusercontent.com/drive-thumbnail-id=s220',
        trashed: false,
      },
    ],
    [
      'a trashed file',
      'https://drive.google.com/file/d/current-file-id/view',
      {
        id: 'current-file-id',
        mimeType: 'image/png',
        parents: ['folder-id'],
        appProperties: {
          status: 'active',
          finalizedAt: '2026-07-27T08:09:10.000Z',
          orderNumber: '123456',
        },
        thumbnailLink:
          'https://lh3.googleusercontent.com/drive-thumbnail-id=s220',
        trashed: true,
      },
    ],
    [
      'an unsupported file type',
      'https://drive.google.com/file/d/current-file-id/view',
      {
        id: 'current-file-id',
        mimeType: 'image/gif',
        parents: ['folder-id'],
        appProperties: {
          status: 'active',
          finalizedAt: '2026-07-27T08:09:10.000Z',
          orderNumber: '123456',
        },
        thumbnailLink:
          'https://lh3.googleusercontent.com/drive-thumbnail-id=s220',
        trashed: false,
      },
    ],
    [
      'a file without a thumbnail',
      'https://drive.google.com/file/d/current-file-id/view',
      {
        id: 'current-file-id',
        mimeType: 'image/png',
        parents: ['folder-id'],
        appProperties: {
          status: 'active',
          finalizedAt: '2026-07-27T08:09:10.000Z',
          orderNumber: '123456',
        },
        trashed: false,
      },
    ],
  ])(
    'returns null without fetching thumbnail bytes for %s',
    async (_caseName, fileUrl, driveMetadata) => {
      const { dependencies, sheets, drive, authenticatedFetch } =
        makeDependencies();
      setCurrentAttachment(sheets, fileUrl);
      if (driveMetadata) {
        drive.files.get.mockResolvedValueOnce({ data: driveMetadata });
      }
      authenticatedFetch.mockClear();
      const repository = createShopOrderRepository(dependencies);

      await expect(repository.getAttachmentThumbnail(1)).resolves.toBeNull();

      expect(authenticatedFetch).not.toHaveBeenCalled();
      if (!driveMetadata) {
        expect(drive.files.get).not.toHaveBeenCalled();
      }
    },
  );

  it('rejects non-Google thumbnail links before sending an OAuth token', async () => {
    const { dependencies, sheets, drive, authenticatedFetch } =
      makeDependencies();
    setCurrentAttachment(
      sheets,
      'https://drive.google.com/file/d/current-file-id/view',
    );
    drive.files.get.mockResolvedValueOnce({
      data: {
        id: 'current-file-id',
        mimeType: 'image/png',
        parents: ['folder-id'],
        appProperties: {
          status: 'active',
          finalizedAt: '2026-07-27T08:09:10.000Z',
          orderNumber: '123456',
        },
        thumbnailLink: 'https://attacker.example/steal-token',
        trashed: false,
      },
    });
    authenticatedFetch.mockClear();
    const repository = createShopOrderRepository(dependencies);

    await expect(repository.getAttachmentThumbnail(1)).resolves.toBeNull();

    expect(authenticatedFetch).not.toHaveBeenCalled();
  });

  it('returns null when Drive responds with non-image or oversized thumbnail bytes', async () => {
    const { dependencies, sheets, drive, authenticatedFetch } =
      makeDependencies();
    setCurrentAttachment(
      sheets,
      'https://drive.google.com/file/d/current-file-id/view',
    );
    const metadata = {
      id: 'current-file-id',
      mimeType: 'image/png',
      parents: ['folder-id'],
      appProperties: {
        status: 'active',
        finalizedAt: '2026-07-27T08:09:10.000Z',
        orderNumber: '123456',
      },
      thumbnailLink:
        'https://lh3.googleusercontent.com/drive-thumbnail-id=s220',
      trashed: false,
    };
    drive.files.get.mockResolvedValue({ data: metadata });
    authenticatedFetch
      .mockReset()
      .mockResolvedValueOnce(
        new Response('not an image', {
          status: 200,
          headers: { 'Content-Type': 'text/html' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(new Uint8Array(2 * 1024 * 1024 + 1), {
          status: 200,
          headers: { 'Content-Type': 'image/png' },
        }),
      );
    const repository = createShopOrderRepository(dependencies);

    await expect(repository.getAttachmentThumbnail(1)).resolves.toBeNull();
    await expect(repository.getAttachmentThumbnail(1)).resolves.toBeNull();
  });

  it('cancels the thumbnail response stream immediately after it exceeds 2 MiB', async () => {
    const { dependencies, sheets, drive, authenticatedFetch } =
      makeDependencies();
    setCurrentAttachment(
      sheets,
      'https://drive.google.com/file/d/current-file-id/view',
    );
    drive.files.get.mockResolvedValueOnce({
      data: {
        id: 'current-file-id',
        mimeType: 'image/png',
        parents: ['folder-id'],
        appProperties: {
          status: 'active',
          finalizedAt: '2026-07-27T08:09:10.000Z',
          orderNumber: '123456',
        },
        thumbnailLink:
          'https://lh3.googleusercontent.com/drive-thumbnail-id=s220',
        trashed: false,
      },
    });
    const cancel = vi.fn();
    let chunkIndex = 0;
    const body = new ReadableStream<Uint8Array>(
      {
        pull(controller) {
          if (chunkIndex === 0) {
            controller.enqueue(new Uint8Array(2 * 1024 * 1024));
          } else if (chunkIndex === 1) {
            controller.enqueue(new Uint8Array([1]));
          } else {
            controller.close();
          }
          chunkIndex += 1;
        },
        cancel,
      },
      { highWaterMark: 0 },
    );
    authenticatedFetch.mockReset().mockResolvedValueOnce(
      new Response(body, {
        status: 200,
        headers: { 'Content-Type': 'image/png' },
      }),
    );
    const repository = createShopOrderRepository(dependencies);

    await expect(repository.getAttachmentThumbnail(1)).resolves.toBeNull();

    expect(cancel).toHaveBeenCalledTimes(1);
  });
});
