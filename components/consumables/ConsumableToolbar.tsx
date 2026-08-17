'use client';

import {
  FileSpreadsheet,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
} from 'lucide-react';
import type { ConsumableFilters } from '@/lib/consumables/types';
import { getMonthThaiLabel } from '@/lib/consumables/domain';

interface Props {
  filters: ConsumableFilters;
  years: string[];
  loading: boolean;
  onChange: (filters: ConsumableFilters) => void;
  onRefresh: () => void;
  onAdd?: () => void;
}

export function ConsumableToolbar({
  filters,
  years,
  loading,
  onChange,
  onRefresh,
  onAdd,
}: Props) {
  const set = (patch: Partial<ConsumableFilters>) =>
    onChange({ ...filters, ...patch });

  return (
    <section
      aria-label="ตัวกรองรายการ Consumables"
      className="mb-5 rounded-2xl bg-white p-4 shadow-sm"
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(240px,1fr)_140px_140px_auto]">
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
            placeholder="ค้นหา รายการ ผู้รับ หมายเหตุ..."
            className="h-10 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </label>
        <label>
          <span className="mb-1 block text-xs font-bold text-slate-600">
            ปี
          </span>
          <select
            value={filters.year}
            onChange={(e) => set({ year: e.target.value })}
            className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="all">ทุกปี</option>
            {years.map((year) => (
              <option key={year} value={year}>
                ปี {year}
              </option>
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
            className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="all">ทุกเดือน</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={String(i + 1)}>
                {getMonthThaiLabel(i + 1)}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap items-end gap-2">
          <button
            type="button"
            aria-label="รีเฟรชข้อมูล"
            onClick={onRefresh}
            disabled={loading}
            className="flex h-10 items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-50"
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
              onChange({ query: '', year: 'all', month: 'all' })
            }
            className="flex h-10 items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <RotateCcw className="h-4 w-4 text-slate-600" /> ล้าง
          </button>
          <a
            href="https://docs.google.com/spreadsheets/d/1ZtFnQhPortoyUgKzQuruq5kU7q5V9l1GYbsSgL-9oco/edit?gid=0#gid=0"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 text-sm font-bold text-emerald-800 hover:bg-emerald-100 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          >
            <FileSpreadsheet aria-hidden className="h-4 w-4" />
            เปิด Google Sheet
          </a>
          {onAdd && (
            <button
              type="button"
              onClick={onAdd}
              className="flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              <Plus className="h-4 w-4" /> เพิ่ม
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
