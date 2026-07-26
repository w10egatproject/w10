import type { UploadMetadata } from './types';

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const INVALID_FILENAME_CHARACTERS = /[\\/:*?"<>|\u0000-\u001f\u007f]/g;
const SIGNATURE_BYTES_TO_READ = 32;

type FileKind = 'jpeg' | 'pdf' | 'png' | 'webp';

interface AllowedFileType {
  mimeType: string;
  signature: FileKind;
}

const ALLOWED_FILE_TYPES: Readonly<Record<string, AllowedFileType>> = {
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
};

const SIGNATURES = {
  jpeg: [0xff, 0xd8, 0xff],
  png: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  pdf: [0x25, 0x50, 0x44, 0x46, 0x2d],
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

function signatureMatches(kind: FileKind, bytes: Uint8Array): boolean {
  switch (kind) {
    case 'jpeg':
      return hasBytes(bytes, SIGNATURES.jpeg);
    case 'pdf':
      return hasBytes(bytes, SIGNATURES.pdf);
    case 'png':
      return hasBytes(bytes, SIGNATURES.png);
    case 'webp':
      return hasAscii(bytes, 'RIFF') && hasAscii(bytes, 'WEBP', 8);
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
    throw new Error('รองรับเฉพาะไฟล์ JPEG, PNG, WebP และ PDF');
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
