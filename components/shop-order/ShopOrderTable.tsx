'use client';

import { formatThaiDate, getOrderStatus } from '@/lib/shop-order/domain';
import type { ShopOrder } from '@/lib/shop-order/types';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Props {
  orders: ShopOrder[];
  page: number;
  totalPages: number;
  total: number;
  pageSize?: number;
  onPage: (page: number) => void;
  onSelect?: (order: ShopOrder) => void;
}

export function ShopOrderTable({
  orders,
  page,
  totalPages,
  total,
  pageSize = 12,
  onPage,
  onSelect,
}: Props) {
  const startIdx = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIdx = Math.min(page * pageSize, total);

  if (orders.length === 0) {
    return (
      <Card className="flex flex-1 min-h-[400px] flex-col items-center justify-center p-16 text-slate-400 border border-slate-200 shadow-sm">
        <span className="text-4xl">📋</span>
        <p className="mt-2 text-sm font-bold text-slate-600">ไม่พบข้อมูล Shop Order ตามเงื่อนไขที่เลือก</p>
        <p className="text-xs text-slate-400 mt-0.5">ลองปรับหรือล้างตัวกรองเพื่อค้นหาใหม่</p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border border-slate-200 shadow-sm flex-1 h-full flex flex-col justify-between">
      <div className="overflow-x-auto flex-1">
        <Table className="min-w-[1100px] text-sm">
          <TableHeader className="bg-slate-50">
            <TableRow className="border-b border-slate-200">
              <TableHead className="px-4 py-3 text-center w-16 text-[11px] font-extrabold uppercase tracking-wider text-slate-600">ลำดับ</TableHead>
              <TableHead className="px-4 py-3 w-20 text-[11px] font-extrabold uppercase tracking-wider text-slate-600">จาก</TableHead>
              <TableHead className="px-4 py-3 w-28 text-[11px] font-extrabold uppercase tracking-wider text-slate-600">เลขที่</TableHead>
              <TableHead className="px-4 py-3 w-28 text-[11px] font-extrabold uppercase tracking-wider text-slate-600">วันที่รับ</TableHead>
              <TableHead className="px-4 py-3 min-w-[200px] text-[11px] font-extrabold uppercase tracking-wider text-slate-600">เรื่อง</TableHead>
              <TableHead className="px-4 py-3 w-32 text-[11px] font-extrabold uppercase tracking-wider text-slate-600">หน่วยงานรับ</TableHead>
              <TableHead className="px-4 py-3 w-28 text-[11px] font-extrabold uppercase tracking-wider text-slate-600">ผู้รับ</TableHead>
              <TableHead className="px-4 py-3 w-28 text-[11px] font-extrabold uppercase tracking-wider text-slate-600">วันที่ออก</TableHead>
              <TableHead className="px-4 py-3 min-w-[140px] text-[11px] font-extrabold uppercase tracking-wider text-slate-600">หมายเหตุ</TableHead>
              <TableHead className="px-4 py-3 text-center w-28 text-[11px] font-extrabold uppercase tracking-wider text-slate-600">สถานะ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="text-slate-800">
            {orders.map((order, index) => {
              const done = getOrderStatus(order) === 'done';
              return (
                <TableRow
                  key={`${order.no}-${order.number}-${order.dateIn || ''}-${index}`}
                  tabIndex={onSelect ? 0 : undefined}
                  onClick={() => onSelect?.(order)}
                  onKeyDown={(e) => {
                    if (onSelect && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      onSelect(order);
                    }
                  }}
                  className={
                    onSelect
                      ? 'cursor-pointer hover:bg-indigo-50/60 transition-colors focus:bg-indigo-50/60 focus:outline-none'
                      : 'hover:bg-slate-50 transition-colors'
                  }
                >
                  <TableCell className="px-4 py-3 text-center font-bold text-slate-500">{order.no}</TableCell>
                  <TableCell className="px-4 py-3 truncate font-medium text-slate-700">{order.from || '—'}</TableCell>
                  <TableCell className="px-4 py-3 font-mono font-bold text-slate-900 truncate">{order.number || '—'}</TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap font-medium text-slate-700">{formatThaiDate(order.dateIn) || '—'}</TableCell>
                  <TableCell className="px-4 py-3 font-semibold text-slate-900 max-w-[280px]" title={order.subject}>
                    <div className="truncate">{order.subject || '—'}</div>
                  </TableCell>
                  <TableCell className="px-4 py-3 font-medium text-slate-700 truncate" title={order.receivingUnit || '—'}>
                    {order.receivingUnit || '—'}
                  </TableCell>
                  <TableCell className="px-4 py-3 font-medium text-slate-700 truncate" title={order.receiverName || '—'}>
                    {order.receiverName || '—'}
                  </TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap font-medium text-slate-700">
                    {formatThaiDate(order.dateOut) || '—'}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-slate-500">
                    <div className="truncate max-w-[160px]">{order.note || '—'}</div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-center">
                    {done ? (
                      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-none font-bold px-2.5 py-0.5 rounded-md">
                        เสร็จสิ้น
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-none font-bold px-2.5 py-0.5 rounded-md">
                        รอดำเนินการ
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-xs text-slate-500 mt-auto bg-white">
        <div>
          แสดง {startIdx}-{endIdx} จาก {total.toLocaleString('th-TH')} รายการ
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            disabled={page <= 1}
            onClick={() => onPage(page - 1)}
            className="h-8 w-8 rounded-lg"
            aria-label="Previous page"
          >
            &lt;
          </Button>
          <span className="grid h-8 min-w-[32px] place-items-center rounded-lg bg-indigo-600 px-2 font-black text-white">
            {page}
          </span>
          <span className="text-slate-400">/</span>
          <span className="font-bold text-slate-700">{totalPages || 1}</span>
          <Button
            variant="outline"
            size="icon"
            disabled={page >= totalPages}
            onClick={() => onPage(page + 1)}
            className="h-8 w-8 rounded-lg"
            aria-label="Next page"
          >
            &gt;
          </Button>
        </div>
      </div>
    </Card>
  );
}
