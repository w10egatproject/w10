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
          if (/!A2:K2$/.test(range)) {
            return Promise.resolve({
              data: {
                values: [[1, 'หสบ-ช.', 'หบพ-ช.', '123456', 46204, 'เรื่อง', 'W11', '', '', '', '']],
              },
            });
          }
          return Promise.resolve({ data: { values: [] } });
        }),
        append: vi.fn().mockResolvedValue({
          data: { updates: { updatedRange: "'Order1'!A3:K3" } },
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
          name: uploadMetadata.name,
          mimeType: uploadMetadata.mimeType,
          size: String(uploadMetadata.size),
          parents: ['folder-id'],
          appProperties: {
            shopOrderUpload: 'pending',
            expectedName: uploadMetadata.name,
            expectedMime: uploadMetadata.mimeType,
            expectedSize: String(uploadMetadata.size),
          },
          webViewLink: 'https://drive.google.com/file/d/generated-id/view',
          trashed: false,
        },
      }),
      update: vi.fn().mockResolvedValue({
        data: {
          webViewLink: 'https://drive.google.com/file/d/generated-id/view',
        },
      }),
    },
    permissions: {
      create: vi.fn().mockResolvedValue({ data: {} }),
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
  } satisfies ShopOrderRepositoryDependencies;

  return {
    sheets,
    drive,
    authenticatedFetch,
    dependencies,
  };
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
      ranges: ["'Order1'!A2:K", "'DepartmentList'!A2:A", "'ReceiverList'!A2:A"],
      valueRenderOption: 'UNFORMATTED_VALUE',
      dateTimeRenderOption: 'SERIAL_NUMBER',
    });
  });

  it('pre-generates an id and returns only a validated Google resumable URL', async () => {
    const { dependencies, drive, authenticatedFetch } = makeDependencies();
    const repository = createShopOrderRepository(dependencies);

    const session = await repository.createUploadSession({
      ...uploadMetadata,
      name: 'bad:name.png',
    });

    expect(drive.files.generateIds).toHaveBeenCalledWith({
      count: 1,
      space: 'drive',
      type: 'files',
    });
    expect(authenticatedFetch).toHaveBeenCalledWith(
      expect.stringContaining('uploadType=resumable'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer access-token',
          'X-Upload-Content-Length': String(uploadMetadata.size),
        }),
      }),
    );
    expect(JSON.parse(authenticatedFetch.mock.calls[0][1].body)).toMatchObject({
      id: 'generated-id',
      name: 'bad_name.png',
      parents: ['folder-id'],
      appProperties: {
        shopOrderUpload: 'pending',
        expectedName: 'bad_name.png',
      },
    });
    expect(session).toEqual({
      fileId: 'generated-id',
      uploadUrl: 'https://www.googleapis.com/upload/session-id',
      expiresAt: '2026-07-25T01:00:00.000Z',
    });
  });

  it('rejects a resumable URI outside the exact Google HTTPS origin', async () => {
    const { dependencies, authenticatedFetch } = makeDependencies();
    authenticatedFetch.mockReset().mockResolvedValue(
      new Response(null, {
        status: 200,
        headers: { location: 'https://www.googleapis.com.evil.test/session' },
      }),
    );
    const repository = createShopOrderRepository(dependencies);

    await expect(repository.createUploadSession(uploadMetadata))
      .rejects.toThrow('resumable');
  });

  it('classifies a forbidden Drive folder without exposing Google details', async () => {
    const { dependencies, authenticatedFetch } = makeDependencies();
    authenticatedFetch.mockReset().mockResolvedValue(
      new Response(null, { status: 403 }),
    );
    const repository = createShopOrderRepository(dependencies);

    await expect(repository.createUploadSession(uploadMetadata)).rejects.toMatchObject({
      code: 'DRIVE_ACCESS_FORBIDDEN',
      message: 'ไม่สามารถเข้าถึงโฟลเดอร์ Google Drive ได้',
    });
  });

  it.each([
    ['wrong parent', { parents: ['other-folder'] }],
    ['missing pending marker', { appProperties: {} }],
    ['wrong name', { name: 'other.png' }],
    ['wrong mime', { mimeType: 'application/pdf' }],
    ['wrong size', { size: '999' }],
    ['trashed', { trashed: true }],
  ])('rejects uploaded file metadata: %s', async (_label, patch) => {
    const { dependencies, drive, sheets } = makeDependencies();
    drive.files.get.mockResolvedValueOnce({
      data: {
        ...(await drive.files.get({})).data,
        ...patch,
      },
    });
    drive.files.get.mockClear();
    const repository = createShopOrderRepository(dependencies);

    await expect(repository.create(validOrder, 'generated-id')).rejects.toThrow();
    expect(drive.permissions.create).not.toHaveBeenCalled();
    expect(sheets.spreadsheets.values.append).not.toHaveBeenCalled();
  });

  it('rejects a forbidden signature before permission or Sheet mutation', async () => {
    const { dependencies, authenticatedFetch, drive, sheets } = makeDependencies();
    authenticatedFetch.mockReset().mockResolvedValue(
      new Response(new TextEncoder().encode('<script>'), { status: 206 }),
    );
    const repository = createShopOrderRepository(dependencies);

    await expect(repository.create(validOrder, 'generated-id')).rejects.toThrow('signature');
    expect(authenticatedFetch).toHaveBeenCalledWith(
      expect.stringContaining('/drive/v3/files/generated-id?alt=media'),
      expect.objectContaining({
        headers: expect.objectContaining({ Range: 'bytes=0-31' }),
      }),
    );
    expect(drive.permissions.create).not.toHaveBeenCalled();
    expect(sheets.spreadsheets.values.append).not.toHaveBeenCalled();
  });

  it('finalizes a verified file before appending RAW values and assigns sequence from the appended row', async () => {
    const { dependencies, authenticatedFetch, drive, sheets } = makeDependencies();
    authenticatedFetch.mockReset().mockResolvedValue(
      new Response(PNG_BYTES, { status: 206 }),
    );
    const repository = createShopOrderRepository(dependencies);

    const created = await repository.create(validOrder, 'generated-id');

    expect(drive.permissions.create).toHaveBeenCalledWith({
      fileId: 'generated-id',
      requestBody: { type: 'anyone', role: 'reader' },
    });
    expect(drive.files.update).toHaveBeenCalledWith({
      fileId: 'generated-id',
      fields: 'webViewLink',
      requestBody: {
        appProperties: {
          shopOrderUpload: 'finalized',
          expectedName: uploadMetadata.name,
          expectedMime: uploadMetadata.mimeType,
          expectedSize: String(uploadMetadata.size),
        },
      },
    });
    expect(sheets.spreadsheets.values.append).toHaveBeenCalledWith(
      expect.objectContaining({
        spreadsheetId: 'spreadsheet-id',
        range: "'Order1'!A:K",
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
    expect(created).toMatchObject({ no: 2, fileUrl: expect.stringContaining('generated-id') });
  });

  it('rechecks a stable sequence before updating B-K and retains the old Drive file', async () => {
    const { dependencies, sheets, drive } = makeDependencies();
    const repository = createShopOrderRepository(dependencies);

    await repository.update(1, { ...validOrder, subject: 'แก้ไข' });

    const aColumnReads = sheets.spreadsheets.values.get.mock.calls
      .filter(([request]) => request.range === "'Order1'!A2:A");
    expect(aColumnReads).toHaveLength(2);
    expect(sheets.spreadsheets.values.update).toHaveBeenCalledWith(
      expect.objectContaining({
        range: "'Order1'!B2:K2",
        valueInputOption: 'RAW',
        requestBody: {
          values: [[
            'หสบ-ช.', 'หบพ-ช.', '123456', expect.any(Number), 'แก้ไข',
            'W11', 'สมชาย', '', '', '',
          ]],
        },
      }),
    );
    expect(drive.files.update).not.toHaveBeenCalled();
    expect(drive.permissions.create).not.toHaveBeenCalled();
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
      range: "'Order1'!A2:K2",
      requestBody: {},
    });
    expect(drive.files.update).not.toHaveBeenCalled();
  });

  it('keeps a finalized file when the subsequent Sheet append fails', async () => {
    const { dependencies, authenticatedFetch, sheets, drive } = makeDependencies();
    authenticatedFetch.mockReset().mockResolvedValue(
      new Response(PNG_BYTES, { status: 206 }),
    );
    sheets.spreadsheets.values.append.mockRejectedValue(new Error('sheet failed'));
    const repository = createShopOrderRepository(dependencies);

    await expect(repository.create(validOrder, 'generated-id')).rejects.toThrow('sheet failed');
    expect(drive.files.update).toHaveBeenCalled();
    expect(sheets.spreadsheets.values.clear).not.toHaveBeenCalled();
  });
});
