'use client';

import React, { useEffect, useState } from 'react';
import { Activity, Factory, Zap, Shield, HardHat, Info, LayoutDashboard } from 'lucide-react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const GroupBlock = ({ name, stats, themeColor, isSummary = false }: any) => {
  const colors: any = { 
    yellow: 'bg-amber-50/80 border-amber-200', 
    green: 'bg-emerald-50/80 border-emerald-200', 
    pink: 'bg-rose-50/80 border-rose-200', 
    blue: 'bg-sky-50/80 border-sky-200',
    gray: 'bg-slate-50/80 border-slate-300'
  };
  
  const iconMap: any = {
    'W11': <Factory className="absolute -right-4 -bottom-4 w-32 h-32 text-amber-500/10 pointer-events-none" />,
    'W12': <Zap className="absolute -right-4 -bottom-4 w-32 h-32 text-emerald-500/10 pointer-events-none" />,
    'W13': <Shield className="absolute -right-4 -bottom-4 w-32 h-32 text-rose-500/10 pointer-events-none" />,
    'W14': <HardHat className="absolute -right-4 -bottom-4 w-32 h-32 text-sky-500/10 pointer-events-none" />,
    'W_all': <LayoutDashboard className="absolute -right-4 -bottom-4 w-32 h-32 text-slate-500/10 pointer-events-none" />
  };

  return (
    <div className={`flex flex-col rounded-2xl p-5 ${colors[themeColor]} border-2 shadow-sm relative overflow-hidden transition-all hover:shadow-md h-full`}>
      {iconMap[name]}
      <div className="text-[12px] font-black text-slate-500 uppercase tracking-widest mb-1.5 z-10">{name} {isSummary ? "" : "เข้า"}</div>
      <div className="text-5xl font-black text-slate-900 mb-5 z-10">{stats?.entrance || 0}</div>
      
      {!isSummary && (
        <div className="text-[14px] font-bold text-slate-700 space-y-2.5 bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-white/80 z-10 mt-auto">
          <div className="flex justify-between"><span>ยังไม่เสร็จ</span><span className="text-slate-900">{stats?.left || 0}</span></div>
          <div className="flex justify-between"><span>เสร็จ</span><span className="text-slate-900">{stats?.finish || 0}</span></div>
          <div className="flex justify-between"><span>อื่น</span><span className="text-slate-900">{stats?.otherFinish || 0}</span></div>
          <div className="flex justify-between font-black text-slate-950 pt-2.5 border-t-2 border-slate-200/50"><span>งานออก</span><span className="text-xl">{stats?.out || 0}</span></div>
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

const ModernGauge = ({ value, label, themeColor }: any) => {
  const v = Math.min(Math.max(value || 0, -5), 5);
  const colorMap: any = { yellow: '#FFEE57', green: '#57FF6B', pink: '#FF57E9', blue: '#57A0FF' };
  const color = colorMap[themeColor] || '#3b82f6';
  
  const chartData = v < 0 
    ? [
        { name: 'bg-left', value: 5 + v, color: '#f1f5f9' },
        { name: 'active-left', value: Math.abs(v), color: color },
        { name: 'bg-right', value: 5, color: '#f1f5f9' }
      ]
    : [
        { name: 'bg-left', value: 5, color: '#f1f5f9' },
        { name: 'active-right', value: v, color: color },
        { name: 'bg-right', value: 5 - v, color: '#f1f5f9' }
      ];

  return (
    <div className="flex flex-col items-center p-3 bg-white rounded-2xl border border-slate-100 shadow-sm w-full relative overflow-hidden group hover:border-[#FFD100] transition-all">
       <div className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest z-10">{label}</div>
       <div className="h-20 w-24 z-10">
          <ResponsiveContainer width="100%" height="100%">
             <PieChart>
                <Pie data={chartData} cx="50%" cy="100%" startAngle={180} endAngle={0} innerRadius={20} outerRadius={30} paddingAngle={0} dataKey="value" stroke="none">
                   {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
             </PieChart>
          </ResponsiveContainer>
       </div>
       <div className="text-[15px] font-black text-slate-800 -mt-4 z-10">{value ?? 0}</div>
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
  const [isLoading, setIsLoading] = useState(false);
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
    chart: { type: 'pie', height: 400, backgroundColor: 'transparent', options3d: { enabled: true, alpha: 45 } },
    title: { text: '' },
    plotOptions: { pie: { innerSize: '60%', depth: 35, dataLabels: { enabled: true, format: '{point.name}: {point.percentage:.0f}%', style: { color: '#4A4A49', fontWeight: 'bold' } } } },
    series: [{ name: 'Status', data: [
        { name: 'SAP', y: statusData?.sap || 0, color: '#22c55e' },
        { name: 'Pending', y: statusData?.pending || 0, color: '#ef4444' },
        { name: 'Finish', y: statusData?.finish || 0, color: '#eab308' }
    ] }]
  };

  const equipChartOptions = {
    chart: { type: 'column', height: 250, backgroundColor: 'transparent', options3d: { enabled: true, alpha: 10, beta: 20, depth: 50 } },
    title: { text: '' },
    xAxis: { categories: ['W11', 'W12', 'W13', 'W14'], gridLineWidth: 0 },
    yAxis: { title: { text: '' }, gridLineWidth: 0 },
    plotOptions: { column: { borderRadius: 4, depth: 25, dataLabels: { enabled: true } } },
    series: equipmentData.filter((e: any) => e.name !== 'All').map((e: any) => ({
        name: e.name, 
        data: e.values, 
        color: (({'BEML': '#3b82f6', 'Conveyor': '#ef4444', 'สูบน้ำ': '#f59e0b', 'Moblie other': '#10b981', 'Mobile other': '#10b981', 'power plant': '#f97316', 'General': '#94a3b8'} as any)[e.name] || '#94a3b8')
    }))
  };

  const totalWO = statusData?.total || 1;
  const sapPct = Math.round(((statusData?.sap || 0) / totalWO) * 100);
  const pendingPct = Math.round(((statusData?.pending || 0) / totalWO) * 100);
  const finishPct = Math.round(((statusData?.finish || 0) / totalWO) * 100);

  return (
    <div className="p-8 bg-[#f8f9fa] min-h-screen text-slate-800 font-sans">
      <header className="flex justify-between items-center mb-10 bg-white p-6 rounded-3xl border-b-4 border-[#FFD100] shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <h1 className="text-3xl font-black tracking-tight text-[#4A4A49] uppercase flex items-center gap-3">
              <LayoutDashboard className="text-[#FFD100] w-8 h-8" strokeWidth={3} />
              W10 Dashboard
            </h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">EGAT Maintenance Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
            {isLoading && <span className="flex items-center text-xs font-black text-[#FFD100] animate-pulse mr-2 bg-yellow-50 px-2 py-1 rounded-lg uppercase">Updating...</span>}
            <div className="flex gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
              <select className="px-4 py-2 rounded-xl bg-white text-sm font-black text-[#4A4A49] outline-none shadow-sm cursor-pointer hover:bg-slate-50 transition" value={year} onChange={handleYearChange}>
                {["2023", "2024", "2025", "2026"].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select className="px-4 py-2 rounded-xl bg-white text-sm font-black text-[#4A4A49] outline-none shadow-sm cursor-pointer hover:bg-slate-50 transition" value={month} onChange={handleMonthChange}>
                <option value="all">รวมทุกเดือน</option>
                {THAI_MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <a href="/purchasing" className="px-6 py-3 bg-[#FFD100] text-[#4A4A49] rounded-2xl text-sm font-black hover:bg-[#ffdb33] shadow-lg shadow-yellow-200/50 transition-all active:scale-95 flex items-center gap-2">
              จัดซื้อจัดจ้าง
            </a>
        </div>
      </header>

      {/* W Group Blocks */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          { id: 'W11', name: 'W11', color: 'yellow' },
          { id: 'W12', name: 'W12', color: 'green' },
          { id: 'W13', name: 'W13', color: 'pink' },
          { id: 'W14', name: 'W14', color: 'blue' },
          { id: 'W_all', name: 'W_all', color: 'gray' }
        ].map((w) => (
          <GroupBlock key={w.id} name={w.name} stats={groupStats[w.id]} themeColor={w.color} isSummary={w.id === 'W_all'} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        <div className="bg-white border-b-4 border-slate-200 p-8 rounded-[2rem] shadow-sm relative overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-[#4A4A49] uppercase text-sm tracking-widest flex items-center gap-2">
                <div className="w-2 h-6 bg-[#FFD100] rounded-full"></div>
                สถานะการดำเนินงาน
              </h3>
              <Info className="text-slate-300 w-5 h-5 cursor-help" />
            </div>
            <div className="flex flex-col flex-grow">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center mb-8">
                  <WOBlock statusData={statusData} />
                  <div className="flex justify-center">
                    <HighchartsReact highcharts={Highcharts} options={statusChartOptions} />
                  </div>
                </div>
                <div className="overflow-hidden rounded-2xl border-2 border-slate-50 mt-auto">
                    <table className="w-full text-center text-xs font-black text-slate-500">
                        <thead className="bg-slate-50/80 border-b-2 border-slate-100"><tr><th className="p-4 uppercase tracking-tighter">SAP</th><th className="p-4 uppercase tracking-tighter">Pending</th><th className="p-4 uppercase tracking-tighter">Finish</th><th className="p-4 text-[#4A4A49] tracking-tighter bg-yellow-50/50">รวม (W/O)</th></tr></thead>
                        <tbody className="divide-y divide-slate-50 bg-white"><tr><td className="p-4 text-slate-700 text-lg">{statusData?.sap || 0}</td><td className="p-4 text-slate-700 text-lg">{statusData?.pending || 0}</td><td className="p-4 text-slate-700 text-lg">{statusData?.finish || 0}</td><td className="p-4 font-black text-[#4A4A49] text-3xl bg-yellow-50/30">{statusData?.total || 0}</td></tr></tbody>
                    </table>
                </div>
            </div>
        </div>

        <div className="bg-white border-b-4 border-slate-200 p-8 rounded-[2rem] shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-black text-[#4A4A49] uppercase text-sm tracking-widest flex items-center gap-2">
                <div className="w-2 h-6 bg-[#F37021] rounded-full"></div>
                งานเข้าตามกลุ่มงาน
              </h3>
              <Activity className="text-slate-300 w-5 h-5" />
            </div>
            <div className="flex flex-col gap-6">
                <HighchartsReact highcharts={Highcharts} options={equipChartOptions} />
                <div className="overflow-hidden rounded-2xl border-2 border-slate-50">
                    <table className="w-full text-center text-[11px] font-black text-slate-500">
                        <thead className="bg-slate-50/80 border-b-2 border-slate-100 uppercase">
                            <tr><th className="p-4 tracking-tighter">Eq</th><th className="p-4 tracking-tighter">W11</th><th className="p-4 tracking-tighter">W12</th><th className="p-4 tracking-tighter">W13</th><th className="p-4 tracking-tighter">W14</th><th className="p-4 text-[#4A4A49] bg-slate-100/50">รวม</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 bg-white">
                            {equipmentData.map((e: any) => (
                                <tr key={e.name} className={`transition-colors ${e.name === 'All' ? 'bg-yellow-50/50 font-black' : 'hover:bg-slate-50'}`}>
                                    <td className={`p-3 text-left font-black border-r border-slate-50 ${e.name === 'All' ? 'text-amber-700' : 'text-[#4A4A49]'}`}>{e.name === 'All' ? 'รวมทั้งหมด' : e.name}</td>
                                    <td className="p-3">{e.values[0]}</td><td className="p-3">{e.values[1]}</td><td className="p-3">{e.values[2]}</td><td className="p-3">{e.values[3]}</td>
                                    <td className={`p-3 font-black ${e.name === 'All' ? 'text-amber-700 text-lg' : 'text-[#4A4A49] bg-slate-50/30'}`}>{e.total}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
            { id: 'W11', color: 'yellow' }, { id: 'W12', color: 'green' }, { id: 'W13', color: 'pink' }, { id: 'W14', color: 'blue' }
        ].map((w) => (
          <div key={w.id} className="grid grid-cols-2 gap-4 p-5 bg-white rounded-[2rem] border-b-4 border-slate-200 shadow-sm hover:shadow-md transition-all">
            <ModernGauge value={wGauges[w.id]?.empNorm} label="พนง ปกติ" themeColor={w.color} />
            <ModernGauge value={wGauges[w.id]?.conNorm} label="ลจ ปกติ" themeColor={w.color} />
            <ModernGauge value={wGauges[w.id]?.empOT} label="พนง +OT" themeColor={w.color} />
            <ModernGauge value={wGauges[w.id]?.conOT} label="ลจ +OT" themeColor={w.color} />
          </div>
        ))}
      </div>
    </div>
  );
}
