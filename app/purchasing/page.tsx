'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CalendarDays, ClipboardList, Filter, RefreshCw, Search, ShoppingCart, ShoppingBag, Package, Truck, CreditCard } from 'lucide-react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';

type GaugeData = { empNorm?: number; empOT?: number; w11_1?: number; };
type NameValue = { name: string; value: number; };
type PairRow = { col1: string; col2: string | number; };
type PurchaseRow = { ecm_buy: string; ecm: string; wo: string; item: string; equip: string; date_in: string; date_start: string; date_out: string; status: string; action: string; };
type PurchasingData = { gauges?: GaugeData; chartData?: NameValue[]; summaryTableData?: PairRow[]; secondChartData?: NameValue[]; secondTableData?: PairRow[]; purchaseList?: PurchaseRow[]; currentYear?: string; currentMonth?: string; error?: string; };

const chartColors = ['#FFD100', '#F37021', '#4A4A49', '#16a34a', '#7c3aed', '#db2777', '#0891b2', '#ea580c'];

import ReactSpeedometer from 'react-d3-speedometer';

const ModernGauge = ({ value, label }: { value?: number; label: string }) => {
  const safeValue: number = typeof value === 'number' ? value : 0;
  const clampedValue = Math.min(Math.max(safeValue, -3), 3);
  
  return (
    <div className="flex h-full flex-col items-center bg-white p-3 rounded-2xl border border-slate-200 shadow-sm w-full relative">
      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</div>
      <div className="h-28 w-44">
        <ReactSpeedometer
          value={Number(clampedValue.toFixed(2))}
          minValue={-3}
          maxValue={3}
          segments={3}
          customSegmentStops={[-3, -1, 1, 3]}
          segmentColors={['#FCD34D', '#4ADE80', '#F87171']}
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

const StatCard = ({ label, value, tone = 'slate' }: { label: string; value: string | number; tone?: 'blue' | 'emerald' | 'amber' | 'slate' }) => {
  if (tone === 'emerald' || tone === 'amber') return null;
  
  const toneClasses = { 
    blue: 'bg-amber-50/80 text-slate-900 border-amber-200', 
    emerald: 'bg-emerald-50 text-emerald-900 border-emerald-100', 
    amber: 'bg-amber-50 text-amber-900 border-amber-100', 
    slate: 'bg-white text-slate-900 border-slate-200' 
  };
  
  const iconMap: any = {
    'W11-1': <Truck className="absolute -right-2 -bottom-2 w-20 h-20 text-amber-500/10" />,
    'รายการทั้งหมด': <Package className="absolute -right-2 -bottom-2 w-20 h-20 text-emerald-500/10" />,
    'รายการที่แสดง': <ShoppingBag className="absolute -right-2 -bottom-2 w-20 h-20 text-orange-500/10" />
  };

  return (
    <div className={`rounded-2xl border-2 p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition-all ${toneClasses[tone]}`}>
      {iconMap[label]}
      <div className="whitespace-nowrap text-[11px] font-black uppercase tracking-widest text-slate-500 z-10">{label}</div>
      <div className="mt-2 text-4xl font-black z-10 text-[#4A4A49] group-hover:scale-105 transition-transform">{value}</div>
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

export default function PurchasingPage() {
  const [data, setData] = useState<PurchasingData | null>(null);
  const [year, setYear] = useState("2025");
  const [month, setMonth] = useState("all");
  const [statusFilter, setStatusFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [modulesLoaded, setModulesLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    import('highcharts/highcharts-3d').then(() => setModulesLoaded(true)).catch(() => setModulesLoaded(true));
    let savedYear = null;
    let savedMonth = null;
    try {
      savedYear = localStorage.getItem('dashboard_year');
      savedMonth = localStorage.getItem('dashboard_month');
    } catch (e) {
      console.error('LocalStorage read error:', e);
    }
    if (savedYear) setYear(savedYear);
    if (savedMonth) setMonth(savedMonth);
    loadData(savedYear, savedMonth, true);
  }, []);

  const loadData = (y: string | null, m: string | null, isInitial = false) => {
    setIsLoading(true);
    setError('');
    const params = new URLSearchParams();
    if (y) params.append("year", y);
    if (m) params.append("month", m);
    fetch(`/api/purchasing?${params.toString()}`, { cache: 'no-store' }).then((res) => { if (!res.ok) throw new Error('โหลดข้อมูลจัดซื้อไม่สำเร็จ'); return res.json(); }).then((payload: PurchasingData) => { if (payload.error) throw new Error(payload.error); setData(payload); if (isInitial) { if (payload.currentYear) setYear(payload.currentYear); if (payload.currentMonth) setMonth(payload.currentMonth === 'รวมทุกเดือน' ? 'all' : payload.currentMonth); } }).catch((err: Error) => { setError(err.message); }).finally(() => setIsLoading(false));
  };

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

  const gauges = data?.gauges || {};
  const chartData = data?.chartData || [];
  const summaryTableData = data?.summaryTableData || [];
  const secondChartData = data?.secondChartData || [];
  const secondTableData = data?.secondTableData || [];
  const purchaseList = data?.purchaseList || [];

  const statusOptions = useMemo(() => { const statuses = purchaseList.map((row) => row.status).filter(Boolean); return ['all', ...Array.from(new Set(statuses))]; }, [purchaseList]);
  const primaryChartData = chartData.map((item) => ({ name: item.name || '-', y: item.value || 0 })).filter((item) => item.y > 0);
  const secondaryChartData = secondChartData.map((item, index) => ({ name: item.name || '-', y: item.value || 0, color: chartColors[index % chartColors.length] })).filter((item) => item.name !== '-');
  const hasSecondaryChartData = secondaryChartData.length > 0;
  const filteredRows = useMemo(() => { const normalizedQuery = query.trim().toLowerCase(); return purchaseList.filter((row) => { const matchesStatus = statusFilter === 'all' || row.status === statusFilter; const matchesQuery = !normalizedQuery || Object.values(row).some((value) => value?.toString().toLowerCase().includes(normalizedQuery)); return matchesStatus && matchesQuery; }); }, [purchaseList, query, statusFilter]);
  
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

  const chartOptions = { chart: { type: 'pie', backgroundColor: 'transparent', options3d: { enabled: true, alpha: 45 }, height: 280 }, colors: chartColors, credits: { enabled: false }, title: { text: '' }, plotOptions: { pie: { innerSize: '58%', depth: 38, colorByPoint: true, dataLabels: { enabled: true, format: '{point.name}: {point.percentage:.0f}%', style: { fontWeight: '700', textOutline: 'none', color: '#4A4A49' } } } }, series: [{ name: 'Purchasing', data: primaryChartData }] };
  const equipChartOptions = { chart: { type: 'column', backgroundColor: 'transparent', options3d: { enabled: true, alpha: 8, beta: 12, depth: 45 }, height: 280 }, credits: { enabled: false }, title: { text: '' }, xAxis: { categories: secondaryChartData.map((item) => item.name), lineColor: '#e2e8f0' }, yAxis: { title: { text: '' }, gridLineColor: '#f1f5f9' }, legend: { enabled: false }, plotOptions: { column: { borderRadius: 4, depth: 24, dataLabels: { enabled: true, style: { color: '#4A4A49' } } } }, series: [{ name: 'จำนวน', data: secondaryChartData }] };
  const totalSummary = summaryTableData.reduce((sum, row) => sum + (parseFloat(row.col2?.toString().replace(/[^0-9.-]/g, '')) || 0), 0);

  return (
    <div className="min-h-screen bg-[#e2e2e2] p-6 text-slate-900 lg:p-8 font-sans">
      <header className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between bg-white p-6 rounded-3xl border-b-4 border-[#FFD100] shadow-sm">
        <div>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#4A4A49] text-[#FFD100] shadow-lg">
              <ShoppingCart size={28} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tight text-[#4A4A49]">การจัดซื้อจัดจ้าง</h1>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-0.5">EGAT Procurement Summary</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isLoading && <span className="flex items-center text-xs font-black text-[#FFD100] animate-pulse mr-2 bg-yellow-50 px-2 py-1 rounded-lg uppercase">Updating...</span>}
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
          <a href="/" className="px-4 md:px-6 py-2 md:py-3 bg-[#FFD100] text-[#4A4A49] rounded-xl md:rounded-2xl text-xs md:text-sm font-black hover:bg-[#ffdb33] shadow-lg shadow-yellow-200/50 transition-all active:scale-95 flex items-center gap-2">
            <ArrowLeft size={16} strokeWidth={3} /> กลับหน้าหลัก
          </a>
        </div>
      </header>

      {error ? (
        <div className="rounded-2xl border-2 border-red-100 bg-red-50 p-6 text-base font-black text-red-700 shadow-sm">{error}</div>
      ) : isLoading || !modulesLoaded ? (
        <div className="flex items-center justify-center gap-3 rounded-[2rem] border-2 border-slate-100 bg-white p-20 text-base font-black text-slate-400 shadow-sm animate-pulse uppercase tracking-widest">
          <RefreshCw size={24} className="animate-spin text-[#FFD100]" /> กำลังโหลดข้อมูล...
        </div>
      ) : (
        <>
          <div className="mb-10 grid grid-cols-1 gap-8 xl:grid-cols-[280px_minmax(0,1fr)_minmax(0,1fr)]">
            <section className="grid grid-cols-1 gap-4">
              <StatCard label="W11-1" value={gauges.w11_1 || 0} tone="blue" />
              <div className="grid grid-cols-1 gap-4">
                <ModernGauge value={gauges.empNorm} label="พนักงานปกติ" />
                <ModernGauge value={gauges.empOT} label="ปกติ + OT" />
              </div>
            </section>

            <section className="contents">
              <div className="rounded-[2rem] border-b-4 border-slate-200 bg-white p-8 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                <div className="mb-8 flex items-center justify-between gap-3">
                  <h2 className="font-black text-[#4A4A49] uppercase text-sm tracking-widest flex items-center gap-2">
                    <div className="w-2 h-6 bg-[#FFD100] rounded-full"></div>
                    ปริมาณการซื้อ/จ้างหมวด
                  </h2>
                  <ClipboardList size={20} className="text-slate-300 group-hover:text-[#FFD100] transition-colors" />
                </div>
                <div className="grid grid-cols-1 items-center gap-6">
                  {primaryChartData.length > 0 ? <HighchartsReact highcharts={Highcharts} options={chartOptions} /> : <div className="flex h-[280px] items-center justify-center rounded-2xl bg-slate-50 text-xs font-black text-slate-400 uppercase tracking-widest">No Graph Data</div>}
                  <div className="overflow-hidden rounded-2xl border-2 border-slate-50">
                    <table className="w-full text-center text-xs font-black text-slate-500">
                      <thead className="bg-slate-50/80 text-slate-500 border-b-2 border-slate-100">
                        <tr>{summaryTableData.map((row, index) => <th key={`${row.col1}-${index}`} className="whitespace-nowrap p-4 uppercase tracking-tighter">{row.col1 || '-'}</th>)}</tr>
                      </thead>
                      <tbody>
                        <tr className="bg-white hover:bg-yellow-50/20 transition-colors">
                          {summaryTableData.map((row, index) => <td key={`${row.col2}-${index}`} className="whitespace-nowrap p-4 text-[#4A4A49] text-base font-black border-t border-slate-50">{row.col2 || 0}</td>)}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] border-b-4 border-slate-200 bg-white p-8 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                <div className="mb-8 flex items-center justify-between gap-3">
                  <h2 className="font-black text-[#4A4A49] uppercase text-sm tracking-widest flex items-center gap-2">
                    <div className="w-2 h-6 bg-[#F37021] rounded-full"></div>
                    สถานะการซื้อจ้าง
                  </h2>
                  <CalendarDays size={20} className="text-slate-300 group-hover:text-orange-400 transition-colors" />
                </div>
                {hasSecondaryChartData ? <HighchartsReact highcharts={Highcharts} options={equipChartOptions} /> : <div className="flex h-[280px] items-center justify-center rounded-2xl bg-slate-50 text-xs font-black text-slate-400 uppercase tracking-widest">No Graph Data</div>}
                <div className="mt-6 overflow-hidden rounded-2xl border-2 border-slate-50">
                  <table className="w-full text-center text-xs font-black text-slate-500">
                    <thead className="bg-slate-50/80 text-slate-500 border-b-2 border-slate-100">
                      <tr>{secondTableData.map((row, index) => <th key={`${row.col1}-${index}`} className="whitespace-nowrap p-4 uppercase tracking-tighter">{row.col1 || '-'}</th>)}</tr>
                    </thead>
                    <tbody>
                      <tr className="bg-white hover:bg-orange-50/20 transition-colors">
                        {secondTableData.map((row, index) => <td key={`${row.col2}-${index}`} className="whitespace-nowrap p-4 text-[#4A4A49] text-base font-black border-t border-slate-50">{row.col2 || 0}</td>)}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </div>

          <section className="rounded-[2rem] border-b-4 border-slate-200 bg-white shadow-sm overflow-hidden mb-10 group hover:shadow-md transition-all">
            <div className="flex flex-col gap-4 border-b-2 border-slate-50 p-8 lg:flex-row lg:items-center lg:justify-between bg-slate-50/30">
              <div>
                <h2 className="font-black text-[#4A4A49] uppercase text-sm tracking-widest flex items-center gap-2">
                  <div className="w-2 h-6 bg-[#4A4A49] rounded-full"></div>
                  รายละเอียดรายการจัดซื้อจัดจ้าง
                </h2>
                <p className="mt-1 text-[11px] font-black uppercase text-slate-400 tracking-tighter">Summary Total: <span className="text-[#4A4A49]">{totalSummary}</span></p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative group/search">
                  <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/search:text-[#FFD100] transition-colors" strokeWidth={3} />
                  <input
                    className="h-11 w-full rounded-2xl border-2 border-slate-100 bg-white pl-12 pr-4 text-sm font-bold text-[#4A4A49] outline-none focus:border-[#FFD100] sm:w-80 shadow-sm transition-all"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="SEARCH ECM, W/O, ITEMS..."
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full min-w-[1200px] text-left text-sm border-collapse border border-slate-200">
                  <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <tr>
                      {['ECM ซื้อจ้าง', 'ECM', 'W/O', 'รายการ', 'Equip', 'Date เข้า', 'Date เริ่มงาน', 'Date ออกงาน', 'สถานะ', 'การดำเนินการ'].map((header) => (
                        <th key={header} className="px-6 py-5 font-black border border-slate-200">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="">
                    {filteredRows.length > 0 ? filteredRows.map((row, index) => (
                      <tr key={`${row.ecm_buy}-${row.wo}-${index}`} className="hover:bg-yellow-50/30 transition-colors">
                        <td className="px-6 py-5 font-black text-[#4A4A49] border border-slate-200">{row.ecm_buy || '-'}</td>
                        <td className="px-6 py-5 font-bold text-slate-500 border border-slate-200">{row.ecm || '-'}</td>
                        <td className="px-6 py-5 font-bold text-slate-500 border border-slate-200">{row.wo || '-'}</td>
                        <td className="max-w-[400px] px-6 py-5 font-bold text-[#4A4A49] leading-relaxed border border-slate-200">{row.item || '-'}</td>
                        <td className="px-6 py-5 font-black text-slate-500 border border-slate-200">{row.equip || '-'}</td>
                        <td className="px-6 py-5 font-bold text-slate-500 whitespace-nowrap border border-slate-200">{row.date_in || '-'}</td>
                        <td className="px-6 py-5 font-bold text-slate-500 whitespace-nowrap border border-slate-200">{row.date_start || '-'}</td>
                        <td className="px-6 py-5 font-bold text-slate-500 whitespace-nowrap border border-slate-200">{row.date_out || '-'}</td>
                        <td className="px-6 py-5 border border-slate-200">
                          <span className={`inline-flex rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest shadow-sm ${getStatusStyle(row.status)}`}>{row.status || '-'}</span>
                        </td>
                        <td className="px-6 py-5 font-bold text-slate-500 border border-slate-200">{row.action || '-'}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td className="px-6 py-20 text-center text-xs font-black text-slate-300 uppercase tracking-widest border border-slate-200" colSpan={10}>No data found matching your filters</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
          </section>
        </>
      )}
    </div>
  );
}
