import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const clientMocks = vi.hoisted(() => ({
  inspectLocalFile: vi.fn(),
  uploadToDriveSession: vi.fn(),
}));

vi.mock('@/lib/shop-order/file-rules', () => ({
  inspectLocalFile: clientMocks.inspectLocalFile,
}));
vi.mock('@/lib/shop-order/upload-client', () => ({
  uploadToDriveSession: clientMocks.uploadToDriveSession,
}));

import { ShopOrderDashboard } from './ShopOrderDashboard';

vi.mock('next/navigation', () => ({ usePathname: () => '/shop-order' }));
vi.mock('next/link', () => ({
  default: ({ children, ...props }: React.ComponentProps<'a'>) => (
    <a {...props}>{children}</a>
  ),
}));
vi.mock('next/image', () => ({
  default: ({ alt, ...props }: React.ComponentProps<'img'>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} {...props} />
  ),
}));

const response = {
  ok: true,
  data: {
    orders: [
      {
        no: 2, from: 'หสบ-ช.', to: 'กอง ก', number: '123456',
        dateIn: '2026-07-02', subject: 'งานเสร็จ', receivingUnit: 'W12',
        receiverName: 'สมชาย', dateOut: '2026-07-03', note: '', fileUrl: '',
      },
      {
        no: 1, from: 'หสบ-ช.', to: 'กอง ข', number: '654321',
        dateIn: '2026-07-01', subject: 'งานรอ', receivingUnit: 'W11',
        receiverName: '', dateOut: null, note: '', fileUrl: '',
      },
    ],
    departments: ['กอง ก', 'กอง ข'],
    receivers: ['สมชาย'],
    generatedAt: '2026-07-25T00:00:00.000Z',
  },
};

describe('ShopOrderDashboard', () => {
  beforeEach(() => {
    clientMocks.inspectLocalFile.mockResolvedValue({
      name: 'photo.png',
      mimeType: 'image/png',
      size: 8,
    });
    clientMocks.uploadToDriveSession.mockResolvedValue(undefined);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => response,
    }));
  });
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

  it('filters the table and every summary from the same result', async () => {
    const user = userEvent.setup();
    render(<ShopOrderDashboard />);
    expect(await screen.findByText('งานเสร็จ')).toBeDefined();
    expect(screen.getByTestId('kpi-total').textContent).toContain('2');
    await user.selectOptions(screen.getByLabelText('สถานะ'), 'wait');
    expect(screen.queryByText('งานเสร็จ')).toBeNull();
    expect(screen.getByText('งานรอ')).toBeDefined();
    expect(screen.getByTestId('kpi-total').textContent).toContain('2');
    expect(screen.getByTestId('status-summary').textContent).toContain('รอดำเนินการ');
  });

  it('uses the approved responsive layout and omits the removed trend', async () => {
    render(<ShopOrderDashboard />);
    await screen.findByText('งานเสร็จ');
    expect(screen.getByTestId('shop-order-layout').className)
      .toContain('lg:grid-cols-[1fr_320px]');
    expect(screen.queryByText('แนวโน้มออเดอร์ — 30 วันล่าสุด')).toBeNull();
  });

  it('links to the Shop Order source sheet in an isolated new tab', async () => {
    render(<ShopOrderDashboard />);
    await screen.findByText('งานเสร็จ');

    const sourceSheetLink = screen.getByRole('link', {
      name: /เปิดชีท|เปิด Google Sheet/,
    });

    expect(sourceSheetLink.getAttribute('href')).toBe(
      'https://docs.google.com/spreadsheets/d/1ZtFnQhPortoyUgKzQuruq5kU7q5V9l1GYbsSgL-9oco/edit?gid=0#gid=0',
    );
    expect(sourceSheetLink.getAttribute('target')).toBe('_blank');
    expect(sourceSheetLink.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('manually refreshes without polling', async () => {
    const user = userEvent.setup();
    render(<ShopOrderDashboard />);
    await screen.findByText('งานเสร็จ');
    expect(fetch).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: 'รีเฟรชข้อมูล' }));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
  });
  it('saves without an attachment after upload failure and offers an edit retry', async () => {
    const user = userEvent.setup();
    const createdOrder = {
      ...response.data.orders[1],
      no: 3,
      to: 'กอง ก',
      number: '123456',
      subject: 'งานใหม่',
    };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => response })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          data: {
            fileId: 'pending-file-id',
            uploadUrl: 'https://www.googleapis.com/upload/session-secret',
            expiresAt: '2026-07-27T10:00:00.000Z',
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          data: { order: createdOrder, attachment: { status: 'none' } },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...response,
          data: { ...response.data, orders: [...response.data.orders, createdOrder] },
        }),
      });
    vi.stubGlobal('fetch', fetchMock);
    clientMocks.uploadToDriveSession.mockRejectedValueOnce(
      new Error('การเชื่อมต่อขณะอัปโหลดขัดข้อง'),
    );

    render(<ShopOrderDashboard />);
    await screen.findByText('งานเสร็จ');
    await user.click(screen.getByRole('button', { name: 'เพิ่ม' }));
    await user.selectOptions(screen.getByLabelText('ถึง'), 'กอง ก');
    await user.type(screen.getByLabelText('เลขที่'), '123456');
    await user.type(screen.getByLabelText('เรื่อง'), 'งานใหม่');
    await user.selectOptions(screen.getByLabelText('หน่วยงานรับ'), 'กอง ก');
    await user.selectOptions(screen.getByLabelText('ผู้รับ'), 'สมชาย');
    await user.upload(
      screen.getByLabelText(/ไฟล์แนบ/),
      new File(['png'], 'photo.png', { type: 'image/png' }),
    );
    await user.click(screen.getByRole('button', { name: 'บันทึก' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(4));
    const sessionBody = JSON.parse(fetchMock.mock.calls[1][1].body as string);
    expect(sessionBody.orderNumber).toBe('123456');
    const mutationBody = JSON.parse(fetchMock.mock.calls[2][1].body as string);
    expect(mutationBody.uploadedFileId).toBeUndefined();
    expect((await screen.findByRole('status')).textContent).toContain(
      'บันทึกออเดอร์แล้ว แต่แนบไฟล์ไม่สำเร็จ',
    );

    await user.click(screen.getByRole('button', { name: 'เพิ่มไฟล์อีกครั้ง' }));
    expect(screen.getByRole('dialog').textContent).toContain('แก้ไขรายการ 3');
  });

  it('shows the same warning for a server partial-success outcome', async () => {
    const user = userEvent.setup();
    const createdOrder = { ...response.data.orders[1], no: 3, to: 'กอง ก', number: '123456', subject: 'งานใหม่' };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => response })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true, data: { fileId: 'file-id', uploadUrl: 'https://www.googleapis.com/upload/session', expiresAt: '2026-07-27T10:00:00.000Z' } }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true, data: { order: createdOrder, attachment: { status: 'order_saved_without_attachment', code: 'ORDER_SAVED_WITHOUT_ATTACHMENT', message: 'บันทึกออเดอร์แล้ว แต่ไม่สามารถแนบไฟล์ได้' } } }) })
      .mockResolvedValueOnce({ ok: true, json: async () => response });
    vi.stubGlobal('fetch', fetchMock);

    render(<ShopOrderDashboard />);
    await screen.findByText('งานเสร็จ');
    await user.click(screen.getByRole('button', { name: 'เพิ่ม' }));
    await user.selectOptions(screen.getByLabelText('ถึง'), 'กอง ก');
    await user.type(screen.getByLabelText('เลขที่'), '123456');
    await user.type(screen.getByLabelText('เรื่อง'), 'งานใหม่');
    await user.selectOptions(screen.getByLabelText('หน่วยงานรับ'), 'กอง ก');
    await user.selectOptions(screen.getByLabelText('ผู้รับ'), 'สมชาย');
    await user.upload(screen.getByLabelText(/ไฟล์แนบ/), new File(['png'], 'photo.png', { type: 'image/png' }));
    await user.click(screen.getByRole('button', { name: 'บันทึก' }));

    expect((await screen.findByRole('status')).textContent).toContain(
      'บันทึกออเดอร์แล้ว แต่แนบไฟล์ไม่สำเร็จ',
    );
  });

  it('keeps a locally invalid file in the form without any mutation request', async () => {
    const user = userEvent.setup();
    clientMocks.inspectLocalFile.mockRejectedValueOnce(
      new Error('รองรับเฉพาะไฟล์ JPEG, PNG, WebP และ PDF'),
    );
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => response,
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<ShopOrderDashboard />);
    await screen.findByText('งานเสร็จ');
    await user.click(screen.getByRole('button', { name: 'เพิ่ม' }));
    await user.selectOptions(screen.getByLabelText('ถึง'), 'กอง ก');
    await user.type(screen.getByLabelText('เลขที่'), '123456');
    await user.type(screen.getByLabelText('เรื่อง'), 'งานใหม่');
    await user.selectOptions(screen.getByLabelText('หน่วยงานรับ'), 'กอง ก');
    await user.selectOptions(screen.getByLabelText('ผู้รับ'), 'สมชาย');
    await user.upload(screen.getByLabelText(/ไฟล์แนบ/), new File(['bad'], 'photo.png', { type: 'image/png' }));
    await user.click(screen.getByRole('button', { name: 'บันทึก' }));

    expect((await screen.findByRole('alert')).textContent).toContain(
      'รองรับเฉพาะไฟล์ JPEG, PNG, WebP และ PDF',
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('dialog')).toBeDefined();
  });
});
