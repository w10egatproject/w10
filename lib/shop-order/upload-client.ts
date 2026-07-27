import type { UploadSession } from './types';

type RequestFactory = () => XMLHttpRequest;
type Wait = (delayMs: number) => Promise<void>;

interface UploadOptions {
  requestFactory?: RequestFactory;
  wait?: Wait;
  retryDelaysMs?: readonly number[];
}

class UploadAttemptError extends Error {
  constructor(message: string, public readonly retryable: boolean) {
    super(message);
    this.name = 'UploadAttemptError';
  }
}

const DEFAULT_RETRY_DELAYS_MS = [250, 750] as const;

function defaultWait(delayMs: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, delayMs));
}

function uploadAttempt(
  file: File,
  session: UploadSession,
  onProgress: (percent: number) => void,
  requestFactory: RequestFactory,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = requestFactory();

    const isDirectGoogleUrl = session.uploadUrl.startsWith(
      'https://www.googleapis.com/',
    );
    const targetUrl = isDirectGoogleUrl
      ? '/api/shop-order/upload-proxy'
      : session.uploadUrl;

    request.open('PUT', targetUrl);
    if (isDirectGoogleUrl) {
      request.setRequestHeader('x-upload-url', session.uploadUrl);
    }
    request.setRequestHeader('Content-Type', file.type);
    request.upload.onprogress = (event) => {
      if (!event.lengthComputable || event.total <= 0) return;
      const percent = Math.round((event.loaded / event.total) * 100);
      onProgress(Math.min(100, Math.max(0, percent)));
    };
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        resolve();
        return;
      }
      const retryable =
        request.status === 0 ||
        request.status === 429 ||
        (request.status >= 500 && request.status < 600);
      reject(new UploadAttemptError('อัปโหลดไฟล์ไม่สำเร็จ', retryable));
    };
    request.onerror = () => {
      reject(new UploadAttemptError('การเชื่อมต่อขณะอัปโหลดขัดข้อง', true));
    };
    request.onabort = () => {
      reject(new UploadAttemptError('การอัปโหลดไฟล์ถูกยกเลิก', false));
    };
    request.ontimeout = () => {
      reject(new UploadAttemptError('หมดเวลารอการอัปโหลดไฟล์', true));
    };
    request.send(file);
  });
}

export async function uploadToDriveSession(
  file: File,
  session: UploadSession,
  onProgress: (percent: number) => void,
  optionsOrFactory: UploadOptions | RequestFactory = {},
): Promise<void> {
  const options = typeof optionsOrFactory === 'function'
    ? { requestFactory: optionsOrFactory }
    : optionsOrFactory;
  const requestFactory = options.requestFactory ?? (() => new XMLHttpRequest());
  const wait = options.wait ?? defaultWait;
  const retryDelaysMs = options.retryDelaysMs ?? DEFAULT_RETRY_DELAYS_MS;

  for (let attempt = 0; ; attempt += 1) {
    try {
      await uploadAttempt(file, session, onProgress, requestFactory);
      return;
    } catch (error) {
      const retryable =
        error instanceof UploadAttemptError && error.retryable;
      const retryDelay = retryDelaysMs[attempt];
      if (!retryable || retryDelay === undefined) throw error;
      await wait(retryDelay);
    }
  }
}
