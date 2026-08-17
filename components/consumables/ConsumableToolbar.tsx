'use client';

import {
  FileSpreadsheet,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
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
    <Card className="mb-5 border-none bg-transparent shadow-none sm:bg-white sm:border-solid sm:border-slate-200 sm:shadow-sm">
      <CardContent className="p-0 sm:p-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(240px,1fr)_140px_140px_auto]">
          <label className="relative">
            <span className="mb-1 block text-xs font-bold text-slate-600">
              ค้นหา
            </span>
            <Search
              aria-hidden
              className="absolute bottom-3 left-3 h-4 w-4 text-slate-500 z-10"
            />
            <Input
              value={filters.query}
              onChange={(e) => set({ query: e.target.value })}
              placeholder="ค้นหา รายการ ผู้รับ หมายเหตุ..."
              className="h-10 pl-9 rounded-xl border-slate-300 focus-visible:ring-emerald-500"
            />
          </label>
          <label>
            <span className="mb-1 block text-xs font-bold text-slate-600">
              ปี
            </span>
            <select
              value={filters.year}
              onChange={(e) => set({ year: e.target.value })}
              className="h-10 w-full rounded-xl border border-input bg-white px-3 text-sm focus:border-ring focus:ring-2 focus:ring-ring/20 outline-none"
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
              className="h-10 w-full rounded-xl border border-input bg-white px-3 text-sm focus:border-ring focus:ring-2 focus:ring-ring/20 outline-none"
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
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
              className="h-10 rounded-xl border-slate-300 font-bold text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw
                className={`mr-1.5 h-4 w-4 text-slate-600 ${
                  loading ? 'animate-spin' : ''
                }`}
              />
              รีเฟรชข้อมูล
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onChange({ query: '', year: 'all', month: 'all' })}
              className="h-10 rounded-xl border-slate-300 font-bold text-slate-700 hover:bg-slate-50"
            >
              <RotateCcw className="mr-1.5 h-4 w-4 text-slate-600" /> ล้าง
            </Button>
            <a
              href="https://docs.google.com/spreadsheets/d/1ZtFnQhPortoyUgKzQuruq5kU7q5V9l1GYbsSgL-9oco/edit?gid=0#gid=0"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 text-sm font-bold text-emerald-800 hover:bg-emerald-100 transition-colors"
            >
              <FileSpreadsheet aria-hidden className="mr-1.5 h-4 w-4" />
              เปิด Google Sheet
            </a>
            {onAdd && (
              <Button
                size="sm"
                onClick={onAdd}
                className="h-10 rounded-xl bg-emerald-600 font-bold text-white hover:bg-emerald-700"
              >
                <Plus className="mr-1.5 h-4 w-4" /> เพิ่ม
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
