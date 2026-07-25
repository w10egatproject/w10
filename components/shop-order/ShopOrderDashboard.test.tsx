import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
    expect(screen.getByTestId('kpi-total').textContent).toContain('1');
    expect(screen.getByTestId('status-summary').textContent).toContain('รอดำเนินการ');
  });

  it('uses the approved responsive layout and omits the removed trend', async () => {
    render(<ShopOrderDashboard />);
    await screen.findByText('งานเสร็จ');
    expect(screen.getByTestId('shop-order-layout').className)
      .toContain('lg:grid-cols-[minmax(0,3fr)_minmax(280px,1fr)]');
    expect(screen.queryByText('แนวโน้มออเดอร์ — 30 วันล่าสุด')).toBeNull();
  });

  it('manually refreshes without polling', async () => {
    const user = userEvent.setup();
    render(<ShopOrderDashboard />);
    await screen.findByText('งานเสร็จ');
    expect(fetch).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: 'รีเฟรชข้อมูล' }));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
  });
});
