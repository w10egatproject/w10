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
    randomId: () => 'a1b2c3d4-e5f6-4789-8abc-def012345678',
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
});
