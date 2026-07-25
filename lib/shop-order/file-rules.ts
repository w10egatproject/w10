import type { UploadMetadata } from './types';

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const INVALID_FILENAME_CHARACTERS = /[\\/:*?"<>|\u0000-\u001f\u007f]/g;
const SIGNATURE_BYTES_TO_READ = 32;

type FileKind =
  | 'gif'
  | 'heif'
  | 'jpeg'
  | 'ole'
  | 'pdf'
  | 'png'
  | 'webp'
  | 'zip';

interface AllowedFileType {
  mimeType: string;
  signature: FileKind;
}

const ALLOWED_FILE_TYPES: Readonly<Record<string, AllowedFileType>> = {
  doc: {
    mimeType: 'application/msword',
    signature: 'ole',
  },
  docx: {
    mimeType:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    signature: 'zip',
  },
  gif: {
    mimeType: 'image/gif',
    signature: 'gif',
  },
  heic: {
    mimeType: 'image/heic',
    signature: 'heif',
  },
  heif: {
    mimeType: 'image/heif',
    signature: 'heif',
  },
  jpeg: {
    mimeType: 'image/jpeg',
    signature: 'jpeg',
  },
  jpg: {
    mimeType: 'image/jpeg',
    signature: 'jpeg',
  },
  pdf: {
    mimeType: 'application/pdf',
    signature: 'pdf',
  },
  png: {
    mimeType: 'image/png',
    signature: 'png',
  },
  webp: {
    mimeType: 'image/webp',
    signature: 'webp',
  },
  xls: {
    mimeType: 'application/vnd.ms-excel',
    signature: 'ole',
  },
  xlsx: {
    mimeType:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    signature: 'zip',
  },
};

const HEIF_BRANDS = new Set([
  'heic',
  'heix',
  'hevc',
  'hevx',
  'heim',
  'heis',
  'mif1',
  'msf1',
]);

const SIGNATURES = {
  jpeg: [0xff, 0xd8, 0xff],
  png: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  pdf: [0x25, 0x50, 0x44, 0x46, 0x2d],
  ole: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1],
  zip: [0x50, 0x4b, 0x03, 0x04],
} as const;

function getExtension(name: string): string {
  const finalDot = name.lastIndexOf('.');
  return finalDot > -1 ? name.slice(finalDot + 1).toLowerCase() : '';
}

function hasBytes(
  bytes: Uint8Array,
  expected: readonly number[],
  offset = 0,
): boolean {
  return (
    bytes.byteLength >= offset + expected.length &&
    expected.every((value, index) => bytes[offset + index] === value)
  );
}

function hasAscii(bytes: Uint8Array, expected: string, offset = 0): boolean {
  return hasBytes(
    bytes,
    Array.from(expected, (character) => character.charCodeAt(0)),
    offset,
  );
}

function hasHeifSignature(bytes: Uint8Array): boolean {
  if (!hasAscii(bytes, 'ftyp', 4) || bytes.byteLength < 12) {
    return false;
  }

  const brandOffsets = [8];
  for (let offset = 16; offset + 4 <= bytes.byteLength; offset += 4) {
    brandOffsets.push(offset);
  }

  for (const offset of brandOffsets) {
    const brand = String.fromCharCode(...bytes.subarray(offset, offset + 4));
    if (HEIF_BRANDS.has(brand)) {
      return true;
    }
  }

  return false;
}

function signatureMatches(kind: FileKind, bytes: Uint8Array): boolean {
  switch (kind) {
    case 'gif':
      return hasAscii(bytes, 'GIF87a') || hasAscii(bytes, 'GIF89a');
    case 'heif':
      return hasHeifSignature(bytes);
    case 'jpeg':
      return hasBytes(bytes, SIGNATURES.jpeg);
    case 'ole':
      return hasBytes(bytes, SIGNATURES.ole);
    case 'pdf':
      return hasBytes(bytes, SIGNATURES.pdf);
    case 'png':
      return hasBytes(bytes, SIGNATURES.png);
    case 'webp':
      return hasAscii(bytes, 'RIFF') && hasAscii(bytes, 'WEBP', 8);
    case 'zip':
      return hasBytes(bytes, SIGNATURES.zip);
  }
}

function readBlobBytes(blob: Blob): Promise<Uint8Array> {
  if (typeof blob.arrayBuffer === 'function') {
    return blob.arrayBuffer().then((buffer) => new Uint8Array(buffer));
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์ได้'));
    reader.onload = () => {
      if (!(reader.result instanceof ArrayBuffer)) {
        reject(new Error('ไม่สามารถอ่านไฟล์ได้'));
        return;
      }
      resolve(new Uint8Array(reader.result));
    };
    reader.readAsArrayBuffer(blob);
  });
}

export function assertUploadMetadata(metadata: UploadMetadata): UploadMetadata {
  const name =
    typeof metadata.name === 'string'
      ? metadata.name.trim().replace(INVALID_FILENAME_CHARACTERS, '_')
      : '';
  const mimeType =
    typeof metadata.mimeType === 'string'
      ? metadata.mimeType.trim().toLowerCase()
      : '';
  const size = metadata.size;

  if (!Number.isSafeInteger(size) || size < 0) {
    throw new Error('ขนาดไฟล์ไม่ถูกต้อง');
  }
  if (size === 0) {
    throw new Error('ไฟล์ต้องมีข้อมูล');
  }
  if (size > MAX_UPLOAD_BYTES) {
    throw new Error('ไฟล์ต้องมีขนาดไม่เกิน 10 MB');
  }

  const allowedType = ALLOWED_FILE_TYPES[getExtension(name)];
  if (!name || !allowedType || allowedType.mimeType !== mimeType) {
    throw new Error('ไม่รองรับไฟล์ประเภทนี้');
  }

  return { name, mimeType, size };
}

export function matchesAllowedSignature(
  metadata: UploadMetadata,
  bytes: Uint8Array,
): boolean {
  try {
    const safeMetadata = assertUploadMetadata(metadata);
    const allowedType = ALLOWED_FILE_TYPES[getExtension(safeMetadata.name)];
    return signatureMatches(allowedType.signature, bytes);
  } catch {
    return false;
  }
}

export async function inspectLocalFile(file: File): Promise<UploadMetadata> {
  const metadata = assertUploadMetadata({
    name: file.name,
    mimeType: file.type,
    size: file.size,
  });
  const leadingBytes = await readBlobBytes(
    file.slice(0, SIGNATURE_BYTES_TO_READ),
  );

  if (!matchesAllowedSignature(metadata, leadingBytes)) {
    throw new Error('ชนิดไฟล์ไม่ถูกต้อง');
  }

  return metadata;
}
