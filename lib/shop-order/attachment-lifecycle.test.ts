import { describe, expect, it } from 'vitest';

import {
  buildAttachmentStorageName,
  deletionDate,
  driveFileDownloadUrlFromCanonicalUrl,
  driveFileIdFromCanonicalUrl,
  isExpiredPending,
  parseAttachmentLifecycle,
} from './attachment-lifecycle';

const invalidLifecycleProperties: Array<Record<string, string>> = [
  {},
  { status: 'legacy' },
  {
    status: 'pending',
    pendingSince: 'invalid',
    orderNumber: '123456',
  },
  {
    status: 'active',
    finalizedAt: '2026-07-27T08:09:10.000Z',
    orderNumber: '12345',
  },
  {
    status: 'scheduled_delete',
    deleteAfter: '2026-08-26T08:09:10.000Z',
    orderNumber: '123456',
    reason: 'other',
  },
];

describe('Shop Order attachment lifecycle', () => {
  it('builds a sanitized storage name without the original name', () => {
    expect(
      buildAttachmentStorageName(
        {
          orderNumber: '123456',
          name: 'เงินเดือนลับ.png',
          mimeType: 'image/png',
          size: 8,
        },
        new Date('2026-07-27T08:09:10.000Z'),
        'a1b2c3d4',
      ),
    ).toBe('SO-123456-20260727-080910-a1b2c3d4.png');
  });

  it('normalizes a JPEG extension in the generated storage name', () => {
    expect(
      buildAttachmentStorageName(
        {
          orderNumber: '123456',
          name: 'original.JPEG',
          mimeType: 'image/jpeg',
          size: 8,
        },
        new Date('2026-07-27T08:09:10.000Z'),
        'a1b2c3d4',
      ),
    ).toBe('SO-123456-20260727-080910-a1b2c3d4.jpg');
  });

  it.each([
    ['invalid order number', '12345', 'a1b2c3d4'],
    ['invalid short id', '123456', 'A1B2C3D4'],
    ['short short id', '123456', 'a1b2c3'],
  ])('rejects %s when building a storage name', (_, orderNumber, shortId) => {
    expect(() =>
      buildAttachmentStorageName(
        {
          orderNumber,
          name: 'photo.png',
          mimeType: 'image/png',
          size: 8,
        },
        new Date('2026-07-27T08:09:10.000Z'),
        shortId,
      ),
    ).toThrow();
  });

  it('uses exact pending and scheduled-delete boundaries', () => {
    expect(
      isExpiredPending(
        '2026-07-26T00:00:00.000Z',
        new Date('2026-07-27T00:00:00.000Z'),
      ),
    ).toBe(true);
    expect(
      isExpiredPending(
        '2026-07-26T00:00:00.001Z',
        new Date('2026-07-27T00:00:00.000Z'),
      ),
    ).toBe(false);
    expect(deletionDate(new Date('2026-07-27T00:00:00.000Z'))).toBe(
      '2026-08-26T00:00:00.000Z',
    );
  });

  it('treats malformed lifecycle timestamps as not expired', () => {
    expect(
      isExpiredPending(
        'not-a-timestamp',
        new Date('2026-07-27T00:00:00.000Z'),
      ),
    ).toBe(false);
  });

  it.each([
    [
      {
        status: 'pending',
        pendingSince: '2026-07-27T08:09:10.000Z',
        orderNumber: '123456',
      },
      {
        status: 'pending',
        pendingSince: '2026-07-27T08:09:10.000Z',
        orderNumber: '123456',
      },
    ],
    [
      {
        status: 'active',
        finalizedAt: '2026-07-27T08:09:10.000Z',
        orderNumber: '123456',
      },
      {
        status: 'active',
        finalizedAt: '2026-07-27T08:09:10.000Z',
        orderNumber: '123456',
      },
    ],
    [
      {
        status: 'scheduled_delete',
        deleteAfter: '2026-08-26T08:09:10.000Z',
        orderNumber: '123456',
        reason: 'replaced',
      },
      {
        status: 'scheduled_delete',
        deleteAfter: '2026-08-26T08:09:10.000Z',
        orderNumber: '123456',
        reason: 'replaced',
      },
    ],
  ])('parses a valid %s lifecycle', (properties, expected) => {
    expect(parseAttachmentLifecycle(properties)).toEqual(expected);
  });

  it.each(invalidLifecycleProperties)(
    'rejects malformed lifecycle properties %#',
    (properties) => {
      expect(parseAttachmentLifecycle(properties)).toBeNull();
    },
  );

  it.each([
    [
      'https://drive.google.com/file/d/1AbC_def-234/view',
      '1AbC_def-234',
    ],
    [
      'https://drive.google.com/file/d/1AbC_def-234/view?usp=sharing',
      '1AbC_def-234',
    ],
  ])('extracts the file id only from a canonical Drive URL', (url, fileId) => {
    expect(driveFileIdFromCanonicalUrl(url)).toBe(fileId);
  });

  it('builds a safe public Drive download URL from a canonical file URL', () => {
    expect(
      driveFileDownloadUrlFromCanonicalUrl(
        'https://drive.google.com/file/d/1AbC_def-234/view?usp=sharing',
      ),
    ).toBe(
      'https://drive.google.com/uc?export=download&id=1AbC_def-234',
    );
  });

  it('does not build a public download URL from a non-canonical URL', () => {
    expect(
      driveFileDownloadUrlFromCanonicalUrl(
        'https://drive.google.com/open?id=1AbC_def-234',
      ),
    ).toBeNull();
  });

  it.each([
    'https://drive.google.com/open?id=1AbC_def-234',
    'https://docs.google.com/document/d/1AbC_def-234/edit',
    'https://example.com/file/d/1AbC_def-234/view',
    'not-a-url',
  ])('rejects a non-canonical Drive URL %s', (url) => {
    expect(driveFileIdFromCanonicalUrl(url)).toBeNull();
  });
});
