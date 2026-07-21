'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, AlertCircle, CheckCircle2, ChevronDown, Clock, Factory, HardHat, Info, LayoutDashboard, Package, RefreshCw, Shield, ShoppingBag, ShoppingCart, UserRound, Zap } from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';

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
  loading: () => <div className="h-[112px] w-[176px] rounded-xl bg-slate-100/70" />,
});

interface GroupBlockProps {
  name: string;
  stats?: {
    entrance?: number;
    left?: number;
    finish?: number;
    otherFinish?: number;
    out?: number;
  };
  themeColor: 'yellow' | 'green' | 'pink' | 'blue' | 'gray';
  isSummary?: boolean;
  imgSrc?: string;
}

const GroupBlock: React.FC<GroupBlockProps> = ({ name, stats, themeColor, isSummary = false, imgSrc }) => {
  const colors = { 
    yellow: 'bg-gradient-to-br from-[#fff7d6] to-[#ffe8b8] border-[#f6d77a]', 
    green: 'bg-gradient-to-br from-[#ddf8ed] to-[#c7f1df] border-[#83dcb7]', 
    pink: 'bg-gradient-to-br from-[#ffe7ef] to-[#ffd6e1] border-[#f4a8bd]', 
    blue: 'bg-gradient-to-br from-[#e0f4ff] to-[#cdeaff] border-[#91d4f5]',
    gray: 'bg-gradient-to-br from-[#f7f4ff] to-[#e9e2ff] border-[#c8b9f6]'
  };
  
  const iconMap: Record<string, React.ReactNode> = {
    'W11': <Factory className="absolute -right-6 -bottom-6 w-32 h-32 text-amber-500/5 pointer-events-none" />,
    'W12': <Zap className="absolute -right-6 -bottom-6 w-32 h-32 text-emerald-500/5 pointer-events-none" />,
    'W13': <Shield className="absolute -right-6 -bottom-6 w-32 h-32 text-rose-500/5 pointer-events-none" />,
    'W14': <HardHat className="absolute -right-6 -bottom-6 w-32 h-32 text-sky-500/5 pointer-events-none" />,
    'W_all': <LayoutDashboard className="absolute -right-6 -bottom-6 w-32 h-32 text-slate-500/5 pointer-events-none" />
  };

  return (
    <motion.div 
      variants={itemVariants}
      whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
      className={`flex flex-col rounded-3xl p-3.5 sm:p-5 ${colors[themeColor]} border shadow-sm relative overflow-hidden transition-all h-full cursor-default`}
    >
      {iconMap[name] || iconMap['W_all']}
      
      <div className="flex items-center gap-1.5 sm:gap-2.5 mb-4 z-10">
        {imgSrc ? (
          <div className="relative w-9 h-9 sm:w-11 sm:h-11 shrink-0">
            <Image 
              src={imgSrc} 
              alt={name} 
              fill
              className="rounded-full object-cover border-2 border-white shadow-sm"
            />
          </div>
        ) : (
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-slate-200/80 border-2 border-dashed border-slate-300 flex items-center justify-center text-[10px] text-slate-400 font-bold leading-none shrink-0 text-center">
            ใส่รูป
          </div>
        )}
        <div className="text-sm sm:text-xl md:text-base lg:text-xl xl:text-2xl font-black text-slate-900 leading-tight">
          {name} {isSummary ? "" : "เข้า"} {stats?.entrance || 0}
        </div>
      </div>
      
      {!isSummary && (
        <div className="text-[13px] sm:text-[15px] font-bold text-slate-600 space-y-2 bg-white/50 backdrop-blur p-3 sm:p-4 rounded-2xl border border-white/50 z-10 mt-auto">
          <div className="flex justify-between gap-4 px-1"><span>เข้าเดือนนี้ยังไม่เสร็จ</span><span className="text-slate-900">{stats?.left || 0}</span></div>
          <div className="flex justify-between gap-4 px-1"><span>เข้าเดือนนี้เสร็จ</span><span className="text-slate-900">{stats?.finish || 0}</span></div>
          <div className="flex justify-between gap-4 px-1"><span>เสร็จจากเดือนอื่น</span><span className="text-slate-900">{stats?.otherFinish || 0}</span></div>
          <div className="flex justify-between gap-4 font-black text-slate-950 pt-2 mt-2 border-t border-slate-200/50 px-1"><span>งานออก</span><span className="text-xl">{stats?.out || 0}</span></div>
        </div>
      )}
    </motion.div>
  );
};

interface ModernGaugeProps {
  value?: number;
  label: string;
}

const ModernGauge: React.FC<ModernGaugeProps> = ({ value, label }) => {
  const safeValue: number = typeof value === 'number' ? value : 0;
  const clampedValue = Math.min(Math.max(safeValue, -3), 3);
  
  return (
    <div className="flex flex-col items-center bg-white p-3 rounded-2xl border border-slate-200 shadow-sm w-full relative">
       <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</div>
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

interface DashboardData {
  currentYear?: string;
  currentMonth?: string;
  wGauges?: Record<string, { empNorm?: number; conNorm?: number; empOT?: number; conOT?: number }>;
  groupStats?: Record<string, any>;
  w_all?: { entrance?: number };
  statusData?: { total?: number; sap?: number; pending?: number; finish?: number };
  equipmentData?: { name: string; values: number[]; total: number }[];
  error?: string;
}

const DEFAULT_YEAR = "2025";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [year, setYear] = useState(DEFAULT_YEAR);
  const [month, setMonth] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const loadDashboard = useCallback((y: string | null, m: string | null, isInitial = false, showLoading = true) => {
    setError("");
    if (showLoading) setIsLoading(true);
    const params = new URLSearchParams();
    if (y) params.append("year", y);
    if (m) params.append("month", m);
    
    fetch(`/api/dashboard?${params.toString()}`, { cache: 'no-store' }).then(async (res) => {
      const d: DashboardData = await res.json();
      if (!res.ok || d.error) throw new Error(d.error || 'โหลดข้อมูลไม่สำเร็จ');
      setData(d);
      if (d.currentYear) setYear(d.currentYear);
      if (d.currentMonth) setMonth(d.currentMonth === 'รวมทุกเดือน' ? 'all' : d.currentMonth);
    }).catch((err: Error) => setError(err.message))
    .finally(() => {
      if (showLoading) setIsLoading(false);
    });
  }, []);

  useEffect(() => { 
    loadDashboard(null, null, true);

    const refreshTimer = window.setInterval(() => {
      loadDashboard(null, null, false, false);
    }, 30000);

    return () => window.clearInterval(refreshTimer);
  }, [loadDashboard]);

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setYear(val);
    try {
      localStorage.setItem('dashboard_year', val);
    } catch (e) {
      console.error('LocalStorage write error:', e);
    }
    loadDashboard(val, month);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setMonth(val);
    try {
      localStorage.setItem('dashboard_month', val);
    } catch (e) {
      console.error('LocalStorage write error:', e);
    }
    loadDashboard(year, val);
  };

  const handleRefresh = () => {
    loadDashboard(null, null);
  };

  const { statusData = {}, equipmentData = [], wGauges = {}, groupStats = {}, w_all = {} } = data || {};

  const statusChartOptions = useMemo(() => ({
    chart: { type: 'pie', height: 440, backgroundColor: 'transparent', options3d: { enabled: true, alpha: 45 } },
    title: { text: '' },
    credits: { enabled: false },
    accessibility: { enabled: false },
    plotOptions: { pie: { size: '78%', innerSize: '52%', depth: 38, dataLabels: { enabled: true, distance: 28, format: '{point.name}: {point.y} ({point.percentage:.0f}%)', style: { color: '#4b5563', fontWeight: 'bold' } } } },
    series: [{ name: 'Status', data: [
        { name: 'SAP', y: statusData?.sap || 0, color: '#86efac' },
        { name: 'Pending', y: statusData?.pending || 0, color: '#fca5a5' },
        { name: 'Finish', y: statusData?.finish || 0, color: '#fde68a' }
    ] }]
  }), [statusData]);

  const equipChartOptions = useMemo(() => ({
    chart: { type: 'column', height: 400, backgroundColor: 'transparent', options3d: { enabled: true, alpha: 10, beta: 20, depth: 50 } },
    title: { text: '' },
    credits: { enabled: false },
    accessibility: { enabled: false },
    xAxis: {
      categories: ['W11', 'W12', 'W13', 'W14'],
      gridLineWidth: 1,
      gridLineColor: '#cbd5e1',
      lineColor: '#94a3b8',
      lineWidth: 1,
    },
    yAxis: {
      title: { text: '' },
      gridLineWidth: 1,
      gridLineColor: '#cbd5e1',
      lineColor: '#94a3b8',
      lineWidth: 1,
    },
    plotOptions: { column: { borderRadius: 4, depth: 25, dataLabels: { enabled: true } } },
    series: (equipmentData).filter((e) => e.name !== 'All').map((e) => ({
        name: e.name, 
        data: e.values, 
        color: (({'BEML': '#93c5fd', 'Conveyor': '#fca5a5', 'สูบน้ำ': '#fcd34d', 'Moblie other': '#6ee7b7', 'Mobile other': '#6ee7b7', 'power plant': '#fdba74', 'General': '#c4b5fd'} as Record<string, string>)[e.name] || '#cbd5e1')
    }))
  }), [equipmentData]);

  const totalWO = statusData?.total || 1;
  const sapPct = Math.round(((statusData?.sap || 0) / totalWO) * 100);
  const pendingPct = Math.round(((statusData?.pending || 0) / totalWO) * 100);
  const finishPct = Math.round(((statusData?.finish || 0) / totalWO) * 100);

  if (error) return (
    <div className="p-10 text-center min-h-screen flex flex-col items-center justify-center bg-[#e2e2e2]">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-8 rounded-3xl shadow-xl border-b-4 border-red-500">
        <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
        <div className="font-black text-slate-800 text-2xl mb-4">{error}</div>
        <button onClick={() => loadDashboard(year, month)} className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-2 mx-auto">
          <RefreshCw size={18} /> ลองใหม่อีกครั้ง
        </button>
      </motion.div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 bg-[#e2e2e2] min-h-screen text-slate-800 font-sans">
      <motion.header 
        className="sticky top-0 z-50 flex flex-col sm:flex-row justify-between items-center mb-4 bg-white/90 backdrop-blur-sm p-4 md:p-6 rounded-2xl md:rounded-3xl border-b-4 border-[#ffd56d] shadow-md shadow-slate-200/70 gap-4"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 15 }}
      >
        <div className="flex items-center gap-4 md:gap-6">
          <div className="flex flex-col">
            <h1 className="text-xl md:text-3xl font-black tracking-tight text-[#4A4A49] uppercase flex items-center gap-2 md:gap-3">
              <Image src="/picture/egat.png" alt="EGAT Logo" width={56} height={56} className="w-10 h-10 md:w-14 md:h-14 object-contain" priority />
              W10 Dashboard
              <Image src="/picture/รูปภาพ14-Photoroom.png" alt="W10 Icon" width={56} height={56} className="w-10 h-10 md:w-14 md:h-14 object-contain" priority />
            </h1>
            <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">EGAT Maintenance Dashboard</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
            <Image src="/picture/saksit-Photoroom.png" alt="Saksit Logo" width={40} height={40} className="h-8 md:h-10 w-auto object-contain mr-2" />
            <AnimatePresence>
              {isLoading && (
                <motion.span 
                  className="flex items-center text-[10px] md:text-xs font-black text-[#d4a300] mr-2 bg-yellow-50 px-2 py-1 rounded-lg uppercase"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  Updating...
                </motion.span>
              )}
            </AnimatePresence>
            <div className="flex gap-1.5 bg-slate-100 p-1 md:p-1.5 rounded-xl md:rounded-2xl border border-slate-200">
              <select className="px-2 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl bg-white text-xs md:text-sm font-black text-[#4A4A49] outline-none shadow-sm cursor-pointer hover:bg-slate-50 transition" value={year} onChange={handleYearChange}>
                <option value="all">รวมทุกปี</option>
                {["2023", "2024", "2025", "2026"].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select className="px-2 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl bg-white text-xs md:text-sm font-black text-[#4A4A49] outline-none shadow-sm cursor-pointer hover:bg-slate-50 transition" value={month} onChange={handleMonthChange}>
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
              className="px-3 md:px-4 py-2 md:py-3 bg-white text-[#4A4A49] rounded-xl md:rounded-2xl text-xs md:text-sm font-black border border-slate-200 shadow-sm flex items-center gap-2 disabled:opacity-60 transition-all"
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
                    className="absolute right-0 top-full z-20 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-300/40"
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  >
                    <Link href="/purchasing" className="flex items-center gap-3 px-4 py-3 text-sm font-black text-[#4A4A49] hover:bg-yellow-50">
                      <ShoppingCart size={18} className="text-[#d4a300]" /> จัดซื้อจัดจ้าง
                    </Link>
                    <Link href="/purchasing-all" className="flex items-center gap-3 border-t border-slate-100 px-4 py-3 text-sm font-black text-[#4A4A49] hover:bg-yellow-50">
                      <ShoppingBag size={18} className="text-[#d4a300]" /> สถานะการซื้อจ้างทั้งหมด
                    </Link>
                    <Link href="/beml-inventory" className="flex items-center gap-3 border-t border-slate-100 px-4 py-3 text-sm font-black text-[#4A4A49] hover:bg-yellow-50/50">
                      <Package size={18} className="text-[#d4a300]" /> คลังอะไหล่ BEML
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
        {isLoading || !data ? (
          <motion.div 
            key="loading"
            className="flex items-center justify-center p-20 text-lg font-black text-slate-400 uppercase tracking-widest animate-pulse"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <RefreshCw size={24} className="animate-spin mr-3 text-[#d4a300]" /> กำลังโหลดข้อมูล...
          </motion.div>
        ) : (
          <motion.div 
            key="content"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Section 1: Operation Status */}
            <motion.div variants={itemVariants} className="bg-[#e8f5ff]/95 border-b-4 border-[#b9dcff] p-4 md:p-8 rounded-[1.5rem] md:rounded-[2rem] shadow-sm shadow-sky-100/60 relative overflow-hidden flex flex-col mb-6 md:mb-8">
                <div className="flex items-center justify-between mb-6 md:mb-8">
                  <h3 className="font-black text-[#4A4A49] uppercase text-xl md:text-3xl tracking-wide flex items-center gap-3">
                    <div className="w-3 h-7 md:h-10 bg-[#ffe08a] rounded-full"></div>
                    <Image src="/picture/Jacko-Photoroom.png" alt="Jacko Logo" width={44} height={44} className="h-8 md:h-11 w-auto object-contain mr-1" />
                    จำนวน W/O เข้าจากระบบ
                    <Image src="/picture/s-sap-erp.png" alt="SAP Logo" width={36} height={36} className="h-6 md:h-9 w-auto ml-1 md:ml-2 object-contain" />
                  </h3>
                  <Info className="text-slate-300 w-4 h-4 md:w-5 h-5 cursor-help" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 items-stretch">
                    {/* Block 1: Chart & Total */}
                    <div className="flex flex-col rounded-2xl p-5 bg-[#5c607f] border-2 border-[#858bb5] shadow-md relative overflow-hidden transition-all hover:shadow-lg h-full">
                      <Activity className="absolute -right-4 -bottom-4 w-32 h-32 text-white/5 pointer-events-none" />
                      <div className="text-[12px] font-black text-[#ffef9a] uppercase tracking-widest mb-1.5 z-10">Total W/O</div>
                      <div className="text-5xl font-black text-white mb-2 z-10">{statusData?.total || 0}</div>
                      <div className="flex-1 flex items-center justify-center min-h-[200px]">
                        <div className="w-full h-full scale-110 origin-center">
                          <HighchartsClient
                            options={{
                              ...statusChartOptions,
                              chart: { ...statusChartOptions.chart, height: 200, margin: [0, 0, 0, 0], spacing: [0, 0, 0, 0] },
                              plotOptions: { 
                                pie: { 
                                  ...statusChartOptions.plotOptions.pie, 
                                  size: '100%',
                                  dataLabels: { enabled: false } 
                                } 
                              }
                            }} 
                          />
                        </div>
                      </div>
                    </div>

                    {/* Block 2: Pending */}
                    <motion.div whileHover={{ y: -5 }} className="flex flex-col rounded-3xl p-6 bg-white border-2 border-rose-100 shadow-sm relative overflow-hidden h-full group">
                      <div className="flex items-center justify-between mb-4 z-10">
                        <div className="text-xl md:text-2xl font-black text-rose-700 uppercase tracking-tighter">Pending</div>
                        <div className="p-2.5 bg-rose-100 rounded-2xl text-rose-600 group-hover:scale-110 transition-transform">
                          <Clock size={32} />
                        </div>
                      </div>
                      <div className="mt-auto z-10">
                        <div className="text-5xl font-black text-slate-800 mb-2">{statusData?.pending || 0}</div>
                        <div className="flex items-center gap-2">
                          <div className="h-2 flex-1 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${pendingPct}%` }} transition={{ duration: 1 }} className="h-full bg-rose-500 rounded-full"></motion.div>
                          </div>
                          <span className="text-[12px] font-black text-rose-600">{pendingPct}%</span>
                        </div>
                      </div>
                    </motion.div>

                    {/* Block 3: Finish */}
                    <motion.div whileHover={{ y: -5 }} className="flex flex-col rounded-3xl p-6 bg-white border-2 border-amber-100 shadow-sm relative overflow-hidden h-full group">
                      <div className="flex items-center justify-between mb-4 z-10">
                        <div className="text-xl md:text-2xl font-black text-amber-700 uppercase tracking-tighter">Finish</div>
                        <div className="p-2.5 bg-amber-100 rounded-2xl text-amber-600 group-hover:scale-110 transition-transform">
                          <AlertCircle size={32} />
                        </div>
                      </div>
                      <div className="mt-auto z-10">
                        <div className="text-5xl font-black text-slate-800 mb-2">{statusData?.finish || 0}</div>
                        <div className="flex items-center gap-2">
                          <div className="h-2 flex-1 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${finishPct}%` }} transition={{ duration: 1 }} className="h-full bg-amber-500 rounded-full"></motion.div>
                          </div>
                          <span className="text-[12px] font-black text-amber-600">{finishPct}%</span>
                        </div>
                      </div>
                    </motion.div>

                    {/* Block 4: SAP */}
                    <motion.div whileHover={{ y: -5 }} className="flex flex-col rounded-3xl p-6 bg-white border-2 border-emerald-100 shadow-sm relative overflow-hidden h-full group">
                      <div className="flex items-center justify-between mb-4 z-10">
                        <div className="text-xl md:text-2xl font-black text-emerald-700 uppercase tracking-tighter">SAP</div>
                        <div className="p-2.5 bg-emerald-100 rounded-2xl text-emerald-600 group-hover:scale-110 transition-transform">
                          <CheckCircle2 size={32} />
                        </div>
                      </div>
                      <div className="mt-auto z-10">
                        <div className="text-5xl font-black text-slate-800 mb-2">{statusData?.sap || 0}</div>
                        <div className="flex items-center gap-2">
                          <div className="h-2 flex-1 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${sapPct}%` }} transition={{ duration: 1 }} className="h-full bg-emerald-500 rounded-full"></motion.div>
                          </div>
                          <span className="text-[12px] font-black text-emerald-600">{sapPct}%</span>
                        </div>
                      </div>
                    </motion.div>
                </div>
            </motion.div>

            {/* Section 2: W Group Blocks */}
            <motion.h3 variants={itemVariants} className="font-black text-[#4A4A49] uppercase text-xl md:text-3xl tracking-wide flex items-center gap-3 mb-6 md:mb-8">
              <div className="w-3 h-7 md:h-10 bg-[#8bff81] rounded-full"></div>
              W/O เข้าตามหมวด
            </motion.h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
              {[
                { id: 'W11', name: 'W11', color: 'yellow' as const, imgSrc: '/picture/chanwit-Photoroom.png' },
                { id: 'W12', name: 'W12', color: 'green' as const, imgSrc: '/picture/saman-Photoroom.png' },
                { id: 'W13', name: 'W13', color: 'pink' as const, imgSrc: '/picture/sitiporn-Photoroom.png' },
                { id: 'W14', name: 'W14', color: 'blue' as const, imgSrc: '/picture/wutisak-Photoroom.png' }
              ].map((w) => (
                <GroupBlock key={w.id} name={w.name} stats={groupStats[w.id]} themeColor={w.color} imgSrc={w.imgSrc} />
              ))}
            </div>

            <motion.div variants={itemVariants} className="bg-[#cdc1ff] p-6 rounded-3xl border border-[#c4b5fd] shadow-sm shadow-purple-100/50 mb-6 md:mb-8 text-center">
                <div className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1">รวม W/O ทั้งหมด</div>
                <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-6xl font-black text-slate-900">{w_all?.entrance || 0}</motion.div>
            </motion.div>

            {/* Section 3: Work by Group */}
            <motion.div variants={itemVariants} className="bg-[#edf3ff]/95 border-b-4 border-[#c7d7ff] p-4 md:p-8 rounded-[1.5rem] md:rounded-[2rem] shadow-sm shadow-sky-100/60 relative overflow-hidden mb-8 md:mb-10">
                <div className="flex items-center justify-between mb-6 md:mb-8">
                  <h3 className="font-black text-[#4A4A49] uppercase text-xl md:text-3xl tracking-wide flex items-center gap-3">
                    <div className="w-3 h-7 md:h-10 bg-[#f9a66c] rounded-full"></div>
                    งานเข้าตามกลุ่มงาน
                  </h3>
                  <Activity className="text-slate-300 w-4 h-4 md:w-5 h-5" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10 items-start">
                    <div className="flex flex-col bg-[#f7f4ff]/90 rounded-2xl p-3 md:p-5 border-2 border-[#b9c4e8] shadow-sm overflow-hidden">
                      <HighchartsClient options={equipChartOptions} />
                    </div>
                    <div className="overflow-hidden rounded-2xl border-2 border-[#b9c4e8] overflow-x-auto">
                        <table className="w-full text-center text-[13px] md:text-[15px] font-black text-slate-500 min-w-[560px] border-collapse border border-slate-200">
                            <thead className="bg-slate-100/80 uppercase">
                                <tr>
                                  <th className="p-3 md:p-5 tracking-normal border border-slate-200">Eqipment</th>
                                  <th className="p-3 md:p-5 tracking-normal border border-slate-200">W11</th>
                                  <th className="p-3 md:p-5 tracking-normal border border-slate-200">W12</th>
                                  <th className="p-3 md:p-5 tracking-normal border border-slate-200">W13</th>
                                  <th className="p-3 md:p-5 tracking-normal border border-slate-200">W14</th>
                                  <th className="p-3 md:p-5 text-[#4A4A49] bg-slate-100/50 border border-slate-200">รวม</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white/50">
                                {(equipmentData as { name: string; values: number[]; total: number }[]).map((e, idx: number) => (
                                    <motion.tr 
                                      key={e.name} 
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      transition={{ delay: idx * 0.05 }}
                                      className={`transition-colors ${e.name === 'All' ? 'bg-yellow-50 font-black' : 'hover:bg-slate-100'}`}
                                    >
                                        <td className={`p-3 md:p-4 text-left font-black border border-slate-200 ${e.name === 'All' ? 'text-amber-700' : 'text-[#4A4A49]'}`}>{e.name === 'All' ? 'รวมทั้งหมด' : e.name}</td>
                                        <td className="p-3 md:p-4 border border-slate-200">{e.values[0]}</td>
                                        <td className="p-3 md:p-4 border border-slate-200">{e.values[1]}</td>
                                        <td className="p-3 md:p-4 border border-slate-200">{e.values[2]}</td>
                                        <td className="p-3 md:p-4 border border-slate-200">{e.values[3]}</td>
                                        <td className={`p-3 md:p-4 font-black border border-slate-200 ${e.name === 'All' ? 'text-amber-700 text-lg md:text-2xl' : 'text-[#4A4A49] bg-slate-100/30'}`}>{e.total}</td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </motion.div>

            <motion.div variants={itemVariants} className="flex items-center justify-between mb-6 md:mb-8">
              <h3 className="font-black text-[#4A4A49] uppercase text-xl md:text-3xl tracking-wide flex items-center gap-3">
                <div className="w-3 h-7 md:h-10 bg-[#22c55e] rounded-full"></div>
                Load Factor / Man
              </h3>
              <Activity className="text-slate-300 w-4 h-4 md:w-5 h-5" />
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
              {[
                  { id: 'W11', color: 'yellow', icon: <Image src="/picture/w11.png" alt="W11" width={48} height={48} className="w-12 h-12 object-contain" /> }, 
                  { id: 'W12', color: 'green', icon: <Image src="/picture/w12.png" alt="W12" width={48} height={48} className="w-12 h-12 object-contain" /> }, 
                  { id: 'W13', color: 'pink', icon: <Image src="/picture/w13.png" alt="W13" width={48} height={48} className="w-12 h-12 object-contain" /> }, 
                  { id: 'W14', color: 'blue', icon: <Image src="/picture/w14.png" alt="W14" width={48} height={48} className="w-12 h-12 object-contain" /> }
              ].map((w) => (
                <motion.div 
                  key={w.id} 
                  variants={itemVariants}
                  whileHover={{ y: -5 }}
                  className="bg-[#fff8e8] rounded-[2rem] p-6 border-b-4 border-[#cde9d8] shadow-sm hover:shadow-md transition-all relative overflow-hidden group"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-1 bg-white rounded-2xl group-hover:scale-110 transition-transform shadow-sm">
                        {w.icon}
                      </div>
                      <div>
                        <h4 className="text-2xl font-black text-slate-800 tracking-wider uppercase">{w.id}</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Maintenance Capacity</p>
                      </div>
                    </div>
                    <div className="text-[8px] font-black text-slate-200 uppercase tracking-widest">Load Analysis</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <ModernGauge value={wGauges[w.id]?.empNorm} label="พนง ปกติ" />
                    <ModernGauge value={wGauges[w.id]?.conNorm} label="ลจ ปกติ" />
                    <ModernGauge value={wGauges[w.id]?.empOT} label="พนง +OT" />
                    <ModernGauge value={wGauges[w.id]?.conOT} label="ลจ +OT" />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
