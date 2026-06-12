'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CalendarDays, ChevronDown, ClipboardList, Clock, Filter, RefreshCw, Search, ShoppingCart, ShoppingBag, Package, Truck, AlertCircle, UserRound } from 'lucide-react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

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

import ReactSpeedometer from 'react-d3-speedometer';

interface ModernGaugeProps {
  value?: number;
  label: string;
}

const ModernGauge: React.FC<ModernGaugeProps> = ({ value, label }) => {
  const safeValue: number = typeof value === 'number' ? value : 0;
  const clampedValue = Math.min(Math.max(safeValue, -3), 3);
  
  return (
    <div className="flex h-full flex-col items-center bg-[#fff8e8] p-4 rounded-2xl border border-[#f7e7b7] shadow-sm shadow-yellow-100/50 w-full relative">
      <div className="text-[12px] font-black text-slate-500 uppercase tracking-wide mb-1">{label}</div>
      <div className="h-28 w-44">
        <ReactSpeedometer
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
}

const StatCard: React.FC<StatCardProps> = ({ label, value, tone = 'slate' }) => {
  const toneClasses = { 
    blue: 'bg-[#fff7d6] text-slate-900 border-[#f6d77a]', 
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
      className={`grid min-h-[150px] grid-rows-[auto_1fr] rounded-2xl border-2 p-6 shadow-sm shadow-yellow-100/60 relative overflow-hidden group hover:shadow-md transition-all ${toneClasses[tone]}`}
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

export default function PurchasingPage() {
  const [data, setData] = useState<PurchasingData | null>(null);
  const [year, setYear] = useState(DEFAULT_YEAR);
  const [month, setMonth] = useState("all");
  const [hoveredPurchaseStatus, setHoveredPurchaseStatus] = useState('');
  const [query, setQuery] = useState('');
  const [modulesLoaded, setModulesLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const loadData = useCallback((y: string | null, m: string | null, isInitial = false) => {
    setIsLoading(true);
    setError('');
    const params = new URLSearchParams();
    if (y) params.append("year", y);
    if (m) params.append("month", m);
    fetch(`/api/purchasing?${params.toString()}`, { cache: 'no-store' })
      .then((res) => { if (!res.ok) throw new Error('โหลดข้อมูลจัดซื้อไม่สำเร็จ'); return res.json(); })
      .then((payload: PurchasingData) => { 
        if (payload.error) throw new Error(payload.error); 
        setData(payload); 
        if (isInitial) { 
          if (payload.currentYear) setYear(payload.currentYear); 
          if (payload.currentMonth) setMonth(payload.currentMonth === 'รวมทุกเดือน' ? 'all' : payload.currentMonth); 
        } 
      })
      .catch((err: Error) => { setError(err.message); })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    import('highcharts/highcharts-3d').then(() => setModulesLoaded(true)).catch(() => setModulesLoaded(true));
    
    const savedYear = localStorage.getItem('dashboard_year') || DEFAULT_YEAR;
    const savedMonth = localStorage.getItem('dashboard_month') || "all";
    
    setYear(savedYear);
    setMonth(savedMonth);
    
    loadData(savedYear, savedMonth, true);
  }, [loadData]);

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
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
    loadData(year, month);
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
            setHoveredPurchaseStatus(String(this.options?.custom?.statusName || this.name || ''));
          },
        },
      };
    })
    .filter((item) => item.name !== '-'), [secondChartData, chartHasSelectedStatus, hoveredPurchaseStatus, isSameStatus]);

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

    if (statusName) setHoveredPurchaseStatus(statusName);
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
      backgroundColor: '#fffdf7',
      borderColor: '#f9a66c',
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
              setHoveredPurchaseStatus(String(this.options?.custom?.statusName || this.category || this.name || ''));
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
              setHoveredPurchaseStatus(String(this.options?.custom?.statusName || this.category || this.name || ''));
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
  }), [secondaryChartData]);

  const totalSummary = useMemo(() => summaryTableData.reduce((sum, row) => sum + (parseFloat(row.col2?.toString().replace(/[^0-9.-]/g, '')) || 0), 0), [summaryTableData]);

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
        className="sticky top-0 z-50 mb-6 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between bg-white/90 backdrop-blur-sm p-4 md:p-6 rounded-2xl md:rounded-3xl border-b-4 border-[#ffd56d] shadow-md shadow-slate-200/70"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 15 }}
      >
        <div>
          <div className="flex items-center gap-4">
            <motion.div 
              whileHover={{ rotate: 10, scale: 1.1 }}
              className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#5c607f] text-[#ffef9a] shadow-lg shadow-indigo-100/60"
            >
              <ShoppingCart size={28} strokeWidth={2.5} />
            </motion.div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-[#4A4A49] flex items-center gap-3">
                การจัดซื้อจัดจ้าง
                <Image src="/picture/First-Photoroom.png" alt="Purchasing Icon" width={64} height={64} className="w-12 h-12 md:w-16 md:h-16 object-contain" priority />
              </h1>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-0.5">EGAT Procurement Summary</p>
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
                className="flex items-center text-xs font-black text-[#d4a300] mr-2 bg-yellow-50 px-2 py-1 rounded-lg uppercase"
              >
                Updating...
              </motion.span>
            )}
          </AnimatePresence>
          <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
            <Filter size={16} className="ml-2 text-slate-400" />
            <select className="h-10 rounded-xl bg-white px-4 text-sm font-black text-[#4A4A49] outline-none shadow-sm cursor-pointer hover:bg-slate-50 transition" value={year} onChange={handleYearChange}>
              <option value="all">รวมทุกปี</option>
              {['2023', '2024', '2025', '2026'].map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select className="h-10 rounded-xl bg-white px-4 text-sm font-black text-[#4A4A49] outline-none shadow-sm cursor-pointer hover:bg-slate-50 transition" value={month} onChange={handleMonthChange}>
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
            <RefreshCw size={16} strokeWidth={3} className={isLoading ? 'animate-spin text-[#d4a300]' : 'text-slate-500'} />
            รีเฟรชข้อมูล
          </motion.button>
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              className="px-4 md:px-6 py-2 md:py-3 bg-[#ffe08a] text-[#4A4A49] rounded-xl md:rounded-2xl text-xs md:text-sm font-black hover:bg-[#ffd56a] shadow-lg transition-all flex items-center gap-2"
            >
              เมนูหน้า
              <ChevronDown size={16} strokeWidth={3} className={menuOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />
            </motion.button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-full z-20 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-300/40"
                >
                  <Link href="/" className="flex items-center gap-3 px-4 py-3 text-sm font-black text-[#4A4A49] hover:bg-slate-50">
                    <ArrowLeft size={18} className="text-slate-500" /> หน้าหลัก
                  </Link>
                  <Link href="/purchasing" className="flex items-center gap-3 border-t border-slate-100 px-4 py-3 text-sm font-black text-[#4A4A49] hover:bg-yellow-50">
                    <ShoppingCart size={18} className="text-[#d4a300]" /> จัดซื้อจัดจ้าง
                  </Link>
                  <Link href="/ot-summary" className="flex items-center gap-3 border-t border-slate-100 px-4 py-3 text-sm font-black text-[#4A4A49] hover:bg-sky-50">
                    <Clock size={18} className="text-sky-500" /> สรุป OT ลูกจ้าง
                  </Link>
                  <Link href="/ot-employee" className="flex items-center gap-3 border-t border-slate-100 px-4 py-3 text-sm font-black text-[#4A4A49] hover:bg-amber-50">
                    <UserRound size={18} className="text-amber-500" /> สรุป OT พนักงาน
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.header>

      <AnimatePresence mode="wait">
        {isLoading || !modulesLoaded ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-3 rounded-[2rem] border-2 border-[#dbeafe] bg-[#e8f5ff]/95 p-20 text-base font-black text-slate-400 shadow-sm uppercase tracking-widest animate-pulse"
          >
            <RefreshCw size={24} className="animate-spin text-[#d4a300]" /> กำลังโหลดข้อมูล...
          </motion.div>
        ) : (
          <motion.div 
            key="content"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="mb-10 grid grid-cols-1 gap-8 xl:grid-cols-[280px_minmax(0,1fr)_minmax(0,1fr)]">
              <section className="grid grid-cols-1 gap-4">
                <StatCard label="W11-1" value={gauges.w11_1 || 0} tone="blue" />
                <motion.div variants={itemVariants} className="grid grid-cols-1 gap-4">
                  <ModernGauge value={gauges.empNorm} label="พนักงานปกติ" />
                  <ModernGauge value={gauges.empOT} label="ปกติ + OT" />
                </motion.div>
              </section>

              <section className="contents">
                <motion.div variants={itemVariants} className="min-w-0 rounded-[2rem] border-b-4 border-[#b9dcff] bg-[#e8f5ff]/95 p-4 md:p-8 shadow-sm shadow-sky-100/60 relative overflow-hidden group hover:shadow-md transition-all">
                  <div className="mb-8 flex items-center justify-between gap-3">
                    <h2 className="font-black text-[#4A4A49] uppercase text-xl md:text-3xl tracking-wide flex items-center gap-3">
                      <div className="w-3 h-7 md:h-10 bg-[#ffe08a] rounded-full"></div>
                      ปริมาณการซื้อ/จ้างหมวด
                    </h2>
                    <ClipboardList size={24} className="text-slate-300 group-hover:text-[#d4a300] transition-colors" />
                  </div>
                  <div className="grid grid-cols-1 items-center gap-6">
                    {primaryChartData.length > 0 ? <HighchartsReact highcharts={Highcharts} options={chartOptions} /> : <div className="flex h-[280px] items-center justify-center rounded-2xl bg-slate-50 text-xs font-black text-slate-400 uppercase tracking-widest">No Graph Data</div>}
                    <div className="max-w-full overflow-x-auto rounded-2xl border-2 border-[#cfe6f7]">
                      <table className="w-full min-w-[620px] table-fixed text-center text-[12px] md:text-[13px] font-black text-slate-500">
                        <thead className="bg-[#eef6ff]/90 text-slate-600 border-b-2 border-[#cfe6f7]">
                          <tr>{summaryTableData.map((row, index) => <th key={`${row.col1}-${index}`} className="break-words px-2 py-4 leading-tight uppercase tracking-normal">{row.col1 || '-'}</th>)}</tr>
                        </thead>
                        <tbody>
                          <tr className="bg-[#fffdf7]/80 hover:bg-yellow-50/40 transition-colors">
                            {summaryTableData.map((row, index) => <td key={`${row.col2}-${index}`} className="whitespace-nowrap px-2 py-4 text-[#4A4A49] text-lg md:text-xl font-black border-t border-[#cfe6f7]">{row.col2 || 0}</td>)}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="min-w-0 rounded-[2rem] border-b-4 border-[#c7d7ff] bg-[#edf3ff]/95 p-4 md:p-8 shadow-sm shadow-sky-100/60 relative overflow-hidden group hover:shadow-md transition-all">
                  <div className="mb-8 flex items-center justify-between gap-3">
                    <h2 className="font-black text-[#4A4A49] uppercase text-xl md:text-3xl tracking-wide flex items-center gap-3">
                      <div className="w-3 h-7 md:h-10 bg-[#f9a66c] rounded-full"></div>
                      สถานะการซื้อจ้าง
                    </h2>
                    <CalendarDays size={24} className="text-slate-300 group-hover:text-orange-400 transition-colors" />
                  </div>
                  {hasSecondaryChartData ? (
                    <div
                      onClick={handleStatusChartPointer}
                      className="cursor-pointer"
                    >
                      <HighchartsReact highcharts={Highcharts} options={equipChartOptions} />
                    </div>
                  ) : <div className="flex h-[280px] items-center justify-center rounded-2xl bg-slate-50 text-xs font-black text-slate-400 uppercase tracking-widest">No Graph Data</div>}
                  <div className="mt-6 max-w-full overflow-x-auto rounded-2xl border-2 border-[#d7def8]">
                    <table className="w-full min-w-[620px] table-fixed text-center text-[12px] md:text-[13px] font-black text-slate-500">
                      <thead className="bg-[#f0f4ff]/90 text-slate-600 border-b-2 border-[#d7def8]">
                        <tr>{secondTableData.map((row, index) => <th key={`${row.col1}-${index}`} className="break-words px-2 py-4 leading-tight uppercase tracking-normal">{row.col1 || '-'}</th>)}</tr>
                      </thead>
                      <tbody>
                        <tr className="bg-[#fffdf7]/80 hover:bg-orange-50/40 transition-colors">
                          {secondTableData.map((row, index) => (
                            <td
                              key={`${row.col2}-${index}`}
                              onClick={() => row.col1 && setHoveredPurchaseStatus(row.col1)}
                              className="whitespace-nowrap px-2 py-4 text-[#4A4A49] text-lg md:text-xl font-black border-t border-[#d7def8] cursor-pointer hover:bg-[#fff3cf] transition-colors"
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

            <motion.section variants={itemVariants} className="rounded-[2rem] border-b-4 border-[#b9dcff] bg-[#e8f5ff]/95 shadow-sm shadow-sky-100/60 overflow-hidden mb-10 group hover:shadow-md transition-all">
              <div className="flex flex-col gap-4 border-b-2 border-[#cfe6f7] p-4 md:p-8 lg:flex-row lg:items-center lg:justify-between bg-[#f5fbff]/70">
                <div>
                  <h2 className="font-black text-[#4A4A49] uppercase text-xl md:text-3xl tracking-wide flex items-center gap-3">
                    <div className="w-3 h-7 md:h-10 bg-[#5c607f] rounded-full"></div>
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
                          className="ml-3 inline-flex rounded-lg bg-[#fff3cf] px-3 py-1 text-[#9a6700] border border-[#eecb70]"
                        >
                          แสดงเฉพาะ: {hoveredPurchaseStatus}
                          <button
                            type="button"
                            onClick={() => setHoveredPurchaseStatus('')}
                            className="ml-3 font-black text-[#7c4a00] hover:text-[#4A4A49]"
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
                    <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/search:text-[#d4a300] transition-colors" strokeWidth={3} />
                    <input
                      className="h-12 w-full rounded-2xl border-2 border-[#cfe6f7] bg-[#fffdf7] pl-12 pr-4 text-base font-bold text-[#4A4A49] outline-none focus:border-[#ffe08a] sm:w-80 shadow-sm transition-all"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="SEARCH ECM, W/O, ITEMS..."
                    />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                  <table className="w-full min-w-[1200px] text-left text-[15px] border-collapse border border-[#cfe6f7]">
                    <thead className="bg-[#eef6ff]/90 text-[12px] font-black uppercase tracking-wide text-slate-500">
                      <tr>
                        {['ECM ซื้อจ้าง', 'ECM', 'W/O', 'รายการ', 'Equip', 'Date เข้า', 'Date เริ่มงาน', 'Date ออกงาน', 'สถานะ', 'การดำเนินการ'].map((header) => (
                          <th key={header} className="px-6 py-5 font-black border border-[#cfe6f7]">{header}</th>
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
                          className="bg-[#fffdf7]/60 hover:bg-yellow-50/50 transition-colors"
                        >
                          <td className="px-6 py-5 font-black text-[#4A4A49] border border-[#cfe6f7]">{row.ecm_buy || '-'}</td>
                          <td className="px-6 py-5 font-bold text-slate-600 border border-[#cfe6f7]">{row.ecm || '-'}</td>
                          <td className="px-6 py-5 font-bold text-slate-600 border border-[#cfe6f7]">{row.wo || '-'}</td>
                          <td className="max-w-[400px] px-6 py-5 font-bold text-[#4A4A49] leading-relaxed border border-[#cfe6f7]">{row.item || '-'}</td>
                          <td className="px-6 py-5 font-black text-slate-600 border border-[#cfe6f7]">{row.equip || '-'}</td>
                          <td className="px-6 py-5 font-bold text-slate-600 whitespace-nowrap border border-[#cfe6f7]">{row.date_in || '-'}</td>
                          <td className="px-6 py-5 font-bold text-slate-600 whitespace-nowrap border border-[#cfe6f7]">{row.date_start || '-'}</td>
                          <td className="px-6 py-5 font-bold text-slate-600 whitespace-nowrap border border-[#cfe6f7]">{row.date_out || '-'}</td>
                          <td className="px-6 py-5 border border-[#cfe6f7]">
                            <span className={`inline-flex rounded-lg px-3 py-1.5 text-[12px] font-black uppercase tracking-wide shadow-sm ${getStatusStyle(row.status)}`}>{row.status || '-'}</span>
                          </td>
                          <td className="px-6 py-5 font-bold text-slate-600 border border-[#cfe6f7]">{row.action || '-'}</td>
                        </motion.tr>
                      )) : (
                        <tr>
                          <td className="px-6 py-20 text-center text-sm font-black text-slate-400 uppercase tracking-widest border border-[#cfe6f7]" colSpan={10}>No data found matching your filters</td>
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
