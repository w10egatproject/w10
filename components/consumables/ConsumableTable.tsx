'use client';

import Image from 'next/image';
import type { ConsumableItem } from '@/lib/consumables/types';

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
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-500" />
        <p className="mt-3 text-sm font-medium">กำลังโหลดข้อมูล Consumables...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <span className="text-4xl">📦</span>
        <p className="mt-2 text-sm font-medium">ไม่พบข้อมูล Consumable ตามเงื่อนไขที่เลือก</p>
      </div>
    );
  }

  const startIdx = (page - 1) * pageSize + 1;
  const endIdx = Math.min(page * pageSize, totalItems);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
              <th className="px-4 py-3 text-center w-16">ลำดับ</th>
              <th className="px-4 py-3 w-28">วันที่</th>
              <th className="px-4 py-3 min-w-[180px]">รายการ</th>
              <th className="px-4 py-3 text-center w-20">จำนวน</th>
              <th className="px-4 py-3 w-32">ผู้รับ</th>
              <th className="px-4 py-3 min-w-[140px]">หมายเหตุ</th>
              <th className="px-4 py-3 text-center w-20">รูป</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {items.map((item) => (
              <tr
                key={item.no}
                onClick={() => onSelect(item)}
                className="cursor-pointer transition-colors hover:bg-emerald-50/60"
              >
                <td className="px-4 py-3 text-center font-bold text-slate-500">
                  {item.no}
                </td>
                <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-700">
                  {item.dateDisplay || '—'}
                </td>
                <td className="px-4 py-3 font-semibold text-slate-900">
                  {item.item || '—'}
                </td>
                <td className="px-4 py-3 text-center font-black text-emerald-600">
                  {item.quantity}
                </td>
                <td className="px-4 py-3 font-medium text-slate-700">
                  {item.receiver || '—'}
                </td>
                <td className="px-4 py-3 text-slate-500 truncate max-w-[200px]">
                  {item.note || '—'}
                </td>
                <td className="px-4 py-3 text-center">
                  {item.picUrl ? (
                    <div className="relative inline-block h-8 w-8 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                      <Image
                        src={item.picUrl}
                        alt="pic thumbnail"
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
        <div>
          แสดง {startIdx}-{endIdx} จาก {totalItems} รายการ
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="flex h-8 min-w-[32px] items-center justify-center rounded-lg border border-slate-200 bg-white font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
          >
            ‹
          </button>

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
                  <button
                    type="button"
                    onClick={() => onPageChange(p)}
                    className={`flex h-8 min-w-[32px] items-center justify-center rounded-lg border font-bold transition ${
                      p === page
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </button>
                </span>
              );
            })}

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="flex h-8 min-w-[32px] items-center justify-center rounded-lg border border-slate-200 bg-white font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}
