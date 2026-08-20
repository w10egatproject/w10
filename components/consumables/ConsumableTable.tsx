'use client';

import Image from 'next/image';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ConsumableItem } from '@/lib/consumables/types';
import { getDriveImageThumbnailUrl } from '@/lib/utils/drive-images';

interface Props {
  items: ConsumableItem[];
  totalItems: number;
  page: number;
  totalPages: number;
  pageSize: number;
  loading: boolean;
  onPageChange: (page: number) => void;
  onSelect: (item: ConsumableItem) => void;
}

export function ConsumableTable({
  items,
  totalItems,
  page,
  totalPages,
  pageSize,
  loading,
  onPageChange,
  onSelect,
}: Props) {
  if (loading) {
    return (
      <Card className="flex h-full flex-col items-center justify-center p-16 text-slate-400">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-500" />
        <p className="mt-3 text-sm font-medium">กำลังโหลดข้อมูล Consumables...</p>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="flex h-full flex-col items-center justify-center p-16 text-slate-400">
        <span className="text-4xl">📦</span>
        <p className="mt-2 text-sm font-medium">ไม่พบข้อมูล Consumable ตามเงื่อนไขที่เลือก</p>
      </Card>
    );
  }

  const startIdx = (page - 1) * pageSize + 1;
  const endIdx = Math.min(page * pageSize, totalItems);

  return (
    <Card className="overflow-hidden border-slate-200 shadow-sm h-full flex flex-col justify-between">
      <div className="overflow-x-auto flex-1 min-h-0">
        <Table className="min-w-full text-sm">
          <TableHeader className="bg-slate-50">
            <TableRow className="border-b border-slate-200">
              <TableHead className="px-4 py-3 text-center w-16 text-[11px] font-extrabold uppercase tracking-wider text-slate-600">ลำดับ</TableHead>
              <TableHead className="px-4 py-3 w-28 text-[11px] font-extrabold uppercase tracking-wider text-slate-600">วันที่</TableHead>
              <TableHead className="px-4 py-3 min-w-[180px] text-[11px] font-extrabold uppercase tracking-wider text-slate-600">รายการ</TableHead>
              <TableHead className="px-4 py-3 text-center w-20 text-[11px] font-extrabold uppercase tracking-wider text-slate-600">จำนวน</TableHead>
              <TableHead className="px-4 py-3 w-32 text-[11px] font-extrabold uppercase tracking-wider text-slate-600">ผู้รับ</TableHead>
              <TableHead className="px-4 py-3 min-w-[140px] text-[11px] font-extrabold uppercase tracking-wider text-slate-600">หมายเหตุ</TableHead>
              <TableHead className="px-4 py-3 text-center w-20 text-[11px] font-extrabold uppercase tracking-wider text-slate-600">รูป</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="text-slate-800">
            {items.map((item, index) => (
              <TableRow
                key={`${item.no}-${item.item}-${item.receiver}-${item.dateDisplay || ''}-${index}`}
                onClick={() => onSelect(item)}
                className="cursor-pointer transition-colors hover:bg-emerald-50/60"
              >
                <TableCell className="px-4 py-3 text-center font-bold text-slate-500">
                  {item.no}
                </TableCell>
                <TableCell className="px-4 py-3 whitespace-nowrap font-medium text-slate-700">
                  {item.dateDisplay || '—'}
                </TableCell>
                <TableCell className="px-4 py-3 font-semibold text-slate-900">
                  {item.item || '—'}
                </TableCell>
                <TableCell className="px-4 py-3 text-center font-black text-emerald-600">
                  {item.quantity}
                </TableCell>
                <TableCell className="px-4 py-3 font-medium text-slate-700">
                  {item.receiver || '—'}
                </TableCell>
                <TableCell className="px-4 py-3 text-slate-500">
                  <div className="truncate max-w-[200px]">{item.note || '—'}</div>
                </TableCell>
                <TableCell className="px-4 py-3 text-center">
                  {item.picUrl ? (
                    <div className="relative inline-block h-8 w-8 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                      <Image
                        src={getDriveImageThumbnailUrl(item.picUrl) || item.picUrl}
                        alt="pic thumbnail"
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-xs text-slate-500 mt-auto bg-white">
        <div>
          แสดง {startIdx}-{endIdx} จาก {totalItems} รายการ
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="h-8 w-8"
          >
            ‹
          </Button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(
              (p) =>
                p === 1 ||
                p === totalPages ||
                Math.abs(p - page) <= 1,
            )
            .map((p, idx, arr) => {
              const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;
              return (
                <span key={p} className="flex items-center gap-1">
                  {showEllipsis && <span className="px-1 text-slate-400">…</span>}
                  <Button
                    variant={p === page ? "default" : "outline"}
                    size="icon"
                    onClick={() => onPageChange(p)}
                    className={`h-8 w-8 ${p === page ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                  >
                    {p}
                  </Button>
                </span>
              );
            })}

          <Button
            variant="outline"
            size="icon"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="h-8 w-8"
          >
            ›
          </Button>
        </div>
      </div>
    </Card>
  );
}
