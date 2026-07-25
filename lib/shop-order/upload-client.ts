import type { UploadSession } from './types';

type RequestFactory = () => XMLHttpRequest;

export function uploadToDriveSession(
  file: File,
  session: UploadSession,
  onProgress: (percent: number) => void,
  makeRequest: RequestFactory = () => new XMLHttpRequest(),
): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = makeRequest();

    request.open('PUT', session.uploadUrl);
    request.setRequestHeader('Content-Type', file.type);
    request.upload.onprogress = (event) => {
      if (!event.lengthComputable || event.total <= 0) {
        return;
      }

      const percent = Math.round((event.loaded / event.total) * 100);
      onProgress(Math.min(100, Math.max(0, percent)));
    };
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        resolve();
        return;
      }
      reject(new Error('อัปโหลดไฟล์ไม่สำเร็จ'));
    };
    request.onerror = () => {
      reject(new Error('การเชื่อมต่อขณะอัปโหลดขัดข้อง'));
    };
    request.onabort = () => {
      reject(new Error('การอัปโหลดไฟล์ถูกยกเลิก'));
    };
    request.ontimeout = () => {
      reject(new Error('หมดเวลารอการอัปโหลดไฟล์'));
    };
    request.send(file);
  });
}
