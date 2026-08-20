import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConsumableDetailDialog } from './ConsumableDetailDialog';
import type { ConsumableItem } from '@/lib/consumables/types';

const item: ConsumableItem = {
  no: 17,
  date: '2026-08-19',
  dateDisplay: '19/08/2569',
  year: 2569,
  month: 8,
  item: 'ปากกาเขียนเหล็ก',
  quantity: 2,
  receiver: 'วิชาญชัย',
  note: 'ใช้งานประจำแผนก',
  picUrl: 'https://drive.google.com/file/d/sample-file-id/view',
};

afterEach(cleanup);

describe('ConsumableDetailDialog', () => {
  it('renders consumable details properly', () => {
    render(
      <ConsumableDetailDialog
        item={item}
        isOpen={true}
        onClose={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getAllByText('รายละเอียด Consumable #17').length).toBeGreaterThan(0);
    expect(screen.getByText('ปากกาเขียนเหล็ก')).toBeDefined();
    expect(screen.getByText('2 ชิ้น')).toBeDefined();
    expect(screen.getByText('วิชาญชัย')).toBeDefined();
    expect(screen.getByText('กดเพื่อดูภาพเต็ม')).toBeDefined();
  });

  it('opens image modal dialog when clicking view full image button', () => {
    render(
      <ConsumableDetailDialog
        item={item}
        isOpen={true}
        onClose={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    const viewFullBtn = screen.getByRole('button', { name: 'กดเพื่อดูภาพเต็ม' });
    fireEvent.click(viewFullBtn);

    // Modal dialog header for image should be rendered
    expect(screen.getByText('📷 รูปภาพ Consumable #17')).toBeDefined();
    expect(screen.getByRole('button', { name: 'ปิด' })).toBeDefined();

    // Clicking close button dismisses image modal
    fireEvent.click(screen.getByRole('button', { name: 'ปิด' }));
    expect(screen.queryByText('📷 รูปภาพ Consumable #17')).toBeNull();
  });
});
