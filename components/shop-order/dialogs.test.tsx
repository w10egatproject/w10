import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OrderFormDialog } from './OrderFormDialog';
import { OrderDetailDialog } from './OrderDetailDialog';
import type { ShopOrder } from '@/lib/shop-order/types';

const order: ShopOrder = {
  no: 7, from: 'หสบ-ช.', to: 'กอง ก', number: '123456',
  dateIn: '2026-07-01', subject: 'ทดสอบ', receivingUnit: 'W11',
  receiverName: 'สมชาย', dateOut: null, note: 'หมายเหตุ', fileUrl: '',
};

afterEach(cleanup);

describe('Shop Order dialogs', () => {
  it('shows a small preview after selecting an image and revokes its URL', async () => {
    const user = userEvent.setup();
    const createObjectURL = vi.fn(() => 'blob:preview');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', Object.assign(URL, {
      createObjectURL,
      revokeObjectURL,
    }));
    const { unmount } = render(
      <OrderFormDialog mode="create" departments={[]} receivers={[]} pending={false} onClose={vi.fn()} onSubmit={vi.fn()} />,
    );
    const file = new File(['image'], 'sample.png', { type: 'image/png' });

    await user.upload(screen.getByLabelText(/ไฟล์แนบ/), file);

    const preview = screen.getByRole('img', { name: 'ตัวอย่างไฟล์ sample.png' });
    expect(preview.getAttribute('src')).toBe('blob:preview');
    expect(preview.className).toContain('h-20');
    unmount();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:preview');
    vi.unstubAllGlobals();
  });

  it('submits an accessible form with the approved fields', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<OrderFormDialog mode="create" departments={['กอง ก']} receivers={['สมชาย']} pending={false} onClose={vi.fn()} onSubmit={onSubmit} />);
    expect(screen.getByRole('dialog').getAttribute('aria-modal')).toBe('true');
    await user.selectOptions(screen.getByLabelText('ถึง'), 'กอง ก');
    await user.type(screen.getByLabelText('เลขที่'), '123456');
    await user.type(screen.getByLabelText('เรื่อง'), 'งานใหม่');
    await user.click(screen.getByRole('button', { name: 'บันทึก' }));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      order: expect.objectContaining({ to: 'กอง ก', number: '123456', subject: 'งานใหม่' }),
    }));
  });

  it('shows A-K details and confirms deletion', async () => {
    const onDelete = vi.fn();
    render(<OrderDetailDialog order={order} pending={false} onClose={vi.fn()} onEdit={vi.fn()} onDelete={onDelete} />);
    expect(screen.getAllByText('หมายเหตุ')).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: 'ลบรายการ' }));
    expect(screen.getByRole('alertdialog')).toBeDefined();
    expect(
      screen.getByText(
        'ไฟล์แนบที่ระบบ OAuth จัดการจะถูกตั้งเวลาย้ายเข้าถังขยะ Google Drive หลัง 30 วัน ส่วนไฟล์เดิม (Legacy) จะไม่ถูกจัดการ',
      ),
    ).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'ยืนยันลบ' }));
    expect(onDelete).toHaveBeenCalled();
  });

  it('shows a small verified thumbnail that links to the original attachment', () => {
    const attachmentOrder = {
      ...order,
      fileUrl: 'https://drive.google.com/file/d/current-file-id/view',
    };
    render(
      <OrderDetailDialog
        order={attachmentOrder}
        pending={false}
        onClose={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    const preview = screen.getByRole('img', {
      name: 'ตัวอย่างไฟล์แนบรายการ 7',
    });
    expect(preview.getAttribute('src')).toBe(
      '/api/shop-order/attachment-thumbnail?no=7',
    );
    expect(preview.className).toContain('h-20');
    const originalLink = screen.getByRole('link', {
      name: 'เปิดไฟล์ต้นฉบับ',
    });
    expect(originalLink.getAttribute('href')).toBe(attachmentOrder.fileUrl);
    expect(originalLink.getAttribute('target')).toBe('_blank');
    expect(originalLink.getAttribute('rel')).toContain('noopener');
  });

  it('falls back without removing the original link when thumbnail loading fails', () => {
    render(
      <OrderDetailDialog
        order={{
          ...order,
          fileUrl: 'https://drive.google.com/file/d/current-file-id/view',
        }}
        pending={false}
        onClose={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    fireEvent.error(
      screen.getByRole('img', { name: 'ตัวอย่างไฟล์แนบรายการ 7' }),
    );

    expect(screen.getByText('ไม่พบรูปตัวอย่าง')).toBeDefined();
    expect(
      screen.getByRole('link', { name: 'เปิดไฟล์ต้นฉบับ' }),
    ).toBeDefined();
  });
  it('accepts only the approved attachment extensions and labels a PDF preview', async () => {
    const user = userEvent.setup();
    render(
      <OrderFormDialog mode="create" departments={[]} receivers={[]} pending={false} onClose={vi.fn()} onSubmit={vi.fn()} />,
    );
    const input = screen.getByLabelText(/ไฟล์แนบ/) as HTMLInputElement;
    expect(input.getAttribute('accept')).toBe('.jpg,.jpeg,.png,.webp,.pdf');

    await user.upload(
      input,
      new File(['%PDF-example'], 'report.pdf', { type: 'application/pdf' }),
    );
    expect(screen.getByText('PDF')).toBeDefined();
    expect(screen.getByText('report.pdf')).toBeDefined();
  });
});
