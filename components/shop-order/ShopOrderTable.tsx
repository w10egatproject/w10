'use client';

import { formatThaiDate, getOrderStatus } from '@/lib/shop-order/domain';
import type { ShopOrder } from '@/lib/shop-order/types';
import { Card } from '@/components/ui/card';
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Props {
  orders: ShopOrder[];
  page?: number;
  totalPages?: number;
  total?: number;
  pageSize?: number;
  onPage?: (page: number) => void;
  onSelect?: (order: ShopOrder) => void;
}

export function ShopOrderTable({
  orders,
  onSelect,
}: Props) {
  if (orders.length === 0) {
    return (
      <Card className="flex flex-1 h-full min-h-[400px] flex-col items-center justify-center p-16 text-slate-400 border border-slate-200 shadow-sm">
        <span className="text-4xl">📋</span>
        <p className="mt-2 text-sm font-bold text-slate-600">ไม่พบข้อมูล Shop Order ตามเงื่อนไขที่เลือก</p>
        <p className="text-xs text-slate-400 mt-0.5">ลองปรับหรือล้างตัวกรองเพื่อค้นหาใหม่</p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border border-slate-200 shadow-sm h-full flex flex-col">
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-thin">
        <table className="w-full text-sm">
          <TableHeader className="sticky top-0 z-10 bg-slate-50 shadow-[0_1px_0_0_rgba(226,232,240,1)]">
            <TableRow className="flex border-b border-slate-200">
              <TableHead className="flex items-center px-2 py-2.5 text-center w-12 shrink-0 justify-center text-[11px] font-extrabold uppercase tracking-wider text-slate-600">ลำดับ</TableHead>
              <TableHead className="flex items-center px-2 py-2.5 w-16 shrink-0 text-[11px] font-extrabold uppercase tracking-wider text-slate-600">จาก</TableHead>
              <TableHead className="flex items-center px-2 py-2.5 w-20 shrink-0 text-[11px] font-extrabold uppercase tracking-wider text-slate-600">เลขที่</TableHead>
              <TableHead className="flex items-center px-2 py-2.5 w-24 shrink-0 text-[11px] font-extrabold uppercase tracking-wider text-slate-600">วันที่รับ</TableHead>
              <TableHead className="flex items-center px-2.5 py-2.5 min-w-0 flex-[2] text-[11px] font-extrabold uppercase tracking-wider text-slate-600">เรื่อง</TableHead>
              <TableHead className="flex items-center px-2 py-2.5 w-24 shrink-0 text-[11px] font-extrabold uppercase tracking-wider text-slate-600">หน่วยงานรับ</TableHead>
              <TableHead className="flex items-center px-2 py-2.5 w-20 shrink-0 text-[11px] font-extrabold uppercase tracking-wider text-slate-600">ผู้รับ</TableHead>
              <TableHead className="flex items-center px-2 py-2.5 w-24 shrink-0 text-[11px] font-extrabold uppercase tracking-wider text-slate-600">วันที่ออก</TableHead>
              <TableHead className="flex items-center px-2.5 py-2.5 min-w-0 flex-1 text-[11px] font-extrabold uppercase tracking-wider text-slate-600">หมายเหตุ</TableHead>
              <TableHead className="flex items-center px-2 py-2.5 text-center w-24 shrink-0 justify-center text-[11px] font-extrabold uppercase tracking-wider text-slate-600">สถานะ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="flex flex-col text-slate-800 divide-y divide-slate-100">
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
                      ? 'flex cursor-pointer hover:bg-indigo-50/60 transition-colors focus:bg-indigo-50/60 focus:outline-none'
                      : 'flex hover:bg-slate-50 transition-colors'
                  }
                >
                  <TableCell className="flex items-center px-2 py-2.5 text-center w-12 shrink-0 justify-center font-bold text-slate-500">{order.no}</TableCell>
                  <TableCell className="flex items-center px-2 py-2.5 w-16 shrink-0 font-medium text-slate-700 truncate">{order.from || '—'}</TableCell>
                  <TableCell className="flex items-center px-2 py-2.5 w-20 shrink-0 font-mono font-bold text-slate-900 truncate">{order.number || '—'}</TableCell>
                  <TableCell className="flex items-center px-2 py-2.5 w-24 shrink-0 whitespace-nowrap font-medium text-slate-700">{formatThaiDate(order.dateIn) || '—'}</TableCell>
                  <TableCell className="flex items-center px-2.5 py-2.5 min-w-0 flex-[2] font-semibold text-slate-900" title={order.subject}>
                    <span className="truncate min-w-0">{order.subject || '—'}</span>
                  </TableCell>
                  <TableCell className="flex items-center px-2 py-2.5 w-24 shrink-0 font-medium text-slate-700 truncate" title={order.receivingUnit || '—'}>
                    {order.receivingUnit || '—'}
                  </TableCell>
                  <TableCell className="flex items-center px-2 py-2.5 w-20 shrink-0 font-medium text-slate-700 truncate" title={order.receiverName || '—'}>
                    {order.receiverName || '—'}
                  </TableCell>
                  <TableCell className="flex items-center px-2 py-2.5 w-24 shrink-0 whitespace-nowrap font-medium text-slate-700">
                    {formatThaiDate(order.dateOut) || '—'}
                  </TableCell>
                  <TableCell className="flex items-center px-2.5 py-2.5 min-w-0 flex-1 text-slate-500" title={order.note || '—'}>
                    <span className="truncate min-w-0">{order.note || '—'}</span>
                  </TableCell>
                  <TableCell className="flex items-center px-2 py-2.5 text-center w-24 shrink-0 justify-center">
                    {done ? (
                      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-none font-bold px-2 py-0.5 text-xs rounded-md">
                        เสร็จสิ้น
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-none font-bold px-2 py-0.5 text-xs rounded-md">
                        รอดำเนินการ
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </table>
      </div>

      {/* Footer Info Bar */}
      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2.5 text-xs text-slate-500 bg-white shrink-0">
        <div>
          ทั้งหมด <span className="font-bold text-slate-800">{orders.length.toLocaleString('th-TH')}</span> รายการ
        </div>
        <div className="text-[11px] text-slate-400">
          เลื่อนลงเพื่อดูรายการเพิ่มเติม
        </div>
      </div>
    </Card>
  );
}