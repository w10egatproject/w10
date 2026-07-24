'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, ClipboardList, Filter, RefreshCw, Search, ShoppingCart, ShoppingBag, Package, Truck, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import NavigationMenu from '@/components/navigation/NavigationMenu';

type GaugeData = { empNorm?: number; empOT?: number; w11_1?: number; };
type NameValue = { name: string; value: number; };
type PairRow = { col1: string; col2: string | number; };
type PurchaseRow = { ecm_buy: string; ecm: string; wo: string; item: string; equip: string; date_in: string; date_start: string; date_out: string; status: string; action: string; };
type PurchasingData = { gauges?: GaugeData; chartData?: NameValue[]; summaryTableData?: PairRow[]; secondChartData?: NameValue[]; secondTableData?: PairRow[]; purchaseList?: PurchaseRow[]; currentYear?: string; currentMonth?: string; error?: string; };
type ChartPointContext = {
  category?: string;
  name?: string;
  options?: { custom?: { statusName?: string } };
  point?: { category?: string; custom?: { statusName?: string }; name?: string };
  x?: unknown;
  y?: unknown;
};

const chartColors = ['#fde68a', '#fdba74', '#93c5fd', '#86efac', '#c4b5fd', '#f9a8d4', '#67e8f9', '#fca5a5'];

/* ──────────────────────────────────────────────
   Color Theme System
   ────────────────────────────────────────────── */
type ColorTheme = 'gold' | 'teal';

const themeTokens = {
  gold: {
    // Header
    headerBorder: 'border-[#ffd56d]',
    headerShadow: 'shadow-md shadow-slate-200/70',
    iconBox: 'bg-[#5c607f] text-[#ffef9a]',
    iconBoxShadow: 'shadow-lg shadow-indigo-100/60',
    // Accent / loading
    accent: 'text-[#d4a300]',
    accentBadgeBg: 'bg-yellow-50',
    // Menu
    menuBtn: 'bg-[#ffe08a] text-[#4A4A49] hover:bg-[#ffd56a]',
    menuItemHover: 'hover:bg-yellow-50',
    // Panel 1 – summary chart
    p1Border: 'border-[#b9dcff]',
    p1Bg: 'bg-[#e8f5ff]/95',
    p1Shadow: 'shadow-sm shadow-sky-100/60',
    p1Bar: 'bg-[#ffe08a]',
    p1IconHover: 'group-hover:text-[#d4a300]',
    p1TblBorder: 'border-[#cfe6f7]',
    p1TblHeadBg: 'bg-[#eef6ff]/90',
    p1TblRowBg: 'bg-[#fffdf7]/80',
    p1TblRowHover: 'hover:bg-yellow-50/40',
    // Panel 2 – status chart
    p2Border: 'border-[#c7d7ff]',
    p2Bg: 'bg-[#edf3ff]/95',
    p2Shadow: 'shadow-sm shadow-sky-100/60',
    p2Bar: 'bg-[#f9a66c]',
    p2IconHover: 'group-hover:text-orange-400',
    p2TblBorder: 'border-[#d7def8]',
    p2TblHeadBg: 'bg-[#f0f4ff]/90',
    p2TblRowHover: 'hover:bg-orange-50/40',
    p2CellHover: 'hover:bg-[#fff3cf]',
    // Detail table section
    dtBorder: 'border-[#b9dcff]',
    dtBg: 'bg-[#e8f5ff]/95',
    dtShadow: 'shadow-sm shadow-sky-100/60',
    dtHeaderBg: 'bg-[#f5fbff]/70',
    dtBar: 'bg-[#5c607f]',
    dtTblBorder: 'border-[#cfe6f7]',
    dtTblHeadBg: 'bg-[#eef6ff]/90',
    dtTblRowBg: 'bg-[#fffdf7]/60',
    dtTblRowHover: 'hover:bg-yellow-50/50',
    // Search
    sBorder: 'border-2 border-[#cfe6f7]',
    sFocusBorder: 'focus:border-[#ffe08a]',
    sBg: 'bg-[#fffdf7]',
    sIconFocus: 'group-focus-within/search:text-[#d4a300]',
    // Filter badge
    fBadgeBg: 'bg-[#fff3cf]',
    fBadgeText: 'text-[#9a6700]',
    fBadgeBorder: 'border border-[#eecb70]',
    fCloseText: 'text-[#7c4a00]',
    // Loading section
    lBorder: 'border-2 border-[#dbeafe]',
    lBg: 'bg-[#e8f5ff]/95',
    // Chart tooltip
    ttBg: '#fffdf7',
    ttBorderColor: '#f9a66c',
    // Stat card (gauge panel)
    scBlueBg: 'bg-[#fff7d6] text-slate-900 border-[#f6d77a]',
    scShadow: 'shadow-sm shadow-yellow-100/60',
    // Gauge card
    gaugeBg: 'bg-[#fff8e8]',
    gaugeBorder: 'border border-[#f7e7b7]',
    gaugeShadow: 'shadow-sm shadow-yellow-100/50',
  },
  teal: {
    // Header
    headerBorder: 'border-[#5eead4]',
    headerShadow: 'shadow-md shadow-teal-200/50',
    iconBox: 'bg-[#134e4a] text-[#99f6e4]',
    iconBoxShadow: 'shadow-lg shadow-teal-100/60',
    // Accent / loading
    accent: 'text-teal-600',
    accentBadgeBg: 'bg-teal-50',
    // Menu
    menuBtn: 'bg-[#5eead4] text-[#134e4a] hover:bg-[#2dd4bf]',
    menuItemHover: 'hover:bg-teal-50',
    // Panel 1 – summary chart
    p1Border: 'border-[#99f6e4]',
    p1Bg: 'bg-[#ecfdf5]/95',
    p1Shadow: 'shadow-sm shadow-teal-100/60',
    p1Bar: 'bg-[#5eead4]',
    p1IconHover: 'group-hover:text-teal-600',
    p1TblBorder: 'border-[#a7f3d0]',
    p1TblHeadBg: 'bg-[#ecfdf5]/90',
    p1TblRowBg: 'bg-[#f0fdfa]/80',
    p1TblRowHover: 'hover:bg-teal-50/40',
    // Panel 2 – status chart
    p2Border: 'border-[#a7f3d0]',
    p2Bg: 'bg-[#f0fdfa]/95',
    p2Shadow: 'shadow-sm shadow-teal-100/60',
    p2Bar: 'bg-[#14b8a6]',
    p2IconHover: 'group-hover:text-teal-400',
    p2TblBorder: 'border-[#a7f3d0]',
    p2TblHeadBg: 'bg-[#ecfdf5]/90',
    p2TblRowHover: 'hover:bg-emerald-50/40',
    p2CellHover: 'hover:bg-[#ccfbf1]',
    // Detail table section
    dtBorder: 'border-[#99f6e4]',
    dtBg: 'bg-[#ecfdf5]/95',
    dtShadow: 'shadow-sm shadow-teal-100/60',
    dtHeaderBg: 'bg-[#f0fdf4]/70',
    dtBar: 'bg-[#134e4a]',
    dtTblBorder: 'border-[#a7f3d0]',
    dtTblHeadBg: 'bg-[#ecfdf5]/90',
    dtTblRowBg: 'bg-[#f0fdfa]/60',
    dtTblRowHover: 'hover:bg-teal-50/50',
    // Search
    sBorder: 'border-2 border-[#a7f3d0]',
    sFocusBorder: 'focus:border-[#5eead4]',
    sBg: 'bg-[#f0fdfa]',
    sIconFocus: 'group-focus-within/search:text-teal-600',
    // Filter badge
    fBadgeBg: 'bg-[#ccfbf1]',
    fBadgeText: 'text-[#0f766e]',
    fBadgeBorder: 'border border-[#5eead4]',
    fCloseText: 'text-[#134e4a]',
    // Loading section
    lBorder: 'border-2 border-[#a7f3d0]',
    lBg: 'bg-[#ecfdf5]/95',
    // Chart tooltip
    ttBg: '#f0fdfa',
    ttBorderColor: '#14b8a6',
    // Stat card (gauge panel)
    scBlueBg: 'bg-[#ccfbf1] text-slate-900 border-[#5eead4]',
    scShadow: 'shadow-sm shadow-teal-100/60',
    // Gauge card
    gaugeBg: 'bg-[#ecfdf5]',
    gaugeBorder: 'border border-[#a7f3d0]',
    gaugeShadow: 'shadow-sm shadow-teal-100/50',
  },
} as const;

/* ──────── Animation variants ──────── */
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' }
  }
};

const HighchartsClient = dynamic(() => import('@/components/charts/HighchartsClient'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[280px] items-center justify-center rounded-2xl bg-slate-50 text-xs font-black uppercase tracking-widest text-slate-400">
      Loading Chart
    </div>
  ),
});

const SpeedometerClient = dynamic(() => import('@/components/charts/SpeedometerClient'), {
  ssr: false,
  loading: () => <div className="h-[112px] w-[176px] rounded-xl bg-white/70" />,
});

type ThemeTokens = typeof themeTokens[ColorTheme];

interface ModernGaugeProps {
  value?: number;
  label: string;
  theme: ThemeTokens;
}

const ModernGauge: React.FC<ModernGaugeProps> = ({ value, label, theme: t }) => {
  const safeValue: number = typeof value === 'number' ? value : 0;
  const clampedValue = Math.min(Math.max(safeValue, -3), 3);
  
  return (
    <div className={`flex h-full flex-col items-center p-4 rounded-2xl w-full relative ${t.gaugeBg} ${t.gaugeBorder} ${t.gaugeShadow}`}>
      <div className="text-[12px] font-black text-slate-500 uppercase tracking-wide mb-1">{label}</div>
      <div className="h-28 w-44">
        <SpeedometerClient
          value={Number(clampedValue.toFixed(2))}
          minValue={-3}
          maxValue={3}
          segments={3}
          customSegmentStops={[-3, -1, 1, 3]}
          segmentColors={['#fde68a', '#86efac', '#fca5a5']}
          needleColor="#1e293b"
          needleHeightRatio={0.6}
          startColor="#FCD34D"
          endColor="#F87171"
          ringWidth={20}
          maxSegmentLabels={0}
          width={176}
          height={112}
          currentValueText={`${safeValue.toFixed(2)}`}
          valueTextFontSize="14px"
          textColor="#1e293b"
        />
      </div>
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: string | number;
  tone?: 'blue' | 'slate';
  theme: ThemeTokens;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, tone = 'slate', theme: t }) => {
  const toneClasses = { 
    blue: t.scBlueBg, 
    slate: 'bg-white text-slate-900 border-slate-200' 
  };
  
  const iconMap: Record<string, React.ReactNode> = {
    'W11-1': <Truck className="absolute -right-2 -bottom-2 w-20 h-20 text-amber-500/10" />,
    'รายการทั้งหมด': <Package className="absolute -right-2 -bottom-2 w-20 h-20 text-emerald-500/10" />,
    'รายการที่แสดง': <ShoppingBag className="absolute -right-2 -bottom-2 w-20 h-20 text-orange-500/10" />
  };

  return (
    <motion.div 
      variants={itemVariants}
      whileHover={{ y: -5 }}
      className={`grid min-h-[150px] grid-rows-[auto_1fr] rounded-2xl border-2 p-6 ${t.scShadow} relative overflow-hidden group hover:shadow-md transition-all ${toneClasses[tone]}`}
    >
      {iconMap[label]}
      <div className="whitespace-nowrap text-[13px] font-black uppercase tracking-wide text-slate-500 z-10">{label}</div>
      <div className="flex items-center justify-center text-5xl font-black z-10 text-[#4A4A49] group-hover:scale-105 transition-transform">{value}</div>
    </motion.div>
  );
};

const THAI_MONTHS = [
  { value: '1', label: 'ม.ค.' },
  { value: '2', label: 'ก.พ.' },
  { value: '3', label: 'มี.ค.' },
  { value: '4', label: 'เม.ย.' },
  { value: '5', label: 'พ.ค.' },
  { value: '6', label: 'มิ.ย.' },
  { value: '7', label: 'ก.ค.' },
  { value: '8', label: 'ส.ค.' },
  { value: '9', label: 'ก.ย.' },
  { value: '10', label: 'ต.ค.' },
  { value: '11', label: 'พ.ย.' },
  { value: '12', label: 'ธ.ค.' }
];

const DEFAULT_YEAR = "2025";

type PurchasingPageContentProps = {
  apiPath?: string;
  pageTitle?: string;
  pageSubtitle?: string;
  fixedFilters?: boolean;
  showGaugePanel?: boolean;
  showSummaryPanel?: boolean;
  tableColumnCount?: 9 | 10;
  colorTheme?: ColorTheme;
};

export function PurchasingPageContent({
  apiPath = '/api/purchasing',
  pageTitle = 'การจัดซื้อจัดจ้าง',
  pageSubtitle = 'EGAT Procurement Summary',
  fixedFilters = false,
  showGaugePanel = true,
  showSummaryPanel = true,
  tableColumnCount = 10,
  colorTheme = 'gold',
}: PurchasingPageContentProps = {}) {
  const t = themeTokens[colorTheme];

  const [data, setData] = useState<PurchasingData | null>(null);
  const [year, setYear] = useState(DEFAULT_YEAR);
  const [month, setMonth] = useState("all");
  const [hoveredPurchaseStatus, setHoveredPurchaseStatus] = useState('');
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback((y: string | null, m: string | null, isInitial = false, showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError('');
    const params = new URLSearchParams();
    if (y) params.append("year", y);
    if (m) params.append("month", m);
    fetch(`${apiPath}?${params.toString()}`, { cache: 'no-store' })
      .then((res) => { if (!res.ok) throw new Error('โหลดข้อมูลจัดซื้อไม่สำเร็จ'); return res.json(); })
      .then((payload: PurchasingData) => { 
        if (payload.error) throw new Error(payload.error); 
        setData(payload); 
        if (payload.currentYear) setYear(payload.currentYear); 
        if (payload.currentMonth) setMonth(payload.currentMonth === 'รวมทุกเดือน' ? 'all' : payload.currentMonth); 
      })
      .catch((err: Error) => { setError(err.message); })
      .finally(() => {
        if (showLoading) setIsLoading(false);
      });
  }, [apiPath]);

  useEffect(() => {
    loadData(null, null, true);

    const refreshTimer = window.setInterval(() => {
      loadData(null, null, false, false);
    }, 30000);

    return () => window.clearInterval(refreshTimer);
  }, [loadData]);

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (fixedFilters) return;
    const val = e.target.value;
    setYear(val);
    try {
      localStorage.setItem('dashboard_year', val);
    } catch (e) {
      console.error('LocalStorage write error:', e);
    }
    loadData(val, month);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (fixedFilters) return;
    const val = e.target.value;
    setMonth(val);
    try {
      localStorage.setItem('dashboard_month', val);
    } catch (e) {
      console.error('LocalStorage write error:', e);
    }
    loadData(year, val);
  };

  const handleRefresh = () => {
    loadData(null, null);
  };

  const { chartData = [], summaryTableData = [], secondChartData = [], secondTableData = [], purchaseList = [], gauges = {} } = data || {};

  const normalizeStatus = useCallback((value: string) => value
    .toString()
    .trim()
    .replace(/^\d+\s*[.)]\s*/, '')
    .replace(/\s+/g, '')
    .toLowerCase(), []);

  const isSameStatus = useCallback((left: string, right: string) => {
    const normalizedLeft = normalizeStatus(left);
    const normalizedRight = normalizeStatus(right);

    return !!normalizedLeft && !!normalizedRight && (normalizedLeft === normalizedRight || normalizedLeft.includes(normalizedRight) || normalizedRight.includes(normalizedLeft));
  }, [normalizeStatus]);

  const togglePurchaseStatusFilter = useCallback((statusName: string) => {
    const nextStatus = statusName.trim();
    if (!nextStatus) return;

    setHoveredPurchaseStatus((currentStatus) => {
      return isSameStatus(currentStatus, nextStatus) ? '' : nextStatus;
    });
  }, [isSameStatus]);

  const primaryChartData = useMemo(() => chartData.map((item) => ({ name: item.name || '-', y: item.value || 0 })).filter((item) => item.y > 0), [chartData]);
  
  const chartHasSelectedStatus = useMemo(() => !!hoveredPurchaseStatus && secondChartData.some((item) => isSameStatus(item.name || '', hoveredPurchaseStatus)), [hoveredPurchaseStatus, secondChartData, isSameStatus]);
  
  const secondaryChartData = useMemo(() => secondChartData
    .map((item, index) => {
      const statusName = item.name || '-';
      const isSelected = chartHasSelectedStatus && isSameStatus(statusName, hoveredPurchaseStatus);
      const isDimmed = chartHasSelectedStatus && !isSelected;
      const baseColor = chartColors[index % chartColors.length];

      return {
        name: statusName,
        y: item.value || 0,
        color: isDimmed ? 'rgba(148, 163, 184, 0.22)' : baseColor,
        borderColor: isSelected ? '#334155' : isDimmed ? 'rgba(148, 163, 184, 0.35)' : '#64748b',
        borderWidth: isSelected ? 3 : 1,
        dataLabels: {
          style: {
            color: isDimmed ? 'rgba(75, 85, 99, 0.35)' : '#374151',
            fontWeight: '800',
            textOutline: 'none',
          },
        },
        custom: { statusName, isSelected },
        events: {
          click: function (this: ChartPointContext) {
            togglePurchaseStatusFilter(String(this.options?.custom?.statusName || this.name || ''));
          },
        },
      };
    })
    .filter((item) => item.name !== '-'), [secondChartData, chartHasSelectedStatus, hoveredPurchaseStatus, isSameStatus, togglePurchaseStatusFilter]);

  const hasSecondaryChartData = secondaryChartData.length > 0;
  
  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const normalizedHoveredStatus = normalizeStatus(hoveredPurchaseStatus);

    return purchaseList.filter((row) => {
      const normalizedRowStatus = normalizeStatus(row.status || '');
      const matchesHoveredStatus = !normalizedHoveredStatus || normalizedRowStatus === normalizedHoveredStatus || normalizedRowStatus.includes(normalizedHoveredStatus) || normalizedHoveredStatus.includes(normalizedRowStatus);
      const matchesQuery = !normalizedQuery || Object.values(row).some((value) => value?.toString().toLowerCase().includes(normalizedQuery));
      return matchesHoveredStatus && matchesQuery;
    });
  }, [hoveredPurchaseStatus, purchaseList, query, normalizeStatus]);

  const handleStatusChartPointer = (event: React.MouseEvent<HTMLDivElement>) => {
    if (secondaryChartData.length === 0) return;

    const target = event.target;
    if (target instanceof Element && target.closest('.highcharts-point, .highcharts-data-label')) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const plotLeft = 54;
    const plotRight = rect.width - 18;
    const plotTop = 36;
    const plotBottom = rect.height - 46;

    if (x < plotLeft || x > plotRight || y < plotTop || y > plotBottom) return;

    const ratio = (x - plotLeft) / Math.max(plotRight - plotLeft, 1);
    const index = Math.min(secondaryChartData.length - 1, Math.max(0, Math.floor(ratio * secondaryChartData.length)));
    const statusName = secondaryChartData[index]?.name;

    if (statusName) togglePurchaseStatusFilter(statusName);
  };
  
  const getStatusStyle = (status: string) => {
    if (!status) return 'bg-slate-100 text-slate-400';
    const s = status.trim();
    if (s.includes('รอซื้อจ้าง')) return 'bg-[#8B4513] text-white'; // น้ำตาล
    if (s.includes('กบย-ช')) return 'bg-slate-400 text-white'; // เทา
    if (s.includes('หซ') || s.includes('หจ')) return 'bg-orange-200 text-orange-800'; // ส้มอ่อน
    if (s.includes('เสนอราคา')) return 'bg-pink-300 text-pink-900'; // ชมพู
    if (s.includes('ติดตามPO')) return 'bg-emerald-100 text-emerald-800'; // เขียวมิ้นอ่อน
    if (s.includes('ส่งของ')) return 'bg-green-600 text-white'; // เขียว
    if (s.includes('งานเข้า')) return 'bg-yellow-100 text-yellow-800'; // เหลืองอ่อน
    if (s.includes('ดำเนินการ') && !s.includes('รอ')) return 'bg-green-200 text-green-900'; // เขียวอ่อน
    if (s.includes('รอดำเนินการ')) return 'bg-red-200 text-red-900'; // แดงอ่อน
    if (s.includes('เสร็จ')) return 'bg-yellow-400 text-slate-900'; // เหลือง
    if (s.includes('ยกเลิก') || s.toLowerCase().includes('help me')) return 'bg-white text-slate-400 border border-slate-200'; // ขาว
    return 'bg-[#FFD100] text-[#4A4A49]'; // default
  };

  const chartOptions = useMemo(() => ({ chart: { type: 'pie', backgroundColor: 'transparent', options3d: { enabled: true, alpha: 45 }, height: 300 }, colors: chartColors, credits: { enabled: false }, title: { text: '' }, plotOptions: { pie: { innerSize: '58%', depth: 38, colorByPoint: true, dataLabels: { enabled: true, format: '{point.name}: {point.percentage:.0f}%', style: { fontWeight: '800', textOutline: 'none', color: '#4b5563' } } } }, series: [{ name: 'Purchasing', data: primaryChartData }] }), [primaryChartData]);
  
  const equipChartOptions = useMemo(() => ({
    chart: { type: 'column', backgroundColor: 'transparent', options3d: { enabled: true, alpha: 8, beta: 12, depth: 45 }, height: 300 },
    credits: { enabled: false },
    title: { text: '' },
    tooltip: {
      backgroundColor: t.ttBg,
      borderColor: t.ttBorderColor,
      borderRadius: 12,
      borderWidth: 2,
      shadow: true,
      formatter: function (this: ChartPointContext) {
        const statusName = String(this.point?.custom?.statusName || this.x || this.point?.category || this.point?.name || '');
        return `<b>${statusName}</b><br/><span style="font-weight:800">${this.y}</span> รายการ`;
      },
      style: { color: '#374151', fontWeight: '700' },
    },
    xAxis: { categories: secondaryChartData.map((item) => item.name), gridLineWidth: 1, gridLineColor: '#cbd5e1', lineColor: '#94a3b8', lineWidth: 1 },
    yAxis: { title: { text: '' }, gridLineWidth: 1, gridLineColor: '#cbd5e1', lineColor: '#94a3b8', lineWidth: 1 },
    legend: { enabled: false },
    plotOptions: {
      series: {
        point: {
          events: {
            click: function (this: ChartPointContext) {
              togglePurchaseStatusFilter(String(this.options?.custom?.statusName || this.category || this.name || ''));
            },
          },
        },
      },
      column: {
        borderColor: '#64748b',
        borderRadius: 4,
        borderWidth: 1,
        cursor: 'pointer',
        depth: 24,
        dataLabels: { enabled: true, style: { color: '#4b5563', fontWeight: '800' } },
        point: {
          events: {
            click: function (this: ChartPointContext) {
              togglePurchaseStatusFilter(String(this.options?.custom?.statusName || this.category || this.name || ''));
            },
          },
        },
        states: {
          hover: {
            brightness: 0.12,
            borderColor: '#334155',
            borderWidth: 3,
          },
        },
      },
    },
    series: [{ name: 'จำนวน', data: secondaryChartData }],
  }), [secondaryChartData, togglePurchaseStatusFilter, t.ttBg, t.ttBorderColor]);

  const totalSummary = useMemo(() => summaryTableData.reduce((sum, row) => sum + (parseFloat(row.col2?.toString().replace(/[^0-9.-]/g, '')) || 0), 0), [summaryTableData]);
  const tableHeaders = tableColumnCount === 9
    ? ['ECM ซื้อจ้าง', 'ECM', 'W/O', 'รายการ', 'Equip', 'Date เข้า', 'Date เริ่มงาน', 'Date ออกงาน', 'สถานะ']
    : ['ECM ซื้อจ้าง', 'ECM', 'W/O', 'รายการ', 'Equip', 'Date เข้า', 'Date เริ่มงาน', 'Date ออกงาน', 'สถานะ', 'การดำเนินการ'];
  const overviewGridClass = showGaugePanel
    ? (showSummaryPanel ? 'xl:grid-cols-[280px_minmax(0,1fr)_minmax(0,1fr)]' : 'xl:grid-cols-[280px_minmax(0,1fr)]')
    : (showSummaryPanel ? 'xl:grid-cols-2' : 'xl:grid-cols-1');

  if (error) return (
    <div className="min-h-screen bg-[#e2e2e2] p-4 text-slate-900 md:p-8 font-sans flex items-center justify-center">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="rounded-2xl border-2 border-red-100 bg-red-50 p-10 text-center shadow-lg">
        <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
        <div className="text-2xl font-black text-red-700 mb-6">{error}</div>
        <button onClick={() => loadData(year, month)} className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all flex items-center gap-2 mx-auto">
          <RefreshCw size={18} /> ลองใหม่อีกครั้ง
        </button>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#e2e2e2] p-4 text-slate-900 md:p-8 font-sans">
      <motion.header 
        className={`sticky top-0 z-50 mb-6 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between bg-white/90 backdrop-blur-sm p-4 md:p-6 rounded-2xl md:rounded-3xl border-b-4 ${t.headerBorder} ${t.headerShadow}`}
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 15 }}
      >
        <div>
          <div className="flex items-center gap-4">
            <motion.div 
              whileHover={{ rotate: 10, scale: 1.1 }}
              className={`flex h-14 w-14 items-center justify-center rounded-2xl ${t.iconBox} ${t.iconBoxShadow}`}
            >
              <ShoppingCart size={28} strokeWidth={2.5} />
            </motion.div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-[#4A4A49] flex items-center gap-3">
                {pageTitle}
                <Image src="/picture/First-Photoroom.png" alt="Purchasing Icon" width={64} height={64} className="w-12 h-12 md:w-16 md:h-16 object-contain" priority />
              </h1>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-0.5">{pageSubtitle}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <AnimatePresence>
            {isLoading && (
              <motion.span 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={`flex items-center text-xs font-black ${t.accent} mr-2 ${t.accentBadgeBg} px-2 py-1 rounded-lg uppercase`}
              >
                Updating...
              </motion.span>
            )}
          </AnimatePresence>
          <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
            <Filter size={16} className="ml-2 text-slate-400" />
            <select className="h-10 rounded-xl bg-white px-4 text-sm font-black text-[#4A4A49] outline-none shadow-sm cursor-pointer hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 disabled:opacity-80 transition" value={year} onChange={handleYearChange} disabled={fixedFilters}>
              <option value="all">รวมทุกปี</option>
              {['2023', '2024', '2025', '2026'].map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select className="h-10 rounded-xl bg-white px-4 text-sm font-black text-[#4A4A49] outline-none shadow-sm cursor-pointer hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 disabled:opacity-80 transition" value={month} onChange={handleMonthChange} disabled={fixedFilters}>
              <option value="all">รวมทุกเดือน</option>
              {THAI_MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            className="px-3 md:px-4 py-2 md:py-3 bg-white text-[#4A4A49] rounded-xl md:rounded-2xl text-xs md:text-sm font-black hover:bg-slate-50 border border-slate-200 shadow-sm transition-all flex items-center gap-2 disabled:opacity-60"
          >
            <RefreshCw size={16} strokeWidth={3} className={isLoading ? `animate-spin ${t.accent}` : 'text-slate-500'} />
            รีเฟรชข้อมูล
          </motion.button>
          <NavigationMenu
            buttonClassName={t.menuBtn}
            accentClassName={t.accent}
            itemHoverClassName={t.menuItemHover}
          />
        </div>
      </motion.header>

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`flex items-center justify-center gap-3 rounded-[2rem] ${t.lBorder} ${t.lBg} p-20 text-base font-black text-slate-400 shadow-sm uppercase tracking-widest animate-pulse`}
          >
            <RefreshCw size={24} className={`animate-spin ${t.accent}`} /> กำลังโหลดข้อมูล...
          </motion.div>
        ) : (
          <motion.div 
            key="content"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <div className={`mb-10 grid grid-cols-1 gap-8 ${overviewGridClass}`}>
              {showGaugePanel && (
              <section className="grid grid-cols-1 gap-4">
                <StatCard label="W11-1" value={gauges.w11_1 || 0} tone="blue" theme={t} />
                <motion.div variants={itemVariants} className="grid grid-cols-1 gap-4">
                  <ModernGauge value={gauges.empNorm} label="พนักงานปกติ" theme={t} />
                  <ModernGauge value={gauges.empOT} label="ปกติ + OT" theme={t} />
                </motion.div>
              </section>
              )}

              <section className="contents">
                {showSummaryPanel && (
                <motion.div variants={itemVariants} className={`min-w-0 rounded-[2rem] border-b-4 ${t.p1Border} ${t.p1Bg} p-4 md:p-8 ${t.p1Shadow} relative overflow-hidden group hover:shadow-md transition-all`}>
                  <div className="mb-8 flex items-center justify-between gap-3">
                    <h2 className="font-black text-[#4A4A49] uppercase text-xl md:text-3xl tracking-wide flex items-center gap-3">
                      <div className={`w-3 h-7 md:h-10 ${t.p1Bar} rounded-full`}></div>
                      ปริมาณการซื้อ/จ้างหมวด
                    </h2>
                    <ClipboardList size={24} className={`text-slate-300 ${t.p1IconHover} transition-colors`} />
                  </div>
                  <div className="grid grid-cols-1 items-center gap-6">
                    {primaryChartData.length > 0 ? <HighchartsClient options={chartOptions} /> : <div className="flex h-[280px] items-center justify-center rounded-2xl bg-slate-50 text-xs font-black text-slate-400 uppercase tracking-widest">No Graph Data</div>}
                    <div className={`max-w-full overflow-x-auto rounded-2xl border-2 ${t.p1TblBorder}`}>
                      <table className="w-full min-w-[620px] table-fixed text-center text-[12px] md:text-[13px] font-black text-slate-500">
                        <thead className={`${t.p1TblHeadBg} text-slate-600 border-b-2 ${t.p1TblBorder}`}>
                          <tr>{summaryTableData.map((row, index) => <th key={`${row.col1}-${index}`} className="break-words px-2 py-4 leading-tight uppercase tracking-normal">{row.col1 || '-'}</th>)}</tr>
                        </thead>
                        <tbody>
                          <tr className={`${t.p1TblRowBg} ${t.p1TblRowHover} transition-colors`}>
                            {summaryTableData.map((row, index) => <td key={`${row.col2}-${index}`} className={`whitespace-nowrap px-2 py-4 text-[#4A4A49] text-lg md:text-xl font-black border-t ${t.p1TblBorder}`}>{row.col2 || 0}</td>)}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
                )}

                <motion.div variants={itemVariants} className={`min-w-0 rounded-[2rem] border-b-4 ${t.p2Border} ${t.p2Bg} p-4 md:p-8 ${t.p2Shadow} relative overflow-hidden group hover:shadow-md transition-all`}>
                  <div className="mb-8 flex items-center justify-between gap-3">
                    <h2 className="font-black text-[#4A4A49] uppercase text-xl md:text-3xl tracking-wide flex items-center gap-3">
                      <div className={`w-3 h-7 md:h-10 ${t.p2Bar} rounded-full`}></div>
                      สถานะการซื้อจ้าง
                    </h2>
                    <CalendarDays size={24} className={`text-slate-300 ${t.p2IconHover} transition-colors`} />
                  </div>
                  {hasSecondaryChartData ? (
                    <div
                      onClick={handleStatusChartPointer}
                      className="cursor-pointer"
                    >
                      <HighchartsClient options={equipChartOptions} />
                    </div>
                  ) : <div className="flex h-[280px] items-center justify-center rounded-2xl bg-slate-50 text-xs font-black text-slate-400 uppercase tracking-widest">No Graph Data</div>}
                  <div className={`mt-6 max-w-full overflow-x-auto rounded-2xl border-2 ${t.p2TblBorder}`}>
                    <table className="w-full min-w-[620px] table-fixed text-center text-[12px] md:text-[13px] font-black text-slate-500">
                      <thead className={`${t.p2TblHeadBg} text-slate-600 border-b-2 ${t.p2TblBorder}`}>
                        <tr>{secondTableData.map((row, index) => <th key={`${row.col1}-${index}`} className="break-words px-2 py-4 leading-tight uppercase tracking-normal">{row.col1 || '-'}</th>)}</tr>
                      </thead>
                      <tbody>
                        <tr className={`${t.p1TblRowBg} ${t.p2TblRowHover} transition-colors`}>
                          {secondTableData.map((row, index) => (
                            <td
                              key={`${row.col2}-${index}`}
                              onClick={() => row.col1 && togglePurchaseStatusFilter(row.col1)}
                              className={`whitespace-nowrap px-2 py-4 text-[#4A4A49] text-lg md:text-xl font-black border-t ${t.p2TblBorder} cursor-pointer ${t.p2CellHover} transition-colors`}
                            >
                              {row.col2 || 0}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              </section>
            </div>

            <motion.section variants={itemVariants} className={`rounded-[2rem] border-b-4 ${t.dtBorder} ${t.dtBg} ${t.dtShadow} overflow-hidden mb-10 group hover:shadow-md transition-all`}>
              <div className={`flex flex-col gap-4 border-b-2 ${t.dtTblBorder} p-4 md:p-8 lg:flex-row lg:items-center lg:justify-between ${t.dtHeaderBg}`}>
                <div>
                  <h2 className="font-black text-[#4A4A49] uppercase text-xl md:text-3xl tracking-wide flex items-center gap-3">
                    <div className={`w-3 h-7 md:h-10 ${t.dtBar} rounded-full`}></div>
                    รายละเอียดรายการจัดซื้อจัดจ้าง
                  </h2>
                  <p className="mt-2 text-[13px] font-black uppercase text-slate-500 tracking-wide">
                    Summary Total: <span className="text-[#4A4A49]">{totalSummary}</span>
                    <AnimatePresence>
                      {hoveredPurchaseStatus && (
                        <motion.span 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className={`ml-3 inline-flex rounded-lg ${t.fBadgeBg} px-3 py-1 ${t.fBadgeText} ${t.fBadgeBorder}`}
                        >
                          แสดงเฉพาะ: {hoveredPurchaseStatus}
                          <button
                            type="button"
                            onClick={() => setHoveredPurchaseStatus('')}
                            className={`ml-3 font-black ${t.fCloseText} hover:text-[#4A4A49]`}
                          >
                            แสดงทั้งหมด
                          </button>
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="relative group/search">
                    <Search size={18} className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 ${t.sIconFocus} transition-colors`} strokeWidth={3} />
                    <input
                      className={`h-12 w-full rounded-2xl ${t.sBorder} ${t.sBg} pl-12 pr-4 text-base font-bold text-[#4A4A49] outline-none ${t.sFocusBorder} sm:w-80 shadow-sm transition-all`}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="SEARCH ECM, W/O, ITEMS..."
                    />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                  <table className={`w-full min-w-[1200px] text-left text-[15px] border-collapse border ${t.dtTblBorder}`}>
                    <thead className={`${t.dtTblHeadBg} text-[12px] font-black uppercase tracking-wide text-slate-500`}>
                      <tr>
                        {tableHeaders.map((header) => (
                          <th key={header} className={`px-6 py-5 font-black border ${t.dtTblBorder}`}>{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="">
                      {filteredRows.length > 0 ? filteredRows.map((row, index) => (
                        <motion.tr 
                          key={`${row.ecm_buy}-${row.wo}-${index}`} 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.005 }}
                          className={`${t.dtTblRowBg} ${t.dtTblRowHover} transition-colors`}
                        >
                          <td className={`px-6 py-5 font-black text-[#4A4A49] border ${t.dtTblBorder}`}>{row.ecm_buy || '-'}</td>
                          <td className={`px-6 py-5 font-bold text-slate-600 border ${t.dtTblBorder}`}>{row.ecm || '-'}</td>
                          <td className={`px-6 py-5 font-bold text-slate-600 border ${t.dtTblBorder}`}>{row.wo || '-'}</td>
                          <td className={`max-w-[400px] px-6 py-5 font-bold text-[#4A4A49] leading-relaxed border ${t.dtTblBorder}`}>{row.item || '-'}</td>
                          <td className={`px-6 py-5 font-black text-slate-600 border ${t.dtTblBorder}`}>{row.equip || '-'}</td>
                          <td className={`px-6 py-5 font-bold text-slate-600 whitespace-nowrap border ${t.dtTblBorder}`}>{row.date_in || '-'}</td>
                          <td className={`px-6 py-5 font-bold text-slate-600 whitespace-nowrap border ${t.dtTblBorder}`}>{row.date_start || '-'}</td>
                          <td className={`px-6 py-5 font-bold text-slate-600 whitespace-nowrap border ${t.dtTblBorder}`}>{row.date_out || '-'}</td>
                          <td className={`px-6 py-5 border ${t.dtTblBorder}`}>
                            <span className={`inline-flex rounded-lg px-3 py-1.5 text-[12px] font-black uppercase tracking-wide shadow-sm ${getStatusStyle(row.status)}`}>{row.status || '-'}</span>
                          </td>
                          {tableColumnCount === 10 && <td className={`px-6 py-5 font-bold text-slate-600 border ${t.dtTblBorder}`}>{row.action || '-'}</td>}
                        </motion.tr>
                      )) : (
                        <tr>
                          <td className={`px-6 py-20 text-center text-sm font-black text-slate-400 uppercase tracking-widest border ${t.dtTblBorder}`} colSpan={tableColumnCount}>No data found matching your filters</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PurchasingPage() {
  return <PurchasingPageContent />;
}
