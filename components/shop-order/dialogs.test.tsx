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
    fireEvent.click(screen.getByRole('button', { name: 'ยืนยันลบ' }));
    expect(onDelete).toHaveBeenCalled();
  });
});
