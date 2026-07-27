import { describe, expect, it, vi } from 'vitest';

import { uploadToDriveSession } from './upload-client';
import type { UploadSession } from './types';

const session: UploadSession = {
  fileId: 'file-1',
  uploadUrl: 'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable',
  expiresAt: '2026-07-25T18:00:00.000Z',
};

function createRequest(status = 200) {
  return {
    open: vi.fn(),
    setRequestHeader: vi.fn(),
    send: vi.fn(),
    upload: {},
    status,
  } as unknown as XMLHttpRequest;
}

function dispatchProgress(
  request: XMLHttpRequest,
  init: ProgressEventInit,
): void {
  const handler = request.upload.onprogress as (
    event: ProgressEvent<EventTarget>,
  ) => void;
  handler(new ProgressEvent('progress', init));
}

describe('direct Drive resumable upload', () => {
  it('PUTs the File directly to the session and never sets forbidden Content-Length', async () => {
    const request = createRequest();
    const file = new File(['%PDF-example'], 'report.pdf', {
      type: 'application/pdf',
    });
    const onProgress = vi.fn();

    const result = uploadToDriveSession(file, session, onProgress, () => request);
    expect(request.open).toHaveBeenCalledWith('PUT', '/api/shop-order/upload-proxy');
    expect(request.setRequestHeader).toHaveBeenCalledWith(
      'x-upload-url',
      session.uploadUrl,
    );
    expect(request.setRequestHeader).toHaveBeenCalledWith(
      'Content-Type',
      'application/pdf',
    );
    expect(request.setRequestHeader).not.toHaveBeenCalledWith(
      'Content-Length',
      expect.anything(),
    );
    expect(request.send).toHaveBeenCalledWith(file);

    (request.onload as EventListener)(new Event('load'));
    await expect(result).resolves.toBeUndefined();
  });

  it('reports rounded, bounded progress only for computable totals', async () => {
    const request = createRequest();
    const onProgress = vi.fn();
    const result = uploadToDriveSession(
      new File(['%PDF-example'], 'report.pdf', { type: 'application/pdf' }),
      session,
      onProgress,
      () => request,
    );

    dispatchProgress(request, {
      lengthComputable: false,
      loaded: 20,
      total: 0,
    });
    dispatchProgress(request, {
      lengthComputable: true,
      loaded: 2,
      total: 3,
    });
    expect(onProgress).toHaveBeenCalledTimes(1);
    expect(onProgress).toHaveBeenCalledWith(67);
    dispatchProgress(request, {
      lengthComputable: true,
      loaded: 4,
      total: 3,
    });
    expect(onProgress).toHaveBeenLastCalledWith(100);

    (request.onload as EventListener)(new Event('load'));
    await result;
  });

  it.each([200, 201, 299])('resolves for successful HTTP status %s', async (status) => {
    const request = createRequest(status);
    const result = uploadToDriveSession(
      new File(['%PDF-example'], 'report.pdf', { type: 'application/pdf' }),
      session,
      vi.fn(),
      () => request,
    );

    (request.onload as EventListener)(new Event('load'));
    await expect(result).resolves.toBeUndefined();
  });

  it.each([199, 300, 308, 400])(
    'rejects unsuccessful HTTP status %s with a safe message',
    async (status) => {
      const request = createRequest(status);
      const result = uploadToDriveSession(
        new File(['%PDF-example'], 'report.pdf', { type: 'application/pdf' }),
        session,
        vi.fn(),
        () => request,
      );

      (request.onload as EventListener)(new Event('load'));
      await expect(result).rejects.toThrow('อัปโหลดไฟล์ไม่สำเร็จ');
    },
  );

  it('rejects transport errors with a safe connection message', async () => {
    const request = createRequest();
    const result = uploadToDriveSession(
      new File(['%PDF-example'], 'report.pdf', { type: 'application/pdf' }),
      session,
      vi.fn(),
      { requestFactory: () => request, retryDelaysMs: [] },
    );

    (request.onerror as EventListener)(new Event('error'));
    await expect(result).rejects.toThrow(
      'การเชื่อมต่อขณะอัปโหลดขัดข้อง',
    );
  });

  it.each([
    ['onabort', 'การอัปโหลดไฟล์ถูกยกเลิก'],
    ['ontimeout', 'หมดเวลารอการอัปโหลดไฟล์'],
  ] as const)('handles %s with a safe message', async (handler, message) => {
    const request = createRequest();
    const result = uploadToDriveSession(
      new File(['%PDF-example'], 'report.pdf', { type: 'application/pdf' }),
      session,
      vi.fn(),
      { requestFactory: () => request, retryDelaysMs: [] },
    );

    (request[handler] as EventListener)(new Event(handler.slice(2)));
    await expect(result).rejects.toThrow(message);
  });
  it('retries network failures with bounded delays and succeeds on the third attempt', async () => {
    const requests = [createRequest(), createRequest(), createRequest()];
    const requestFactory = vi.fn(() => requests.shift()!);
    const wait = vi.fn().mockResolvedValue(undefined);
    const result = uploadToDriveSession(
      new File(['%PDF-example'], 'report.pdf', { type: 'application/pdf' }),
      session,
      vi.fn(),
      { requestFactory, wait, retryDelaysMs: [250, 750] },
    );

    (requestFactory.mock.results[0].value.onerror as EventListener)(new Event('error'));
    await vi.waitFor(() => expect(requestFactory).toHaveBeenCalledTimes(2));
    (requestFactory.mock.results[1].value.ontimeout as EventListener)(new Event('timeout'));
    await vi.waitFor(() => expect(requestFactory).toHaveBeenCalledTimes(3));
    (requestFactory.mock.results[2].value.onload as EventListener)(new Event('load'));

    await expect(result).resolves.toBeUndefined();
    expect(wait).toHaveBeenNthCalledWith(1, 250);
    expect(wait).toHaveBeenNthCalledWith(2, 750);
  });

  it.each([429, 500, 503])('retries transient HTTP status %s', async (status) => {
    const requests = [createRequest(status), createRequest(200)];
    const requestFactory = vi.fn(() => requests.shift()!);
    const wait = vi.fn().mockResolvedValue(undefined);
    const result = uploadToDriveSession(
      new File(['%PDF-example'], 'report.pdf', { type: 'application/pdf' }),
      session,
      vi.fn(),
      { requestFactory, wait, retryDelaysMs: [10] },
    );

    (requestFactory.mock.results[0].value.onload as EventListener)(new Event('load'));
    await vi.waitFor(() => expect(requestFactory).toHaveBeenCalledTimes(2));
    (requestFactory.mock.results[1].value.onload as EventListener)(new Event('load'));

    await expect(result).resolves.toBeUndefined();
    expect(wait).toHaveBeenCalledWith(10);
  });

  it.each([400, 401, 403, 404])('does not retry permanent HTTP status %s', async (status) => {
    const request = createRequest(status);
    const requestFactory = vi.fn(() => request);
    const wait = vi.fn().mockResolvedValue(undefined);
    const result = uploadToDriveSession(
      new File(['%PDF-example'], 'report.pdf', { type: 'application/pdf' }),
      session,
      vi.fn(),
      { requestFactory, wait, retryDelaysMs: [10, 20] },
    );

    (request.onload as EventListener)(new Event('load'));
    await expect(result).rejects.toThrow('อัปโหลดไฟล์ไม่สำเร็จ');
    expect(requestFactory).toHaveBeenCalledTimes(1);
    expect(wait).not.toHaveBeenCalled();
  });
});
