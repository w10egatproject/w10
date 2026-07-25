import { describe, expect, it } from 'vitest';

import {
  MAX_UPLOAD_BYTES,
  assertUploadMetadata,
  inspectLocalFile,
  matchesAllowedSignature,
} from './file-rules';
import type { UploadMetadata } from './types';

const bytes = (...values: number[]) => new Uint8Array(values);
const blobPart = (value: Uint8Array): ArrayBuffer =>
  value.buffer.slice(
    value.byteOffset,
    value.byteOffset + value.byteLength,
  ) as ArrayBuffer;

const fixtures: Array<{
  name: string;
  mimeType: string;
  signature: Uint8Array;
}> = [
  {
    name: 'photo.jpg',
    mimeType: 'image/jpeg',
    signature: bytes(0xff, 0xd8, 0xff, 0xe0),
  },
  {
    name: 'photo.jpeg',
    mimeType: 'image/jpeg',
    signature: bytes(0xff, 0xd8, 0xff, 0xdb),
  },
  {
    name: 'photo.png',
    mimeType: 'image/png',
    signature: bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a),
  },
  {
    name: 'animation.gif',
    mimeType: 'image/gif',
    signature: bytes(...Array.from('GIF87a', (character) => character.charCodeAt(0))),
  },
  {
    name: 'animation.GIF',
    mimeType: 'image/gif',
    signature: bytes(...Array.from('GIF89a', (character) => character.charCodeAt(0))),
  },
  {
    name: 'photo.webp',
    mimeType: 'image/webp',
    signature: bytes(
      ...Array.from('RIFF', (character) => character.charCodeAt(0)),
      0x04,
      0x00,
      0x00,
      0x00,
      ...Array.from('WEBP', (character) => character.charCodeAt(0)),
    ),
  },
  {
    name: 'photo.heic',
    mimeType: 'image/heic',
    signature: bytes(
      0x00,
      0x00,
      0x00,
      0x18,
      ...Array.from('ftypheic', (character) => character.charCodeAt(0)),
    ),
  },
  {
    name: 'photo.heif',
    mimeType: 'image/heif',
    signature: bytes(
      0x00,
      0x00,
      0x00,
      0x18,
      ...Array.from('ftypmif1', (character) => character.charCodeAt(0)),
    ),
  },
  {
    name: 'document.pdf',
    mimeType: 'application/pdf',
    signature: bytes(...Array.from('%PDF-', (character) => character.charCodeAt(0))),
  },
  {
    name: 'legacy.doc',
    mimeType: 'application/msword',
    signature: bytes(0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1),
  },
  {
    name: 'modern.docx',
    mimeType:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    signature: bytes(0x50, 0x4b, 0x03, 0x04),
  },
  {
    name: 'legacy.xls',
    mimeType: 'application/vnd.ms-excel',
    signature: bytes(0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1),
  },
  {
    name: 'modern.xlsx',
    mimeType:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    signature: bytes(0x50, 0x4b, 0x03, 0x04),
  },
];

describe('Shop Order file rules', () => {
  it.each(fixtures)(
    'accepts matching extension, MIME, size, and signature for $name',
    async ({ name, mimeType, signature }) => {
      const file = new File([blobPart(signature)], name, { type: mimeType });

      await expect(inspectLocalFile(file)).resolves.toEqual({
        name,
        mimeType,
        size: signature.byteLength,
      });
      expect(
        matchesAllowedSignature(
          { name, mimeType, size: signature.byteLength },
          signature,
        ),
      ).toBe(true);
    },
  );

  it('requires extension, MIME, and signature to describe the same type', async () => {
    const png = fixtures.find(({ name }) => name === 'photo.png')!;

    await expect(
      inspectLocalFile(
        new File([blobPart(png.signature)], 'photo.jpg', { type: png.mimeType }),
      ),
    ).rejects.toThrow('ไม่รองรับไฟล์ประเภทนี้');
    await expect(
      inspectLocalFile(
        new File([blobPart(png.signature)], png.name, { type: 'image/jpeg' }),
      ),
    ).rejects.toThrow('ไม่รองรับไฟล์ประเภทนี้');
    await expect(
      inspectLocalFile(
        new File(['<script/>'], png.name, { type: png.mimeType }),
      ),
    ).rejects.toThrow('ชนิดไฟล์ไม่ถูกต้อง');
    expect(() =>
      assertUploadMetadata({
        name: 'legacy.doc',
        mimeType: 'application/vnd.ms-excel',
        size: 20,
      }),
    ).toThrow('ไม่รองรับไฟล์ประเภทนี้');
    expect(() =>
      assertUploadMetadata({
        name: 'photo.heic',
        mimeType: 'image/heif',
        size: 20,
      }),
    ).toThrow('ไม่รองรับไฟล์ประเภทนี้');
  });

  it('rejects empty files and files above 10 MiB while allowing exactly 10 MiB', () => {
    expect(() =>
      assertUploadMetadata({
        name: 'empty.pdf',
        mimeType: 'application/pdf',
        size: 0,
      }),
    ).toThrow('ไฟล์ต้องมีข้อมูล');
    expect(() =>
      assertUploadMetadata({
        name: 'large.pdf',
        mimeType: 'application/pdf',
        size: MAX_UPLOAD_BYTES + 1,
      }),
    ).toThrow('ไฟล์ต้องมีขนาดไม่เกิน 10 MB');
    expect(
      assertUploadMetadata({
        name: 'limit.pdf',
        mimeType: 'application/pdf',
        size: MAX_UPLOAD_BYTES,
      }).size,
    ).toBe(MAX_UPLOAD_BYTES);
  });

  it('rejects non-finite, fractional, and negative metadata sizes', () => {
    for (const size of [Number.NaN, Number.POSITIVE_INFINITY, -1, 1.5]) {
      expect(() =>
        assertUploadMetadata({
          name: 'document.pdf',
          mimeType: 'application/pdf',
          size,
        }),
      ).toThrow();
    }
  });

  it('sanitizes forbidden Drive filename characters without changing the extension', () => {
    expect(
      assertUploadMetadata({
        name: ' report\\draft/:*?"<>|.PDF ',
        mimeType: 'application/pdf',
        size: 20,
      }),
    ).toEqual({
      name: 'report_draft________.PDF',
      mimeType: 'application/pdf',
      size: 20,
    });
  });

  it.each([
    ['image.svg', 'image/svg+xml'],
    ['page.html', 'text/html'],
    ['program.exe', 'application/octet-stream'],
    ['no-extension', 'application/pdf'],
    ['trailing.pdf.exe', 'application/pdf'],
  ])('rejects unsupported metadata %s', (name, mimeType) => {
    expect(() => assertUploadMetadata({ name, mimeType, size: 20 })).toThrow(
      'ไม่รองรับไฟล์ประเภทนี้',
    );
  });

  it('returns false rather than throwing for truncated or mismatched signatures', () => {
    const metadata: UploadMetadata = {
      name: 'document.pdf',
      mimeType: 'application/pdf',
      size: 20,
    };

    expect(matchesAllowedSignature(metadata, bytes())).toBe(false);
    expect(matchesAllowedSignature(metadata, bytes(0x25, 0x50))).toBe(false);
    expect(
      matchesAllowedSignature(
        metadata,
        fixtures.find(({ name }) => name === 'photo.png')!.signature,
      ),
    ).toBe(false);
  });

  it('does not mistake a generic MP4 ftyp box for HEIC/HEIF', () => {
    const mp4Header = bytes(
      0x00,
      0x00,
      0x00,
      0x18,
      ...Array.from('ftypisom', (character) => character.charCodeAt(0)),
    );

    expect(
      matchesAllowedSignature(
        { name: 'spoof.heic', mimeType: 'image/heic', size: mp4Header.length },
        mp4Header,
      ),
    ).toBe(false);
  });

  it('does not treat the HEIF minor-version field as a compatible brand', () => {
    const malformedHeader = bytes(
      0x00,
      0x00,
      0x00,
      0x18,
      ...Array.from('ftypisomheic', (character) => character.charCodeAt(0)),
    );

    expect(
      matchesAllowedSignature(
        {
          name: 'spoof.heic',
          mimeType: 'image/heic',
          size: malformedHeader.length,
        },
        malformedHeader,
      ),
    ).toBe(false);
  });
});
