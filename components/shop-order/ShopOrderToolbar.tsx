import { Plus, RefreshCw, RotateCcw, Search } from 'lucide-react';
import type { ShopOrderFilters } from '@/lib/shop-order/types';

interface Props {
  filters: ShopOrderFilters;
  years: string[];
  loading: boolean;
  onChange: (filters: ShopOrderFilters) => void;
  onRefresh: () => void;
  onAdd?: () => void;
}

export function ShopOrderToolbar({
  filters,
  years,
  loading,
  onChange,
  onRefresh,
  onAdd,
}: Props) {
  const set = (patch: Partial<ShopOrderFilters>) =>
    onChange({ ...filters, ...patch });
  return (
    <section
      aria-label="ตัวกรองรายการ"
      className="mb-5 rounded-2xl bg-white p-4 shadow-sm"
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(240px,1fr)_140px_130px_160px_auto]">
        <label className="relative">
          <span className="mb-1 block text-xs font-bold text-slate-600">
            ค้นหา
          </span>
          <Search
            aria-hidden
            className="absolute bottom-3 left-3 h-4 w-4 text-slate-500"
          />
          <input
            value={filters.query}
            onChange={(e) => set({ query: e.target.value })}
            placeholder="เลขที่ เรื่อง หน่วยงาน ผู้รับ..."
            className="h-10 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </label>
        <label>
          <span className="mb-1 block text-xs font-bold text-slate-600">
            ปี
          </span>
          <select
            value={filters.year}
            onChange={(e) => set({ year: e.target.value })}
            className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="all">ทุกปี</option>
            {years.map((year) => (
              <option key={year}>{year}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="mb-1 block text-xs font-bold text-slate-600">
            เดือน
          </span>
          <select
            value={filters.month}
            onChange={(e) => set({ month: e.target.value })}
            className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="all">ทุกเดือน</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="mb-1 block text-xs font-bold text-slate-600">
            สถานะ
          </span>
          <select
            value={filters.status}
            onChange={(e) =>
              set({ status: e.target.value as ShopOrderFilters['status'] })
            }
            className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="all">ทั้งหมด</option>
            <option value="wait">รอดำเนินการ</option>
            <option value="done">เสร็จสิ้น</option>
          </select>
        </label>
        <div className="flex items-end gap-2">
          <button
            type="button"
            aria-label="รีเฟรชข้อมูล"
            onClick={onRefresh}
            disabled={loading}
            className="flex h-10 items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 text-slate-600 ${
                loading ? 'animate-spin' : ''
              }`}
            />
            <span>รีเฟรชข้อมูล</span>
          </button>
          <button
            type="button"
            aria-label="ล้างตัวกรอง"
            onClick={() =>
              onChange({ query: '', year: 'all', month: 'all', status: 'all' })
            }
            className="flex h-10 items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <RotateCcw className="h-4 w-4 text-slate-600" /> ล้าง
          </button>
          {onAdd && (
            <button
              type="button"
              onClick={onAdd}
              className="flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              <Plus className="h-4 w-4" /> เพิ่ม
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
