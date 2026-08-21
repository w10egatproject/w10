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
import { Card, CardContent } from '@/components/ui/card';
import type { ConsumableFilters } from '@/lib/consumables/types';

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
    <Card className="mb-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-[220px]">
            <Search
              aria-hidden
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
            />
            <Input
              aria-label="ค้นหา"
              value={filters.query}
              onChange={(e) => set({ query: e.target.value })}
              placeholder="ค้นหารายการ, ผู้รับ, หมายเหตุ..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm font-medium text-slate-800 shadow-sm focus-visible:ring-emerald-500 focus-visible:border-emerald-500"
            />
          </div>



          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
              className="h-10 rounded-xl border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-50 hover:text-emerald-700 shadow-sm transition-all"
            >
              <RefreshCw
                className={`mr-1.5 h-4 w-4 text-slate-600 ${
                  loading ? 'animate-spin' : ''
                }`}
              />
              <span>รีเฟรชข้อมูล</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onChange({ query: '', year: 'all', month: 'all' })}
              className="h-10 rounded-xl border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-50 hover:text-rose-600 shadow-sm transition-all"
            >
              <RotateCcw className="mr-1.5 h-4 w-4 text-slate-600" /> ล้าง
            </Button>
            <a
              href="https://docs.google.com/spreadsheets/d/1ZtFnQhPortoyUgKzQuruq5kU7q5V9l1GYbsSgL-9oco/edit?gid=0#gid=0"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="เปิดชีท Consumables"
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-3.5 text-xs sm:text-sm font-bold text-sky-800 hover:bg-sky-100 shadow-sm transition-colors whitespace-nowrap"
            >
              <FileSpreadsheet aria-hidden className="mr-1.5 h-4 w-4" />
              เปิดชีท Consumables ↗
            </a>
            {onAdd && (
              <Button
                size="sm"
                onClick={onAdd}
                className="h-10 rounded-xl bg-emerald-600 font-bold text-white hover:bg-emerald-700 shadow-sm transition-all whitespace-nowrap"
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
