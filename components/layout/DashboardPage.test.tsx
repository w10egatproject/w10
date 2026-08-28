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
  statusData: { total: 10, sap: 5, pending: 2, finish: 1, check: 4, allCheckTotal: 10 },
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
      check: 'TRUE',
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
      check: 'FALSE',
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
      check: 'TRUE',
      groups: 'W13',
    },
    {
      no: '4',
      ecm: '890/2569',
      wo: '4161546',
      description: 'ทำชิ้นวางของ 10 ตัว',
      equipment: 'รถขุดล้อยาง',
      date: '18/8/2026',
      contact: 'กฤษฏา 4082',
      dept: 'หปนส-ช.',
      ecm_url: 'https://ecmcommon.egat.co.th/InternalDoc/MemoForm?id=3001',
      notify: 'งานเข้า',
      status: 'SAP Comp',
      check: 'TRUE',
      groups: 'W13',
    },
    {
      no: '5',
      ecm: '891/2569',
      wo: '4161880',
      description: 'ตรวจเช็คระบบไฟ',
      equipment: 'หม้อแปลง',
      date: '20/8/2026',
      contact: 'ชาลี 4528',
      dept: 'หมด-ช.',
      ecm_url: '',
      notify: 'งานเข้า',
      status: 'SAP',
      check: 'TRUE',
      groups: 'W14',
    },
  ],
  allCheckDetails: [
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
      check: 'TRUE',
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
      check: 'FALSE',
      groups: 'W11',
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

  it('toggles sap work orders table on clicking SAP card and filters SAP items', async () => {
    const user = userEvent.setup();
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /ดูตารางรายการ SAP/i })).toBeDefined();
    });

    const sapCard = screen.getByRole('button', { name: /ดูตารางรายการ SAP/i });
    expect(screen.queryByText(/รายการ W\/O สถานะ:/i)).toBeNull();

    // Click SAP -> opens table
    await user.click(sapCard);
    expect(screen.getByText(/รายการ W\/O สถานะ:/i)).toBeDefined();
    expect(screen.getByText('ทำชิ้นวางของ 10 ตัว')).toBeDefined();
    expect(screen.getByText('ตรวจเช็คระบบไฟ')).toBeDefined();
    expect(screen.queryByText('ซ่อมแซมมอเตอร์ 1')).toBeNull();
    expect(screen.queryByText('เปลี่ยนลูกปืนเสร็จแล้ว')).toBeNull();

    // Search in SAP table
    const searchInput = screen.getByPlaceholderText('ค้นหาในตาราง...');
    await user.type(searchInput, 'ชิ้นวางของ');
    expect(screen.getByText('ทำชิ้นวางของ 10 ตัว')).toBeDefined();
    expect(screen.queryByText('ตรวจเช็คระบบไฟ')).toBeNull();

    // Click SAP card again -> closes table
    await user.click(sapCard);
    await waitFor(() => {
      expect(screen.queryByText(/รายการ W\/O สถานะ:/i)).toBeNull();
    });
  });

  it('toggles check work orders table on clicking Check False card and filters FALSE items', async () => {
    const user = userEvent.setup();
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /ดูตารางรายการ Check False/i })).toBeDefined();
    });

    const checkCard = screen.getByRole('button', { name: /ดูตารางรายการ Check False/i });
    expect(screen.queryByText(/รายการ W\/O สถานะ:/i)).toBeNull();

    // Click Check False -> opens table
    await user.click(checkCard);
    expect(screen.getByText(/รายการ W\/O สถานะ:/i)).toBeDefined();
    expect(screen.getByText('CHECK FALSE')).toBeDefined();
    expect(screen.getByText('ซ่อมบำรุงปั๊มน้ำ')).toBeDefined();
    // Items with check === 'TRUE' shouldn't appear
    expect(screen.queryByText('ซ่อมแซมมอเตอร์ 1')).toBeNull();
    expect(screen.queryByText('เปลี่ยนลูกปืนเสร็จแล้ว')).toBeNull();
    expect(screen.queryByText('ทำชิ้นวางของ 10 ตัว')).toBeNull();

    // Search in Check False table
    const searchInput = screen.getByPlaceholderText('ค้นหาในตาราง...');
    await user.type(searchInput, 'ปั๊มน้ำ');
    expect(screen.getByText('ซ่อมบำรุงปั๊มน้ำ')).toBeDefined();

    // Click Check False card again -> closes table
    await user.click(checkCard);
    await waitFor(() => {
      expect(screen.queryByText(/รายการ W\/O สถานะ:/i)).toBeNull();
    });
  });
});
