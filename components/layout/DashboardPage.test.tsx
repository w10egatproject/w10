import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DashboardPage from '@/app/page';

vi.mock('next/dynamic', () => ({
  default: () => () => <div data-testid="mock-chart">Chart</div>,
}));

vi.mock('@/components/navigation/NavigationMenu', () => ({
  default: () => <div data-testid="nav-menu">NavMenu</div>,
}));

vi.mock('@/components/reactbits/split-text', () => ({
  SplitText: ({ text }: { text: string }) => <span>{text}</span>,
}));

vi.mock('@/components/magicui/number-ticker', () => ({
  NumberTicker: ({ value }: { value: number }) => <span>{value}</span>,
}));

vi.mock('@/components/magicui/blur-fade', () => ({
  BlurFade: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const mockDashboardData = {
  currentYear: '2025',
  currentMonth: 'all',
  statusData: { total: 10, sap: 5, pending: 3, finish: 2 },
  groupStats: {
    W11: { entrance: 2, left: 1, finish: 1, otherFinish: 0, out: 1 },
    W12: { entrance: 3, left: 1, finish: 2, otherFinish: 0, out: 2 },
    W13: { entrance: 2, left: 0, finish: 2, otherFinish: 0, out: 2 },
    W14: { entrance: 3, left: 1, finish: 2, otherFinish: 0, out: 2 },
    W_all: { entrance: 10, left: 3, finish: 7, otherFinish: 0, out: 7 },
  },
  wGauges: {},
  equipmentData: [],
  workOrders: [
    {
      ecm_buy: '',
      ecm: '101/2569',
      wo: '4100001',
      item: 'ซ่อมแซมมอเตอร์ 1',
      equip: 'Motor A',
      date_in: '1/8/2026',
      date_start: '15/8/2026',
      date_out: '',
      status: '1.รอซื้อจ้าง',
      action: 'รออะไหล่',
    },
    {
      ecm_buy: '',
      ecm: '102/2569',
      wo: '4100002',
      item: 'ซ่อมบำรุงปั๊มน้ำ',
      equip: 'Pump B',
      date_in: '2/8/2026',
      date_start: '20/8/2026',
      date_out: '',
      status: '4.เสนอราคา',
      action: 'รออนุมัติ',
    },
    {
      ecm_buy: '',
      ecm: '103/2569',
      wo: '4100003',
      item: 'เปลี่ยนลูกปืนเสร็จแล้ว',
      equip: 'Bearing C',
      date_in: '3/8/2026',
      date_start: '10/8/2026',
      date_out: '12/8/2026',
      status: 'เสร็จ',
      action: 'ส่งมอบแล้ว',
    },
  ],
};

describe('DashboardPage - Status Cards & Table Expand', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockDashboardData,
    }));
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('toggles pending work orders table on clicking Pending card', async () => {
    const user = userEvent.setup();
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /ดูตารางรายการ Pending/i })).toBeDefined();
    });

    const pendingCard = screen.getByRole('button', { name: /ดูตารางรายการ Pending/i });
    expect(screen.queryByText(/รายการ W\/O สถานะ:/i)).toBeNull();

    // Click Pending -> opens table
    await user.click(pendingCard);
    expect(screen.getByText(/รายการ W\/O สถานะ:/i)).toBeDefined();
    expect(screen.getByText('ซ่อมแซมมอเตอร์ 1')).toBeDefined();
    expect(screen.getByText('ซ่อมบำรุงปั๊มน้ำ')).toBeDefined();
    expect(screen.queryByText('เปลี่ยนลูกปืนเสร็จแล้ว')).toBeNull();

    // Click Pending card again -> closes table
    await user.click(pendingCard);
    await waitFor(() => {
      expect(screen.queryByText(/รายการ W\/O สถานะ:/i)).toBeNull();
    });
  });

  it('toggles finish work orders table on clicking Finish card', async () => {
    const user = userEvent.setup();
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /ดูตารางรายการ Finish/i })).toBeDefined();
    });

    const finishCard = screen.getByRole('button', { name: /ดูตารางรายการ Finish/i });
    await user.click(finishCard);

    expect(screen.getByText(/รายการ W\/O สถานะ:/i)).toBeDefined();
    expect(screen.getByText('เปลี่ยนลูกปืนเสร็จแล้ว')).toBeDefined();
    expect(screen.queryByText('ซ่อมแซมมอเตอร์ 1')).toBeNull();

    // Click "ปิดตาราง" button -> closes table
    const closeButton = screen.getByRole('button', { name: /ปิดตาราง/i });
    await user.click(closeButton);
    await waitFor(() => {
      expect(screen.queryByText(/รายการ W\/O สถานะ:/i)).toBeNull();
    });
  });

  it('filters table by search query', async () => {
    const user = userEvent.setup();
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /ดูตารางรายการ Pending/i })).toBeDefined();
    });

    await user.click(screen.getByRole('button', { name: /ดูตารางรายการ Pending/i }));
    expect(screen.getByText('ซ่อมแซมมอเตอร์ 1')).toBeDefined();
    expect(screen.getByText('ซ่อมบำรุงปั๊มน้ำ')).toBeDefined();

    const searchInput = screen.getByPlaceholderText('ค้นหาในตาราง...');
    await user.type(searchInput, 'ปั๊มน้ำ');

    expect(screen.getByText('ซ่อมบำรุงปั๊มน้ำ')).toBeDefined();
    expect(screen.queryByText('ซ่อมแซมมอเตอร์ 1')).toBeNull();
  });
});
