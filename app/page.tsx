'use client';

import React, { useEffect, useState } from 'react';
import { Activity, Factory, Zap, Shield, HardHat, Info, LayoutDashboard } from 'lucide-react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const GroupBlock = ({ name, stats, themeColor, isSummary = false, imgSrc }: any) => {
  const colors: any = { 
    yellow: 'bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200', 
    green: 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200', 
    pink: 'bg-gradient-to-br from-rose-50 to-rose-100/50 border-rose-200', 
    blue: 'bg-gradient-to-br from-sky-50 to-sky-100/50 border-sky-200',
    gray: 'bg-gradient-to-br from-slate-50 to-slate-100/50 border-slate-300'
  };
  
  const iconMap: any = {
    'W11': <Factory className="absolute -right-6 -bottom-6 w-32 h-32 text-amber-500/5 pointer-events-none" />,
    'W12': <Zap className="absolute -right-6 -bottom-6 w-32 h-32 text-emerald-500/5 pointer-events-none" />,
    'W13': <Shield className="absolute -right-6 -bottom-6 w-32 h-32 text-rose-500/5 pointer-events-none" />,
    'W14': <HardHat className="absolute -right-6 -bottom-6 w-32 h-32 text-sky-500/5 pointer-events-none" />,
    'W_all': <LayoutDashboard className="absolute -right-6 -bottom-6 w-32 h-32 text-slate-500/5 pointer-events-none" />
  };

  return (
    <div className={`flex flex-col rounded-3xl p-3.5 sm:p-5 ${colors[themeColor]} border shadow-sm relative overflow-hidden transition-all hover:shadow-lg hover:border-slate-300 h-full`}>
      {iconMap[name]}
      
      <div className="flex items-center gap-1.5 sm:gap-2.5 mb-4 z-10">
        {imgSrc ? (
          <img 
            src={imgSrc} 
            alt={name} 
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-full object-cover border-2 border-white shadow-sm shrink-0"
          />
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
        <div className="text-[11px] sm:text-[13px] font-bold text-slate-600 space-y-1.5 bg-white/50 backdrop-blur p-2.5 sm:p-3 rounded-2xl border border-white/50 z-10 mt-auto">
          <div className="flex justify-between px-1"><span>ยังไม่เสร็จ</span><span className="text-slate-900">{stats?.left || 0}</span></div>
          <div className="flex justify-between px-1"><span>เสร็จ</span><span className="text-slate-900">{stats?.finish || 0}</span></div>
          <div className="flex justify-between px-1"><span>อื่น</span><span className="text-slate-900">{stats?.otherFinish || 0}</span></div>
          <div className="flex justify-between font-black text-slate-950 pt-1.5 mt-1 border-t border-slate-200/50 px-1"><span>งานออก</span><span className="text-lg">{stats?.out || 0}</span></div>
        </div>
      )}
    </div>
  );
};

const WOBlock = ({ statusData }: any) => {
  const total = statusData?.total || 1;
  const sapPct = Math.round(((statusData?.sap || 0) / total) * 100);
  const pendingPct = Math.round(((statusData?.pending || 0) / total) * 100);
  const finishPct = Math.round(((statusData?.finish || 0) / total) * 100);
  return (
    <div className="flex flex-col rounded-2xl p-5 bg-[#4A4A49] border-2 border-[#4A4A49] shadow-md relative overflow-hidden transition-all hover:shadow-lg h-full">
      <Activity className="absolute -right-4 -bottom-4 w-32 h-32 text-white/5 pointer-events-none" />
      <div className="text-[12px] font-black text-[#FFD100] uppercase tracking-widest mb-1.5 z-10">W/O</div>
      <div className="text-5xl font-black text-white mb-5 z-10">{statusData?.total || 0}</div>
      <div className="text-[14px] font-bold space-y-2.5 bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10 z-10 mt-auto">
        <div className="flex justify-between"><span className="text-emerald-300">SAP</span><span className="text-white font-black">{statusData?.sap || 0} <span className="text-emerald-400 text-xs">({sapPct}%)</span></span></div>
        <div className="flex justify-between"><span className="text-red-300">Pending</span><span className="text-white font-black">{statusData?.pending || 0} <span className="text-red-400 text-xs">({pendingPct}%)</span></span></div>
        <div className="flex justify-between pt-2.5 border-t border-white/10"><span className="text-yellow-300">Finish</span><span className="text-white font-black">{statusData?.finish || 0} <span className="text-yellow-400 text-xs">({finishPct}%)</span></span></div>
      </div>
    </div>
  );
};

import ReactSpeedometer from 'react-d3-speedometer';

const ModernGauge = ({ value, label }: any) => {
  const safeValue: number = typeof value === 'number' ? value : 0;
  const clampedValue = Math.min(Math.max(safeValue, -3), 3);
  
  return (
    <div className="flex flex-col items-center bg-white p-3 rounded-2xl border border-slate-200 shadow-sm w-full relative">
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

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [year, setYear] = useState("2025");
  const [month, setMonth] = useState("all");
  const [modulesLoaded, setModulesLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = (y: string | null, m: string | null, isInitial = false) => {
    setError("");
    setIsLoading(true);
    const params = new URLSearchParams();
    if (y) params.append("year", y);
    if (m) params.append("month", m);
    
    fetch(`/api/dashboard?${params.toString()}`, { cache: 'no-store' }).then(async (res) => {
      const d = await res.json();
      if (!res.ok || d.error) throw new Error(d.error || 'โหลดข้อมูลไม่สำเร็จ');
      setData(d);
      if (isInitial) {
        if (d.currentYear) setYear(d.currentYear);
        if (d.currentMonth) setMonth(d.currentMonth === 'รวมทุกเดือน' ? 'all' : d.currentMonth);
      }
    }).catch((err: Error) => setError(err.message))
    .finally(() => setIsLoading(false));
  };

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
    loadDashboard(savedYear, savedMonth, true);
  }, []);

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

  if (error) return (
    <div className="p-10 text-center">
      <div className="font-bold text-red-600 mb-4">{error}</div>
      <button onClick={() => loadDashboard(year, month)} className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold">ลองใหม่</button>
    </div>
  );

  if (!data || !modulesLoaded) return <div className="p-10 text-center font-bold text-slate-500 text-lg">กำลังโหลด...</div>;
  const { wGauges = {}, groupStats = {}, w_all = {}, statusData = {}, equipmentData = [] } = data;

  const statusChartOptions = {
    chart: { type: 'pie', height: 440, backgroundColor: 'transparent', options3d: { enabled: true, alpha: 45 } },
    title: { text: '' },
    credits: { enabled: false },
    accessibility: { enabled: false },
    plotOptions: { pie: { size: '78%', innerSize: '52%', depth: 38, dataLabels: { enabled: true, distance: 28, format: '{point.name}: {point.y} ({point.percentage:.0f}%)', style: { color: '#4A4A49', fontWeight: 'bold' } } } },
    series: [{ name: 'Status', data: [
        { name: 'SAP', y: statusData?.sap || 0, color: '#22c55e' },
        { name: 'Pending', y: statusData?.pending || 0, color: '#ef4444' },
        { name: 'Finish', y: statusData?.finish || 0, color: '#eab308' }
    ] }]
  };

  const equipChartOptions = {
    chart: { type: 'column', height: 400, backgroundColor: 'transparent', options3d: { enabled: true, alpha: 10, beta: 20, depth: 50 } },
    title: { text: '' },
    credits: { enabled: false },
    accessibility: { enabled: false },
    xAxis: { categories: ['W11', 'W12', 'W13', 'W14'], gridLineWidth: 0 },
    yAxis: { title: { text: '' }, gridLineWidth: 0 },
    plotOptions: { column: { borderRadius: 4, depth: 25, dataLabels: { enabled: true } } },
    series: equipmentData.filter((e: any) => e.name !== 'All').map((e: any) => ({
        name: e.name, 
        data: e.values, 
        color: (({'BEML': '#3b82f6', 'Conveyor': '#ef4444', 'สูบน้ำ': '#f59e0b', 'Moblie other': '#10b981', 'Mobile other': '#10b981', 'power plant': '#f97316', 'General': '#8b5cf6'} as any)[e.name] || '#94a3b8')
    }))
  };

  const totalWO = statusData?.total || 1;
  const sapPct = Math.round(((statusData?.sap || 0) / totalWO) * 100);
  const pendingPct = Math.round(((statusData?.pending || 0) / totalWO) * 100);
  const finishPct = Math.round(((statusData?.finish || 0) / totalWO) * 100);

  return (
    <div className="p-4 md:p-8 bg-[#e2e2e2] min-h-screen text-slate-800 font-sans">
      <header className="flex flex-col sm:flex-row justify-between items-center mb-6 md:mb-10 bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl border-b-4 border-[#FFD100] shadow-sm gap-4">
        <div className="flex items-center gap-4 md:gap-6">
          <div className="flex flex-col">
            <h1 className="text-xl md:text-3xl font-black tracking-tight text-[#4A4A49] uppercase flex items-center gap-2 md:gap-3">
              <img src="/picture/egat.png" alt="EGAT Logo" className="w-10 h-10 md:w-14 md:h-14 object-contain" />
              W10 Dashboard
            </h1>
            <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">EGAT Maintenance Dashboard</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
            <img src="/picture/saksit-Photoroom.png" alt="Saksit Logo" className="h-8 md:h-10 object-contain mr-2" />
            {isLoading && <span className="flex items-center text-[10px] md:text-xs font-black text-[#FFD100] animate-pulse mr-2 bg-yellow-50 px-2 py-1 rounded-lg uppercase">Updating...</span>}
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
            <a href="/purchasing" className="px-4 md:px-6 py-2 md:py-3 bg-[#FFD100] text-[#4A4A49] rounded-xl md:rounded-2xl text-xs md:text-sm font-black hover:bg-[#ffdb33] shadow-lg shadow-yellow-200/50 transition-all active:scale-95 flex items-center gap-2">
              จัดซื้อจัดจ้าง
            </a>
        </div>
      </header>

      {/* Section 1: Operation Status */}
      <div className="bg-slate-50/80 border-b-4 border-slate-200 p-4 md:p-8 rounded-[1.5rem] md:rounded-[2rem] shadow-sm relative overflow-hidden flex flex-col mb-6 md:mb-8">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <h3 className="font-black text-[#4A4A49] uppercase text-xs md:text-sm tracking-widest flex items-center gap-2">
              <div className="w-2 h-4 md:h-6 bg-[#FFD100] rounded-full"></div>
              <img src="/picture/Jacko-Photoroom.png" alt="Jacko Logo" className="h-6 md:h-8 object-contain mr-1" />
              จำนวน W/O เข้าจากระบบ SAP
              <img src="/picture/s-sap-erp.png" alt="SAP Logo" className="h-4 md:h-6 ml-1 md:ml-2 object-contain" />
            </h3>
            <Info className="text-slate-300 w-4 h-4 md:w-5 h-5 cursor-help" />
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(240px,0.68fr)_minmax(520px,1.55fr)_minmax(300px,0.9fr)] gap-5 md:gap-6 items-stretch">
              <div className="w-full">
                <WOBlock statusData={statusData} />
              </div>
              <div className="flex justify-center items-center bg-white/30 rounded-2xl p-3 md:p-4 border border-slate-100">
                <div className="w-full max-w-[680px]">
                  <HighchartsReact highcharts={Highcharts} options={statusChartOptions} />
                </div>
              </div>
              <div className="overflow-hidden rounded-2xl border-2 border-slate-100 flex flex-col justify-center">
                  <table className="w-full text-center font-black text-slate-500 border-collapse border border-slate-200">
                      <thead className="bg-slate-100/80">
                        <tr>
                          <th className="p-3 md:p-4 uppercase tracking-tighter text-[10px] md:text-xs border border-slate-200">สถานะ</th>
                          <th className="p-3 md:p-4 uppercase tracking-tighter text-[10px] md:text-xs border border-slate-200">จำนวน</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white/50">
                        <tr>
                          <td className="p-3 md:p-4 text-slate-500 text-left pl-4 md:pl-8 text-xs md:text-base border border-slate-200">SAP</td>
                          <td className="p-3 md:p-4 text-slate-700 text-lg md:text-2xl border border-slate-200">{statusData?.sap || 0}</td>
                        </tr>
                        <tr>
                          <td className="p-3 md:p-4 text-slate-500 text-left pl-4 md:pl-8 text-xs md:text-base border border-slate-200">Pending</td>
                          <td className="p-3 md:p-4 text-slate-700 text-lg md:text-2xl border border-slate-200">{statusData?.pending || 0}</td>
                        </tr>
                        <tr>
                          <td className="p-3 md:p-4 text-slate-500 text-left pl-4 md:pl-8 text-xs md:text-base border border-slate-200">Finish</td>
                          <td className="p-3 md:p-4 text-slate-700 text-lg md:text-2xl border border-slate-200">{statusData?.finish || 0}</td>
                        </tr>
                        <tr className="bg-yellow-50">
                          <td className="p-3 md:p-4 text-[#4A4A49] text-left pl-4 md:pl-8 border border-slate-200 text-xs md:text-base font-bold">รวม (W/O)</td>
                          <td className="p-3 md:p-4 font-black text-[#4A4A49] text-2xl md:text-4xl border border-slate-200">{statusData?.total || 0}</td>
                        </tr>
                      </tbody>
                  </table>
              </div>
          </div>
      </div>

      {/* Section 2: W Group Blocks */}
      <h3 className="font-black text-[#4A4A49] uppercase text-xs md:text-sm tracking-widest flex items-center gap-2 mb-6 md:mb-8">
        <div className="w-2 h-4 md:h-6 bg-[#8bff81] rounded-full"></div>
        W/O เข้าตามหมวด
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        {[
          { id: 'W11', name: 'W11', color: 'yellow', imgSrc: '/picture/chanwit-Photoroom.png' },
          { id: 'W12', name: 'W12', color: 'green', imgSrc: '/picture/saman-Photoroom.png' }, // <- ใส่รูปเองได้ตรงนี้ เช่น '/picture/Jacko-Photoroom.png'
          { id: 'W13', name: 'W13', color: 'pink', imgSrc: '/picture/sitiporn-Photoroom.png' },  // <- ใส่รูปเองได้ตรงนี้
          { id: 'W14', name: 'W14', color: 'blue', imgSrc: '/picture/wutisak-Photoroom.png' }   // <- ใส่รูปเองได้ตรงนี้
        ].map((w) => (
          <GroupBlock key={w.id} name={w.name} stats={groupStats[w.id]} themeColor={w.color} imgSrc={w.imgSrc} />
        ))}
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm mb-6 md:mb-8 text-center">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">รวม W/O ทั้งหมด</div>
          <div className="text-6xl font-black text-slate-900">{w_all?.entrance || 0}</div>
      </div>

      {/* Section 3: Work by Group */}
      <div className="bg-slate-50/80 border-b-4 border-slate-200 p-4 md:p-8 rounded-[1.5rem] md:rounded-[2rem] shadow-sm relative overflow-hidden mb-8 md:mb-10">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <h3 className="font-black text-[#4A4A49] uppercase text-xs md:text-sm tracking-widest flex items-center gap-2">
              <div className="w-2 h-4 md:h-6 bg-[#F37021] rounded-full"></div>
              งานเข้าตามกลุ่มงาน
            </h3>
            <Activity className="text-slate-300 w-4 h-4 md:w-5 h-5" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10 items-start">
              <div className="flex flex-col bg-white/30 rounded-2xl p-2 md:p-4 border border-slate-100 overflow-hidden">
                <HighchartsReact highcharts={Highcharts} options={equipChartOptions} />
              </div>
              <div className="overflow-hidden rounded-2xl border-2 border-slate-100 overflow-x-auto">
                  <table className="w-full text-center text-[10px] md:text-[11px] font-black text-slate-500 min-w-[500px] border-collapse border border-slate-200">
                      <thead className="bg-slate-100/80 uppercase">
                          <tr>
                            <th className="p-3 md:p-4 tracking-tighter border border-slate-200">Eq</th>
                            <th className="p-3 md:p-4 tracking-tighter border border-slate-200">W11</th>
                            <th className="p-3 md:p-4 tracking-tighter border border-slate-200">W12</th>
                            <th className="p-3 md:p-4 tracking-tighter border border-slate-200">W13</th>
                            <th className="p-3 md:p-4 tracking-tighter text-[9px] md:text-xs border border-slate-200">W14</th>
                            <th className="p-3 md:p-4 text-[#4A4A49] bg-slate-200/50 border border-slate-200">รวม</th>
                          </tr>
                      </thead>
                      <tbody className="bg-white/50">
                          {equipmentData.map((e: any) => (
                              <tr key={e.name} className={`transition-colors ${e.name === 'All' ? 'bg-yellow-50 font-black' : 'hover:bg-slate-100'}`}>
                                  <td className={`p-2 md:p-3 text-left font-black border border-slate-200 ${e.name === 'All' ? 'text-amber-700' : 'text-[#4A4A49]'}`}>{e.name === 'All' ? 'รวมทั้งหมด' : e.name}</td>
                                  <td className="p-2 md:p-3 border border-slate-200">{e.values[0]}</td>
                                  <td className="p-2 md:p-3 border border-slate-200">{e.values[1]}</td>
                                  <td className="p-2 md:p-3 border border-slate-200">{e.values[2]}</td>
                                  <td className="p-2 md:p-3 border border-slate-200">{e.values[3]}</td>
                                  <td className={`p-2 md:p-3 font-black border border-slate-200 ${e.name === 'All' ? 'text-amber-700 text-sm md:text-lg' : 'text-[#4A4A49] bg-slate-100/30'}`}>{e.total}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      </div>

      <div className="flex items-center justify-between mb-6 md:mb-8">
        <h3 className="font-black text-[#4A4A49] uppercase text-xs md:text-sm tracking-widest flex items-center gap-2">
          <div className="w-2 h-4 md:h-6 bg-[#22c55e] rounded-full"></div>
          Load Factor / Man
        </h3>
        <Activity className="text-slate-300 w-4 h-4 md:w-5 h-5" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
        {[
            { id: 'W11', color: 'yellow', icon: <Factory className="w-6 h-6 text-amber-500" /> }, 
            { id: 'W12', color: 'green', icon: <Zap className="w-6 h-6 text-emerald-500" /> }, 
            { id: 'W13', color: 'pink', icon: <Shield className="w-6 h-6 text-rose-500" /> }, 
            { id: 'W14', color: 'blue', icon: <HardHat className="w-6 h-6 text-sky-500" /> }
        ].map((w) => (
          <div key={w.id} className="bg-white rounded-[2rem] p-6 border-b-4 border-slate-200 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-slate-50 rounded-2xl group-hover:scale-110 transition-transform">
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
          </div>
        ))}
      </div>
    </div>
  );
}
