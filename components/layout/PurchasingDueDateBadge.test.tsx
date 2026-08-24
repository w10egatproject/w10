import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PurchasingPageContent } from '@/app/purchasing/page';

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

const formatFormattedDate = (daysFromNow: number) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
};

const mockPurchasingData = {
  currentYear: '2025',
  currentMonth: 'all',
  gauges: { empNorm: 0, empOT: 0, w11_1: 0 },
  chartData: [],
  summaryTableData: [],
  secondChartData: [],
  secondTableData: [],
  purchaseList: [
    {
      ecm_buy: '',
      ecm: '001',
      wo: 'WO-OVERDUE',
      item: 'งานเลยกำหนด',
      equip: 'Equip 1',
      date_in: '1/8/2026',
      date_start: formatFormattedDate(-2), // -2 days -> Overdue (แดงเข้ม)
      date_out: '',
      status: '1.รอซื้อจ้าง',
      action: '',
    },
    {
      ecm_buy: '',
      ecm: '002',
      wo: 'WO-3DAYS',
      item: 'งานใกล้ถึง 2 วัน',
      equip: 'Equip 2',
      date_in: '1/8/2026',
      date_start: formatFormattedDate(2), // 2 days -> แดงอ่อน
      date_out: '',
      status: '4.เสนอราคา',
      action: '',
    },
    {
      ecm_buy: '',
      ecm: '003',
      wo: 'WO-7DAYS',
      item: 'งานใกล้ถึง 5 วัน',
      equip: 'Equip 3',
      date_in: '1/8/2026',
      date_start: formatFormattedDate(5), // 5 days -> แดง
      date_out: '',
      status: '5.ติดตามPO',
      action: '',
    },
    {
      ecm_buy: '',
      ecm: '004',
      wo: 'WO-FUTURE',
      item: 'งานปกติ 20 วัน',
      equip: 'Equip 4',
      date_in: '1/8/2026',
      date_start: formatFormattedDate(20), // 20 days -> เขียว
      date_out: '',
      status: '1.รอซื้อจ้าง',
      action: '',
    },
    {
      ecm_buy: '',
      ecm: '005',
      wo: 'WO-COMPLETED',
      item: 'งานเสร็จแล้วแต่เลยกำหนด',
      equip: 'Equip 5',
      date_in: '1/8/2026',
      date_start: formatFormattedDate(-5), // Overdue but status is เสร็จ -> เขียว/neutral
      date_out: '10/8/2026',
      status: 'เสร็จ',
      action: '',
    },
    {
      ecm_buy: '',
      ecm: '006',
      wo: 'WO-NODATE',
      item: 'ไม่มีวันที่',
      equip: 'Equip 6',
      date_in: '1/8/2026',
      date_start: '',
      date_out: '',
      status: '1.รอซื้อจ้าง',
      action: '',
    },
  ],
};

describe('Purchasing Due Date Badges', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('renders expected completion date with correct color badges', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockPurchasingData,
    }));

    render(<PurchasingPageContent />);

    // Wait for content to load
    expect(await screen.findByText('WO-OVERDUE')).toBeDefined();

    // Check Overdue (-2 days) -> bg-red-800
    const overdueRow = screen.getByText('WO-OVERDUE').closest('tr');
    const overdueBadge = overdueRow?.querySelector(`span[class*="bg-red-800"]`);
    expect(overdueBadge).toBeDefined();

    // Check 2 days -> bg-red-200
    const threeDaysRow = screen.getByText('WO-3DAYS').closest('tr');
    const threeDaysBadge = threeDaysRow?.querySelector(`span[class*="bg-red-200"]`);
    expect(threeDaysBadge).toBeDefined();

    // Check 5 days -> bg-red-600
    const sevenDaysRow = screen.getByText('WO-7DAYS').closest('tr');
    const sevenDaysBadge = sevenDaysRow?.querySelector(`span[class*="bg-red-600"]`);
    expect(sevenDaysBadge).toBeDefined();

    // Check 20 days -> bg-emerald-600
    const futureRow = screen.getByText('WO-FUTURE').closest('tr');
    const futureBadge = futureRow?.querySelector(`span[class*="bg-emerald-600"]`);
    expect(futureBadge).toBeDefined();

    // Check Completed item -> bg-emerald-100 (not red)
    const completedRow = screen.getByText('WO-COMPLETED').closest('tr');
    const completedBadge = completedRow?.querySelector(`span[class*="bg-emerald-100"]`);
    expect(completedBadge).toBeDefined();

    // Check No date -> bg-slate-100 text "-"
    const noDateRow = screen.getByText('WO-NODATE').closest('tr');
    const noDateBadge = noDateRow?.querySelector(`span[class*="bg-slate-100"]`);
    expect(noDateBadge?.textContent).toBe('-');
  });
});
