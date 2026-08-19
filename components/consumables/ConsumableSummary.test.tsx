import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConsumableSummaryComponent } from './ConsumableSummary';
import type { ConsumableSummary } from '@/lib/consumables/types';

const mockSummary: ConsumableSummary = {
  totalItems: 10,
  totalQuantity: 29,
  topItems: [
    { name: 'ปากกาเขียนเหล็ก', quantity: 8 },
    { name: 'เทปกระดาษ', quantity: 5 },
  ],
  topReceivers: [
    { name: 'พิทักษ์', quantity: 6 },
    { name: 'วิชาญชัย', quantity: 4 },
  ],
};

afterEach(cleanup);

describe('ConsumableSummaryComponent', () => {
  it('renders top receivers card and 3D chart title', () => {
    render(<ConsumableSummaryComponent summary={mockSummary} />);

    expect(screen.getByText('ผู้เบิกของมากที่สุด')).toBeDefined();
    expect(screen.getByText('พิทักษ์')).toBeDefined();
    expect(screen.getByText('วิชาญชัย')).toBeDefined();
    expect(screen.getByText('สรุปการเบิก (3D Chart)')).toBeDefined();
  });

  it('calls onSelectReceiver when clicking a receiver item in the list', () => {
    const onSelectReceiver = vi.fn();
    render(
      <ConsumableSummaryComponent
        summary={mockSummary}
        onSelectReceiver={onSelectReceiver}
      />,
    );

    fireEvent.click(screen.getByText('พิทักษ์'));
    expect(onSelectReceiver).toHaveBeenCalledWith('พิทักษ์');
  });

  it('indicates active selection when selectedReceiver matches', () => {
    render(
      <ConsumableSummaryComponent
        summary={mockSummary}
        selectedReceiver="พิทักษ์"
      />,
    );

    expect(screen.getByText('กำลังกรอง: พิทักษ์')).toBeDefined();
    expect(screen.getByText('เลือกอยู่')).toBeDefined();
  });
});
