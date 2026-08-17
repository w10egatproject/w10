import {
  FileSpreadsheet,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
} from 'lucide-react';
import type { ShopOrderFilters } from '@/lib/shop-order/types';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

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
    <Card className="mb-5 shadow-sm border-none rounded-2xl">
      <CardContent className="p-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(240px,1fr)_140px_130px_160px_auto]">
        <label className="relative flex flex-col justify-end">
          <span className="mb-1 block text-xs font-bold text-slate-600">
            ค้นหา
          </span>
          <div className="relative">
            <Search
              aria-hidden
              className="absolute bottom-3 left-3 h-4 w-4 text-slate-500 z-10"
            />
            <Input
              value={filters.query}
              onChange={(e) => set({ query: e.target.value })}
              placeholder="เลขที่ เรื่อง หน่วยงาน ผู้รับ..."
              className="h-10 w-full rounded-xl bg-white pl-9 pr-3 text-sm"
            />
          </div>
        </label>
        <label className="flex flex-col justify-end">
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
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col justify-end">
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
                {i + 1}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col justify-end">
          <span className="mb-1 block text-xs font-bold text-slate-600">
            สถานะ
          </span>
          <select
            value={filters.status}
            onChange={(e) =>
              set({ status: e.target.value as ShopOrderFilters['status'] })
            }
            className="h-10 w-full rounded-xl border border-input bg-white px-3 text-sm focus:border-ring focus:ring-2 focus:ring-ring/20 outline-none"
          >
            <option value="all">ทั้งหมด</option>
            <option value="wait">รอดำเนินการ</option>
            <option value="done">เสร็จสิ้น</option>
          </select>
        </label>
        <div className="flex flex-wrap items-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="h-10 rounded-xl"
            aria-label="รีเฟรชข้อมูล"
          >
            <RefreshCw
              className={`h-4 w-4 mr-1.5 ${
                loading ? 'animate-spin' : ''
              }`}
            />
            <span>รีเฟรชข้อมูล</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              onChange({ query: '', year: 'all', month: 'all', status: 'all' })
            }
            className="h-10 rounded-xl"
            aria-label="ล้างตัวกรอง"
          >
            <RotateCcw className="h-4 w-4 mr-1.5" /> ล้าง
          </Button>
          <a
            href="https://docs.google.com/spreadsheets/d/1ZtFnQhPortoyUgKzQuruq5kU7q5V9l1GYbsSgL-9oco/edit?gid=0#gid=0"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 text-sm font-bold text-emerald-800 hover:bg-emerald-100 transition-colors"
          >
            <FileSpreadsheet aria-hidden className="h-4 w-4 mr-1.5" />
            เปิด Google Sheet
          </a>
          {onAdd && (
            <Button
              size="sm"
              onClick={onAdd}
              className="h-10 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4 mr-1.5" /> เพิ่ม
            </Button>
          )}
      </div>
      </div>
      </CardContent>
    </Card>
  );
}
