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
  statusData: { total: 10, sap: 5, pending: 2, finish: 1 },
  groupStats: {
    W11: { entrance: 2, left: 1, finish: 1, otherFinish: 0, out: 1 },
    W12: { entrance: 3, left: 1, finish: 2, otherFinish: 0, out: 2 },
    W13: { entrance: 2, left: 0, finish: 2, otherFinish: 0, out: 2 },
    W14: { entrance: 3, left: 1, finish: 2, otherFinish: 0, out: 2 },
    W_all: { entrance: 10, left: 3, finish: 7, otherFinish: 0, out: 7 },
  },
  wGauges: {},
  equipmentData: [],
  statusDetails: [
    {
      no: '1',
      ecm: '7/2569',
      wo: '4071548',
      description: 'ซ่อมแซมมอเตอร์ 1',
      equipment: '620112 รถบรรทุก',
      date: '5/1/2026',
      contact: 'ภานุมาศ 4535',
      dept: 'หบย-ช.',
      ecm_url: 'https://ecmcommon.egat.co.th/InternalDoc/MemoForm?id=1946370',
      notify: 'งานเข้า',
      status: 'Pending',
      groups: 'W12, W14',
    },
    {
      no: '2',
      ecm: '10/2569',
      wo: '4071566',
      description: 'ซ่อมบำรุงปั๊มน้ำ',
      equipment: '620124 รถบรรทุก',
      date: '5/1/2026',
      contact: 'สมชาย 4500',
      dept: 'หบย-ช.',
      ecm_url: '',
      notify: 'งานเข้า',
      status: 'Pending',
      groups: 'W11',
    },
    {
      no: '3',
      ecm: '623/2569',
      wo: '4111900',
      description: 'เปลี่ยนลูกปืนเสร็จแล้ว',
      equipment: '536299',
      date: '3/4/2026',
      contact: 'กฤษฏา 4613',
      dept: 'หปป-ช.',
      ecm_url: 'https://ecmcommon.egat.co.th/InternalDoc/MemoForm?id=2045485',
      notify: 'งานเข้า',
      status: 'Finish',
      groups: 'W13',
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
