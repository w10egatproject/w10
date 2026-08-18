/**
 * Extracts Google Drive File ID from any Google Drive URL format or raw ID:
 * - https://drive.google.com/file/d/FILE_ID/view...
 * - https://drive.google.com/open?id=FILE_ID
 * - https://drive.google.com/uc?id=FILE_ID
 * - https://drive.google.com/uc?export=view&id=FILE_ID
 * - https://drive.google.com/thumbnail?id=FILE_ID
 * - https://docs.google.com/uc?id=FILE_ID
 * - Raw 25+ char Google Drive file ID
 */
export function extractDriveFileId(urlOrId: string | null | undefined): string | null {
  if (!urlOrId || typeof urlOrId !== 'string') return null;
  const trimmed = urlOrId.trim();
  if (!trimmed) return null;

  // Pattern 1: /file/d/FILE_ID
  const fileDMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]{20,})/);
  if (fileDMatch?.[1]) return fileDMatch[1];

  // Pattern 2: id=FILE_ID in query params
  const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]{20,})/);
  if (idParamMatch?.[1]) return idParamMatch[1];

  // Pattern 3: Raw file ID
  if (/^[a-zA-Z0-9_-]{25,50}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

/**
 * Returns high-performance direct CDN thumbnail URL for Google Drive images
 * (Google's official public image CDN endpoint that avoids CORS and authentication redirects)
 */
export function getDriveImageThumbnailUrl(urlOrId: string | null | undefined): string | null {
  const fileId = extractDriveFileId(urlOrId);
  if (fileId) {
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }
  if (urlOrId && (urlOrId.startsWith('http://') || urlOrId.startsWith('https://') || urlOrId.startsWith('data:'))) {
    return urlOrId;
  }
  return null;
}

/**
 * Secondary fallback thumbnail URL via Google Drive's thumbnail endpoint
 */
export function getDriveThumbnailFallbackUrl(urlOrId: string | null | undefined): string | null {
  const fileId = extractDriveFileId(urlOrId);
  if (!fileId) return null;
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
}

/**
 * Extracts Google Drive Folder ID from any folder URL or raw ID:
 * - https://drive.google.com/drive/folders/FOLDER_ID...
 * - https://drive.google.com/drive/u/0/folders/FOLDER_ID...
 * - Raw Google Drive folder ID
 */
export function extractDriveFolderId(urlOrId: string | null | undefined): string | null {
  if (!urlOrId || typeof urlOrId !== 'string') return null;
  let trimmed = urlOrId.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    trimmed = trimmed.slice(1, -1).trim();
  }
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
    trimmed = trimmed.slice(1, -1).trim();
  }
  if (!trimmed) return null;

  const folderMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]{15,})/);
  if (folderMatch?.[1]) return folderMatch[1];

  const queryMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]{15,})/);
  if (queryMatch?.[1]) return queryMatch[1];

  if (/^[a-zA-Z0-9_-]{15,60}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}
