import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OrderFormDialog } from './OrderFormDialog';
import { OrderDetailDialog } from './OrderDetailDialog';
import type { ShopOrder } from '@/lib/shop-order/types';

const order: ShopOrder = {
  no: 7, from: 'หสบ-ช.', to: 'กอง ก', number: '123456',
  dateIn: '2026-07-01', subject: 'ทดสอบ', receivingUnit: 'W11',
  receiverName: 'สมชาย', dateOut: null, note: 'หมายเหตุ', fileUrl: '', repairFileUrl: '',
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

  it('removes the selected file preview when clicking the delete file button', async () => {
    const user = userEvent.setup();
    const createObjectURL = vi.fn(() => 'blob:preview');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL, revokeObjectURL }));

    render(
      <OrderFormDialog
        mode="create"
        departments={[]}
        receivers={[]}
        pending={false}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    const file = new File(['image'], 'sample.png', { type: 'image/png' });
    const fileInput = screen.getByLabelText(/ไฟล์แนบ/) as HTMLInputElement;
    await user.upload(fileInput, file);

    expect(screen.getByRole('img', { name: 'ตัวอย่างไฟล์ sample.png' })).toBeDefined();

    const removeBtn = screen.getByRole('button', { name: 'ลบไฟล์' });
    await user.click(removeBtn);

    expect(screen.queryByRole('img', { name: 'ตัวอย่างไฟล์ sample.png' })).toBeNull();
    const updatedFileInput = screen.getByLabelText(/ไฟล์แนบ/) as HTMLInputElement;
    expect(updatedFileInput.value).toBe('');

    vi.unstubAllGlobals();
  });

  it('submits an accessible form with the approved fields and default today dates', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<OrderFormDialog mode="create" departments={['กอง ก']} receivers={['สมชาย']} pending={false} onClose={vi.fn()} onSubmit={onSubmit} />);
    expect(screen.getByRole('dialog').getAttribute('aria-modal')).toBe('true');

    const dateInInput = screen.getByLabelText(/วันที่รับ/) as HTMLInputElement;
    const dateOutInput = screen.getByLabelText(/วันที่ออก/) as HTMLInputElement;
    expect(dateInInput.value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(dateOutInput.value).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    await user.selectOptions(screen.getByLabelText('ถึง'), 'กอง ก');
    await user.type(screen.getByLabelText('เลขที่'), '123456');
    await user.type(screen.getByLabelText('เรื่อง'), 'งานใหม่');
    await user.selectOptions(screen.getByLabelText('หน่วยงานรับ'), 'กอง ก');
    await user.selectOptions(screen.getByLabelText('ผู้รับ'), 'สมชาย');
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

  it('shows a verified thumbnail for the attachment on the left without external link', () => {
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
    expect(screen.queryByRole('link', { name: 'เปิดไฟล์ต้นฉบับ' })).toBeNull();
  });

  it('falls back gracefully when thumbnail loading fails', () => {
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

    fireEvent.error(screen.getByRole('img'));

    expect(screen.getByText('ไม่พบรูปตัวอย่าง')).toBeDefined();
    expect(screen.queryByRole('link', { name: 'เปิดไฟล์ต้นฉบับ' })).toBeNull();
  });
  it('uses an inline public Drive preview as a fallback after the thumbnail proxy fails', () => {
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

    const proxyPreview = screen.getByRole('img');
    fireEvent.error(proxyPreview);
    const directPreview = screen.getByRole('img');
    expect(directPreview.getAttribute('src')).toBe(
      'https://lh3.googleusercontent.com/d/current-file-id',
    );
    fireEvent.error(directPreview);
    expect(screen.queryByRole('img')).toBeNull();
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
  it('shows a second optional repair attachment input', () => {
    render(
      <OrderFormDialog
        mode="create"
        departments={[]}
        receivers={[]}
        pending={false}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    const repairAttachment = screen.getByLabelText('repair attachment');
    expect(repairAttachment).toHaveProperty('type', 'file');
    expect(repairAttachment).toHaveProperty('required', false);
  });
});
