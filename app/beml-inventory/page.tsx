'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, Search, Package, AlertCircle, CheckCircle2, Info, ChevronDown, Boxes, X, LayoutGrid, FileSpreadsheet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import NavigationMenu from '@/components/navigation/NavigationMenu';

interface InventoryItem {
  code: string;
  pn: string;
  name: string;
  system: string;
  balance: number;
  min: number;
  max: number;
  action: string;
  status: 'Normal' | 'Low' | 'Out';
}

interface ApiResponse {
  status: string;
  data: InventoryItem[];
  systems: string[];
  isDemo: boolean;
  warning?: string;
}

export default function ShopOrderPage() {
  const [data, setData] = useState<InventoryItem[]>([]);
  const [systems, setSystems] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSystem, setSelectedSystem] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'Normal' | 'Low' | 'Out' | null>(null);

  // Tab navigation state: 'dashboard' | 'inventory' | 'low-stock' | 'out-stock'
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'inventory' | 'low-stock' | 'out-stock'>('dashboard');

  // Sorting state
  const [sortField, setSortField] = useState<keyof InventoryItem | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Popover state
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // Load Inventory Data
  const loadData = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/beml-inventory', { cache: 'no-store' });
      if (!res.ok) throw new Error('ไม่สามารถเชื่อมต่อกับ API ได้');
      const json: ApiResponse = await res.json();
      if (json.status === 'error') throw new Error(json.status);

      setData(json.data);
      setSystems(json.systems);
      setIsDemo(json.isDemo);
      setWarning(json.warning || null);
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Auto refresh every 30 seconds
    const interval = setInterval(() => {
      loadData(false);
    }, 30000);

    // Keyboard escape listener for modal
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedItem(null);
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [loadData]);

  // Handle Sort Toggle
  const handleSort = (field: keyof InventoryItem) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Base filtered data: search + system dropdown
  const baseFilteredData = useMemo(() => {
    return data.filter(item => {
      const matchSearch =
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.pn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchSystem = selectedSystem === 'ALL' || item.system === selectedSystem;
      return matchSearch && matchSystem;
    });
  }, [data, searchTerm, selectedSystem]);

  // Final filtered data: base filtered + active status card filter
  const finalData = useMemo(() => {
    let result = [...baseFilteredData];
    if (statusFilter) {
      result = result.filter(item => item.status === statusFilter);
    }

    // Apply sorting
    if (sortField) {
      const dir = sortDirection === 'asc' ? 1 : -1;
      result.sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];

        if (typeof valA === 'number' && typeof valB === 'number') {
          return (valA - valB) * dir;
        }
        return valA.toString().localeCompare(valB.toString(), 'th') * dir;
      });
    }

    return result;
  }, [baseFilteredData, statusFilter, sortField, sortDirection]);

  // Statistics calculated from base filtered data (so cards show correct counts based on search/system filter)
  const stats = useMemo(() => {
    const total = baseFilteredData.length;
    const normal = baseFilteredData.filter(item => item.status === 'Normal').length;
    const low = baseFilteredData.filter(item => item.status === 'Low').length;
    const out = baseFilteredData.filter(item => item.status === 'Out').length;

    const pct = (val: number) => (total > 0 ? Math.round((val / total) * 100) : 0);

    return {
      total,
      normal,
      low,
      out,
      normalPct: pct(normal),
      lowPct: pct(low),
      outPct: pct(out),
    };
  }, [baseFilteredData]);

  // SVG Health Ring Arc Math
  const circumference = 2 * Math.PI * 52; // r = 52, circumference ~ 326.7
  const healthSegments = useMemo(() => {
    const total = stats.total;
    if (total === 0) {
      return { normalLength: 0, lowLength: 0, outLength: 0, normalOffset: 0, lowOffset: 0, outOffset: 0 };
    }
    const normalLen = (stats.normal / total) * circumference;
    const lowLen = (stats.low / total) * circumference;
    const outLen = (stats.out / total) * circumference;

    return {
      normalLength: normalLen,
      lowLength: lowLen,
      outLength: outLen,
      normalOffset: 0,
      lowOffset: -normalLen,
      outOffset: -(normalLen + lowLen),
    };
  }, [stats, circumference]);

  const toggleStatusFilter = (status: 'Normal' | 'Low' | 'Out') => {
    if (statusFilter === status) {
      setStatusFilter(null);
    } else {
      setStatusFilter(status);
    }
  };

  const getStatusText = (status: 'Normal' | 'Low' | 'Out') => {
    if (status === 'Normal') return 'ปกติ';
    if (status === 'Low') return 'ใกล้หมด';
    return 'หมด';
  };

  return (
    <div className="p-4 md:p-8 bg-[#e2e2e2] min-h-screen text-slate-800 font-sans">
      {/* Header Section */}
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
              คลังอะไหล่ BEML
              <Package className="w-8 h-8 md:w-10 h-10 text-[#d4a300]" />
            </h1>
            <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">BEML Inventory - PrintCheck Dashboard</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {isDemo && (
            <span className="flex items-center text-[10px] md:text-xs font-black text-[#d4a300] bg-yellow-50 px-2 py-1 rounded-lg uppercase border border-[#ffe08a]">
              Demo Mode
            </span>
          )}

          <AnimatePresence>
            {isLoading && (
              <motion.span
                className="flex items-center text-[10px] md:text-xs font-black text-[#d4a300] bg-yellow-50 px-2 py-1 rounded-lg uppercase"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                Updating...
              </motion.span>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => loadData()}
            disabled={isLoading}
            className="px-3 md:px-4 py-2 md:py-3 bg-white text-[#4A4A49] rounded-xl md:rounded-2xl text-xs md:text-sm font-black border border-slate-200 shadow-sm flex items-center gap-2 disabled:opacity-60 transition-all"
          >
            <RefreshCw size={16} strokeWidth={3} className={isLoading ? 'animate-spin text-[#d4a300]' : 'text-slate-500'} />
            รีเฟรชข้อมูล
          </motion.button>

          {/* Navigation Dropdown Menu */}
          <NavigationMenu
            buttonClassName="bg-[#ffe08a] text-[#4A4A49] hover:bg-[#ffd56a]"
            accentClassName="text-[#d4a300]"
          />
        </div>
      </motion.header>

      {/* Warning Alert */}
      {warning && (
        <div className="mb-4 bg-amber-50 border border-[#ffe08a] rounded-2xl p-4 flex gap-3 text-amber-800 text-sm font-bold shadow-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-500" />
          <span>{warning}</span>
        </div>
      )}

      {/* Search and System Filters panel */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col xl:flex-row gap-4 justify-between items-center mb-6">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 w-full xl:w-auto overflow-x-auto scrollbar-none pb-1 xl:pb-0">
          <button
            onClick={() => { setCurrentTab('dashboard'); setStatusFilter(null); }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap ${currentTab === 'dashboard'
              ? 'bg-[#ffe08a] text-[#4A4A49] shadow-sm'
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200/80'
              }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> แดชบอร์ด
          </button>
          <button
            onClick={() => { setCurrentTab('inventory'); setStatusFilter(null); }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap ${currentTab === 'inventory' && statusFilter === null
              ? 'bg-[#ffe08a] text-[#4A4A49] shadow-sm'
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200/80'
              }`}
          >
            <Package className="w-3.5 h-3.5" /> คลังอะไหล่
          </button>
          <button
            onClick={() => { setCurrentTab('low-stock'); setStatusFilter('Low'); }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap ${currentTab === 'low-stock'
              ? 'bg-amber-100 text-amber-800 border border-amber-200 shadow-sm'
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200/80'
              }`}
          >
            <AlertCircle className="w-3.5 h-3.5" /> ของใกล้หมด
          </button>
          <button
            onClick={() => { setCurrentTab('out-stock'); setStatusFilter('Out'); }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap ${currentTab === 'out-stock'
              ? 'bg-rose-100 text-rose-800 border border-rose-200 shadow-sm'
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200/80'
              }`}
          >
            <X className="w-3.5 h-3.5" /> ของหมด
          </button>
          <a
            href="https://docs.google.com/spreadsheets/d/1BPCzp167Dno6ekJ7nhJds4o_N8xu3Z6kJDqxYb0Ptzc/edit"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl text-xs font-black bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 transition-all flex items-center gap-1.5 whitespace-nowrap"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> เปิดชีท ↗
          </a>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto xl:flex-1 justify-end max-w-2xl">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4.5 h-4.5" />
            <input
              type="text"
              placeholder="ค้นหารหัสอะไหล่, P/N, หรือชื่ออะไหล่..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (e.target.value.trim() !== '' && currentTab === 'dashboard') {
                  setCurrentTab('inventory');
                }
              }}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl outline-none focus:border-[#d4a300] focus:ring-1 focus:ring-[#ffd56d] text-sm transition-all"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {/* System Dropdown */}
          <div className="relative min-w-[200px]">
            <select
              value={selectedSystem}
              onChange={(e) => setSelectedSystem(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-[#d4a300] text-sm appearance-none cursor-pointer pr-10"
            >
              <option value="ALL">ทุกระบบ (All Systems)</option>
              {systems.map(sys => (
                <option key={sys} value={sys}>{sys}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
          </div>
        </div>
      </div>

      {error ? (
        <div className="p-10 text-center min-h-[300px] flex flex-col items-center justify-center bg-white rounded-3xl border-b-4 border-red-500 shadow-md">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <div className="font-black text-slate-800 text-xl mb-4">{error}</div>
          <button onClick={() => loadData()} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-black hover:bg-slate-800 transition-all">
            ลองใหม่อีกครั้ง
          </button>
        </div>
      ) : (
        <>
          {/* Dashboard view */}
          {currentTab === 'dashboard' && (
            <>
              {/* Header Title */}
              <div className="mb-4">
                <h2 className="text-xl md:text-2xl font-black text-[#4A4A49] tracking-tight">แดชบอร์ด</h2>
                <p className="text-xs text-slate-400 font-bold uppercase mt-1">ภาพรวมคลังอะไหล่ BEML Inventory - อัปเดตล่าสุด</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
                {/* Left Column: Interactive Bin Map Grid (takes 3 cols) */}
                <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm self-start">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                        แผนผังคลังอะไหล่ (Bin Map)
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">แต่ละช่อง = 1 รายการอะไหล่ · คลิกเพื่อดูรายละเอียด</p>
                    </div>
                    <div className="flex gap-4 text-xs font-semibold text-slate-500">
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500"></span>ปกติ</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-500"></span>ใกล้หมด</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-rose-500"></span>หมด</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-12 gap-2">
                    {finalData.map((item, idx) => {
                      let colorClass = 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100 text-emerald-800';
                      if (item.status === 'Out') {
                        colorClass = 'bg-rose-50 border-rose-200 hover:bg-rose-100 text-rose-800';
                      } else if (item.status === 'Low') {
                        colorClass = 'bg-amber-50 border-amber-200 hover:bg-amber-100 text-amber-800';
                      }

                      return (
                        <motion.div
                          key={item.code + '-' + idx}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: Math.min(idx * 0.005, 0.5) }}
                          onClick={() => setSelectedItem(item)}
                          className={`border text-[11px] font-bold p-2 rounded-lg text-center cursor-pointer transition-all active:scale-95 flex flex-col justify-center items-center shadow-2xs select-none ${colorClass}`}
                          title={`${item.name} — คงเหลือ: ${item.balance}/${item.min}`}
                        >
                          <span className="truncate w-full max-w-[80px] text-center">{item.code}</span>
                          <span className="text-[8px] opacity-75 font-normal truncate w-full">{item.system}</span>
                        </motion.div>
                      );
                    })}
                  </div>

                  {finalData.length === 0 && (
                    <div className="text-center py-10 text-slate-400 text-sm">
                      ไม่พบรายการอะไหล่ตามการค้นหาหรือสถานะที่เลือก
                    </div>
                  )}
                </div>

                {/* Right Column: Stats & Health Ring Sidebar (takes 1 col) */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                  {/* Stats cards vertical stack */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Total Stocked items */}
                    <div
                      onClick={() => setStatusFilter(null)}
                      className={`bg-white border rounded-2xl p-4 flex flex-col justify-between cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md ${statusFilter === null ? 'border-[#6366f1] ring-2 ring-[#e0e7ff] shadow-sm' : 'border-slate-200'
                        }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{stats.total}</span>
                        <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-500"><Boxes className="w-4 h-4" /></div>
                      </div>
                      <div className="mt-2">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">ทั้งหมด</h3>
                        <div className="w-full bg-slate-100 h-1 rounded-full mt-2 overflow-hidden">
                          <div className="bg-indigo-500 h-full rounded-full" style={{ width: '100%' }}></div>
                        </div>
                        <p className="text-[9px] text-slate-400 mt-1">รวมทุกรายการในระบบ</p>
                      </div>
                    </div>

                    {/* Normal status items */}
                    <div
                      onClick={() => toggleStatusFilter('Normal')}
                      className={`bg-white border rounded-2xl p-4 flex flex-col justify-between cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md ${statusFilter === 'Normal' ? 'border-emerald-500 ring-2 ring-[#d1fae5] shadow-sm' : 'border-slate-200'
                        }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-3xl font-extrabold text-emerald-600 tracking-tight">{stats.normal}</span>
                        <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-500"><CheckCircle2 className="w-4 h-4" /></div>
                      </div>
                      <div className="mt-2">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">ปกติ</h3>
                        <div className="w-full bg-slate-100 h-1 rounded-full mt-2 overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${stats.normalPct}%` }}></div>
                        </div>
                        <p className="text-[9px] text-slate-400 mt-1">คิดเป็น {stats.normalPct}% ของทั้งหมด</p>
                      </div>
                    </div>

                    {/* Low stock items */}
                    <div
                      onClick={() => toggleStatusFilter('Low')}
                      className={`bg-white border rounded-2xl p-4 flex flex-col justify-between cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md ${statusFilter === 'Low' ? 'border-amber-500 ring-2 ring-[#fef3c7] shadow-sm' : 'border-slate-200'
                        }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-3xl font-extrabold text-amber-600 tracking-tight">{stats.low}</span>
                        <div className="p-1.5 bg-amber-50 rounded-lg text-amber-500"><AlertCircle className="w-4 h-4" /></div>
                      </div>
                      <div className="mt-2">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">ใกล้หมด</h3>
                        <div className="w-full bg-slate-100 h-1 rounded-full mt-2 overflow-hidden">
                          <div className="bg-amber-500 h-full rounded-full" style={{ width: `${stats.lowPct}%` }}></div>
                        </div>
                        <p className="text-[9px] text-slate-400 mt-1">คิดเป็น {stats.lowPct}% ของทั้งหมด</p>
                      </div>
                    </div>

                    {/* Out of stock items */}
                    <div
                      onClick={() => toggleStatusFilter('Out')}
                      className={`bg-white border rounded-2xl p-4 flex flex-col justify-between cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md ${statusFilter === 'Out' ? 'border-rose-500 ring-2 ring-[#ffe4e6] shadow-sm' : 'border-slate-200'
                        }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-3xl font-extrabold text-rose-600 tracking-tight">{stats.out}</span>
                        <div className="p-1.5 bg-rose-50 rounded-lg text-rose-500"><X className="w-4 h-4" /></div>
                      </div>
                      <div className="mt-2">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">หมด</h3>
                        <div className="w-full bg-slate-100 h-1 rounded-full mt-2 overflow-hidden">
                          <div className="bg-rose-500 h-full rounded-full" style={{ width: `${stats.outPct}%` }}></div>
                        </div>
                        <p className="text-[9px] text-slate-400 mt-1">คิดเป็น {stats.outPct}% ของทั้งหมด</p>
                      </div>
                    </div>
                  </div>

                  {/* Health Ring Card */}
                  <div className="bg-[#0c0f1d] text-white rounded-2xl p-5 flex flex-col justify-between border border-slate-800 shadow-md min-h-[240px]">
                    <div>
                      <h3 className="text-sm font-bold text-slate-100">สถานะอะไหล่</h3>
                      <p className="text-xs text-slate-400 mt-1">สัดส่วนรายการปกติ - ใกล้ - หมด</p>
                    </div>

                    <div className="flex flex-col items-center justify-center gap-4 my-3">
                      {/* SVG Ring */}
                      <div className="relative w-28 h-28 shrink-0 group">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                          {/* Ring background */}
                          <circle cx="60" cy="60" r="52" fill="transparent" stroke="#1f293d" strokeWidth="10" />

                          {/* Normal segment */}
                          <circle
                            cx="60"
                            cy="60"
                            r="52"
                            fill="transparent"
                            stroke="#10b981"
                            strokeWidth="10"
                            strokeDasharray={`${healthSegments.normalLength} ${circumference}`}
                            strokeDashoffset={healthSegments.normalOffset}
                            className="transition-all duration-1000 ease-out"
                          />

                          {/* Low segment */}
                          <circle
                            cx="60"
                            cy="60"
                            r="52"
                            fill="transparent"
                            stroke="#f59e0b"
                            strokeWidth="10"
                            strokeDasharray={`${healthSegments.lowLength} ${circumference}`}
                            strokeDashoffset={healthSegments.lowOffset}
                            className="transition-all duration-1000 ease-out"
                          />

                          {/* Out segment */}
                          <circle
                            cx="60"
                            cy="60"
                            r="52"
                            fill="transparent"
                            stroke="#f43f5e"
                            strokeWidth="10"
                            strokeDasharray={`${healthSegments.outLength} ${circumference}`}
                            strokeDashoffset={healthSegments.outOffset}
                            className="transition-all duration-1000 ease-out"
                          />
                        </svg>

                        {/* Center Text */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-lg font-black leading-none">{stats.normalPct}%</span>
                          <span className="text-[9px] text-slate-400 mt-1">ปกติ</span>
                        </div>

                        {/* Tooltip on hover */}
                        <div className="absolute z-10 top-full left-1/2 -translate-x-1/2 mt-2 w-32 bg-slate-900 border border-slate-700 text-xs rounded-xl p-2.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl">
                          <p className="font-bold border-b border-slate-700 pb-1 mb-1.5 text-center">แยกตามสถานะ</p>
                          <div className="flex items-center justify-between text-slate-300">
                            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>ปกติ</span>
                            <strong>{stats.normal}</strong>
                          </div>
                          <div className="flex items-center justify-between text-slate-300 mt-1">
                            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500"></span>ใกล้หมด</span>
                            <strong>{stats.low}</strong>
                          </div>
                          <div className="flex items-center justify-between text-slate-300 mt-1">
                            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500"></span>หมด</span>
                            <strong>{stats.out}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="text-xs text-slate-400 w-full space-y-1.5 border-t border-slate-800 pt-3">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-emerald-500 shrink-0"></span>ปกติ</span>
                          <span className="text-slate-200"><strong>{stats.normal}</strong> รายการ</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-amber-500 shrink-0"></span>ใกล้หมด</span>
                          <span className="text-slate-200"><strong>{stats.low}</strong> รายการ</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-rose-500 shrink-0"></span>หมด</span>
                          <span className="text-slate-200"><strong>{stats.out}</strong> รายการ</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-center text-[10px] text-slate-400 pt-2 border-t border-slate-800">
                      {stats.normal} จาก {stats.total} รายการ อยู่ในเกณฑ์ปกติ
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Data Table / Cards Section */}
          {currentTab !== 'dashboard' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">ตารางอะไหล่ทั้งหมด</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    พบข้อมูล: <strong className="text-slate-800">{finalData.length}</strong> รายการ
                    {statusFilter && ` (เฉพาะกลุ่มสถานะ: ${getStatusText(statusFilter)})`}
                  </p>
                </div>
                {statusFilter && (
                  <button
                    onClick={() => setStatusFilter(null)}
                    className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition-all"
                  >
                    ล้างตัวกรอง {getStatusText(statusFilter)} <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold bg-slate-50/50">
                      <th onClick={() => handleSort('code')} className="p-3 cursor-pointer select-none hover:text-[#d4a300] transition-colors">
                        รหัส/Code {sortField === 'code' && (sortDirection === 'asc' ? '▲' : '▼')}
                      </th>
                      <th onClick={() => handleSort('pn')} className="p-3 cursor-pointer select-none hover:text-[#d4a300] transition-colors">
                        P/N {sortField === 'pn' && (sortDirection === 'asc' ? '▲' : '▼')}
                      </th>
                      <th onClick={() => handleSort('name')} className="p-3 cursor-pointer select-none hover:text-[#d4a300] transition-colors">
                        รายการอะไหล่ {sortField === 'name' && (sortDirection === 'asc' ? '▲' : '▼')}
                      </th>
                      <th onClick={() => handleSort('system')} className="p-3 cursor-pointer select-none hover:text-[#d4a300] transition-colors">
                        ระบบ {sortField === 'system' && (sortDirection === 'asc' ? '▲' : '▼')}
                      </th>
                      <th onClick={() => handleSort('balance')} className="p-3 cursor-pointer select-none hover:text-[#d4a300] transition-colors text-right">
                        คงเหลือ {sortField === 'balance' && (sortDirection === 'asc' ? '▲' : '▼')}
                      </th>
                      <th onClick={() => handleSort('min')} className="p-3 cursor-pointer select-none hover:text-[#d4a300] transition-colors text-right">
                        MIN {sortField === 'min' && (sortDirection === 'asc' ? '▲' : '▼')}
                      </th>
                      <th className="p-3 text-center">การดำเนินการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {finalData.map((item, idx) => {
                      const isLow = item.status === 'Low';
                      const isOut = item.status === 'Out';

                      let rowBg = 'hover:bg-slate-50/70';
                      let balanceColor = 'text-slate-800';

                      if (isOut) {
                        rowBg = 'bg-rose-50/20 hover:bg-rose-50/40';
                        balanceColor = 'text-rose-600 font-extrabold';
                      } else if (isLow) {
                        rowBg = 'bg-amber-50/20 hover:bg-amber-50/40';
                        balanceColor = 'text-amber-600 font-bold';
                      }

                      return (
                        <tr
                          key={item.code + '-' + idx}
                          onClick={() => setSelectedItem(item)}
                          className={`cursor-pointer transition-colors ${rowBg}`}
                        >
                          <td className="p-3 font-semibold text-[#4A4A49]">{item.code}</td>
                          <td className="p-3 text-slate-500 font-mono text-xs">{item.pn}</td>
                          <td className="p-3 text-slate-700 font-medium max-w-[280px] truncate">{item.name}</td>
                          <td className="p-3">
                            <span className="inline-block text-[11px] bg-slate-100 text-slate-600 font-bold px-2.5 py-0.5 rounded-full border border-slate-200">
                              {item.system}
                            </span>
                          </td>
                          <td className={`p-3 text-right ${balanceColor}`}>{item.balance.toLocaleString()}</td>
                          <td className="p-3 text-right text-slate-500 font-medium">{item.min.toLocaleString()}</td>
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-2 text-xs font-bold">
                              {/* Status badge */}
                              {isOut ? (
                                <span className="flex items-center gap-1 bg-rose-100 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-lg">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span> หมด
                                </span>
                              ) : isLow ? (
                                <span className="flex items-center gap-1 bg-amber-100 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-lg">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> ใกล้หมด
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-lg">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> ปกติ
                                </span>
                              )}

                              {/* Action badge */}
                              {item.action && item.action !== '-' ? (
                                <span className="bg-[#5c607f] text-white px-2 py-0.5 rounded-md text-[10px]">
                                  {item.action}
                                </span>
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards View */}
              <div className="md:hidden flex flex-col gap-3">
                {finalData.map((item, idx) => {
                  const isLow = item.status === 'Low';
                  const isOut = item.status === 'Out';

                  let cardBorder = 'border-slate-200';
                  let balanceColor = 'text-slate-800';
                  let statusBadge = (
                    <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md text-[10px] font-bold">
                      <span className="w-1 h-1 rounded-full bg-emerald-600"></span> ปกติ
                    </span>
                  );

                  if (isOut) {
                    cardBorder = 'border-rose-300 bg-rose-50/10';
                    balanceColor = 'text-rose-600 font-extrabold';
                    statusBadge = (
                      <span className="flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-md text-[10px] font-bold">
                        <span className="w-1 h-1 rounded-full bg-rose-600 animate-pulse"></span> หมด
                      </span>
                    );
                  } else if (isLow) {
                    cardBorder = 'border-amber-300 bg-amber-50/10';
                    balanceColor = 'text-amber-700 font-bold';
                    statusBadge = (
                      <span className="flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md text-[10px] font-bold">
                        <span className="w-1 h-1 rounded-full bg-amber-600"></span> ใกล้หมด
                      </span>
                    );
                  }

                  return (
                    <div
                      key={item.code + '-' + idx + '-mob'}
                      onClick={() => setSelectedItem(item)}
                      className={`border p-4 rounded-xl flex flex-col gap-2 cursor-pointer shadow-2xs hover:bg-slate-50 transition ${cardBorder}`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] text-slate-400 font-bold font-mono">{item.code} · {item.pn}</p>
                          <h4 className="text-sm font-black text-slate-800 truncate mt-0.5">{item.name}</h4>
                        </div>
                        <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-600 px-2.5 py-0.5 rounded-full font-bold">
                          {item.system}
                        </span>
                      </div>

                      <div className="flex justify-between items-end border-t border-slate-100 pt-2 mt-1">
                        <div className="flex items-center gap-2">
                          {statusBadge}
                          {item.action && item.action !== '-' && (
                            <span className="bg-[#5c607f] text-white px-2 py-0.5 rounded-md text-[9px] font-bold">
                              {item.action}
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 font-bold block mb-0.5">คงเหลือ / MIN</span>
                          <span className={`text-base ${balanceColor}`}>{item.balance}</span>
                          <span className="text-xs text-slate-400 font-medium"> / {item.min}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Item Detail Popover Overlay Modal */}
      <AnimatePresence>
        {selectedItem && (
          <div
            onClick={() => setSelectedItem(null)}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', damping: 20 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border ${selectedItem.status === 'Out'
                ? 'border-rose-200 ring-4 ring-rose-50/30'
                : selectedItem.status === 'Low'
                  ? 'border-amber-200 ring-4 ring-amber-50/30'
                  : 'border-slate-200 ring-4 ring-slate-50/30'
                }`}
            >
              {/* Header card border color */}
              <div
                className={`h-2.5 w-full ${selectedItem.status === 'Out' ? 'bg-rose-500' : selectedItem.status === 'Low' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
              ></div>

              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black">รายละเอียดอะไหล่</span>
                    <h3 className="text-base font-extrabold text-[#4A4A49] font-mono mt-0.5">
                      {selectedItem.code} <span className="text-slate-300 font-normal">|</span> {selectedItem.pn}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Part name */}
                  <div>
                    <p className="text-sm font-semibold text-slate-800 leading-snug">{selectedItem.name}</p>
                    <span className="inline-block mt-2 text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-bold border border-slate-200">
                      ระบบ: {selectedItem.system}
                    </span>
                  </div>

                  {/* Stock status badge in popover */}
                  <div>
                    {selectedItem.status === 'Out' ? (
                      <span className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1 rounded-xl text-xs font-black">
                        <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span> หมด (Out of stock)
                      </span>
                    ) : selectedItem.status === 'Low' ? (
                      <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-xl text-xs font-black">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span> ใกล้หมด (Low Stock)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-xl text-xs font-black">
                        <span className="w-2 h-2 rounded-full bg-emerald-600"></span> ปกติ (Normal)
                      </span>
                    )}
                  </div>

                  {/* Stats comparison grid */}
                  <div className="grid grid-cols-4 gap-2 bg-slate-50 border border-slate-100 rounded-2xl p-4">
                    <div className="text-center">
                      <span className="text-[10px] text-slate-400 font-bold block mb-1">คงเหลือ</span>
                      <strong className={`text-lg block font-mono ${selectedItem.status === 'Out' ? 'text-rose-600 font-black' : selectedItem.status === 'Low' ? 'text-amber-600' : 'text-slate-800'
                        }`}>
                        {selectedItem.balance.toLocaleString()}
                      </strong>
                    </div>
                    <div className="text-center border-l border-slate-200">
                      <span className="text-[10px] text-slate-400 font-bold block mb-1">MIN</span>
                      <strong className="text-lg block text-slate-600 font-mono">{selectedItem.min.toLocaleString()}</strong>
                    </div>
                    <div className="text-center border-l border-slate-200">
                      <span className="text-[10px] text-slate-400 font-bold block mb-1">MAX</span>
                      <strong className="text-lg block text-slate-600 font-mono">{selectedItem.max.toLocaleString()}</strong>
                    </div>
                    <div className="text-center border-l border-slate-200">
                      <span className="text-[10px] text-slate-400 font-bold block mb-1">ต่ำกว่า MIN</span>
                      <strong className={`text-lg block font-mono ${selectedItem.min - selectedItem.balance > 0 ? 'text-rose-600' : 'text-slate-400 font-normal'
                        }`}>
                        {Math.max(selectedItem.min - selectedItem.balance, 0).toLocaleString()}
                      </strong>
                    </div>
                  </div>

                  {/* Action or Order Suggestion note */}
                  <div className={`p-4 rounded-2xl flex gap-3 text-xs leading-relaxed ${selectedItem.status === 'Out'
                    ? 'bg-rose-50 text-rose-800 border border-rose-200'
                    : selectedItem.status === 'Low'
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}>
                    <Info className={`w-5 h-5 shrink-0 ${selectedItem.status === 'Out' ? 'text-rose-500' : selectedItem.status === 'Low' ? 'text-amber-500' : 'text-emerald-500'
                      }`} />
                    <div>
                      {selectedItem.status === 'Out' ? (
                        <span>
                          รายการนี้หมดสต็อกแล้ว (คงเหลือ 0) ต้องสั่งซื้อ/เบิกด่วนเพื่อไม่ให้กระทบต่อระบบ <strong>"{selectedItem.system}"</strong>
                          {selectedItem.action && selectedItem.action !== '-' && ` — สถานะปัจจุบัน: ${selectedItem.action}`}
                        </span>
                      ) : selectedItem.status === 'Low' ? (
                        <span>
                          รายการนี้คงเหลือต่ำกว่าเกณฑ์ MIN อยู่ <strong>{(selectedItem.min - selectedItem.balance).toLocaleString()}</strong> ชิ้น
                          ควรทำการเบิกหรือสั่งซื้อเพิ่มเติมสำหรับระบบ <strong>"{selectedItem.system}"</strong>
                          {selectedItem.action && selectedItem.action !== '-' && ` — สถานะปัจจุบัน: ${selectedItem.action}`}
                        </span>
                      ) : (
                        <span>
                          จำนวนอะไหล่มีคงเหลือเพียงพอ อยู่เหนือเกณฑ์ความต้องการขั้นต่ำ (MIN) อีก{' '}
                          <strong>{(selectedItem.balance - selectedItem.min).toLocaleString()}</strong> ชิ้น
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-md transition-all active:scale-95"
                  >
                    ตกลง
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
