import { formatThaiDate, getOrderStatus } from '@/lib/shop-order/domain';
import type { ShopOrder } from '@/lib/shop-order/types';
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Props {
  orders: ShopOrder[];
  page: number;
  totalPages: number;
  total: number;
  onPage: (page: number) => void;
  onSelect?: (order: ShopOrder) => void;
}

export function ShopOrderTable({
  orders,
  page,
  totalPages,
  total,
  onPage,
  onSelect,
}: Props) {
  return (
    <Card className="min-w-0 shadow-sm border-none overflow-hidden h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <h2 className="font-bold">ตารางรายการ Shop Order</h2>
          <p className="text-xs text-slate-500">
            พบ {total.toLocaleString('th-TH')} รายการ
          </p>
        </div>
      </div>
      <div className="max-h-[68vh] overflow-auto flex-1">
        <Table className="min-w-[1100px] table-fixed text-xs">
          <TableHeader className="sticky top-0 z-10 bg-slate-100">
            <TableRow>
              <TableHead className="w-14 whitespace-nowrap font-bold text-slate-900">ลำดับ</TableHead>
              <TableHead className="w-20 whitespace-nowrap font-bold text-slate-900">จาก</TableHead>
              <TableHead className="w-24 whitespace-nowrap font-bold text-slate-900">เลขที่</TableHead>
              <TableHead className="w-24 whitespace-nowrap font-bold text-slate-900">วันที่รับ</TableHead>
              <TableHead className="whitespace-nowrap font-bold text-slate-900">เรื่อง</TableHead>
              <TableHead className="w-28 whitespace-nowrap font-bold text-slate-900">หน่วยงานรับ</TableHead>
              <TableHead className="w-24 whitespace-nowrap font-bold text-slate-900">ผู้รับ</TableHead>
              <TableHead className="w-24 whitespace-nowrap font-bold text-slate-900">วันที่ออก</TableHead>
              <TableHead className="w-36 whitespace-nowrap font-bold text-slate-900">หมายเหตุ</TableHead>
              <TableHead className="w-28 whitespace-nowrap font-bold text-slate-900">สถานะ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => {
              const done = getOrderStatus(order) === 'done';
              return (
                <TableRow
                  key={order.no}
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
                      ? 'cursor-pointer hover:bg-indigo-50/50 focus:bg-indigo-50 focus:outline-none'
                      : 'hover:bg-slate-50'
                  }
                >
                  <TableCell className="font-bold">{order.no}</TableCell>
                  <TableCell className="truncate">{order.from}</TableCell>
                  <TableCell className="font-mono truncate">{order.number}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatThaiDate(order.dateIn)}</TableCell>
                  <TableCell className="truncate font-medium" title={order.subject}>
                    {order.subject}
                  </TableCell>
                  <TableCell className="truncate" title={order.receivingUnit || '—'}>{order.receivingUnit || '—'}</TableCell>
                  <TableCell className="truncate" title={order.receiverName || '—'}>{order.receiverName || '—'}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatThaiDate(order.dateOut) || '—'}
                  </TableCell>
                  <TableCell className="truncate" title={order.note || '—'}>
                    {order.note || '—'}
                  </TableCell>
                  <TableCell>
                    {done ? (
                      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-none font-bold">
                        เสร็จสิ้น
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-none font-bold">
                        รอดำเนินการ
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {!orders.length && (
          <div className="p-12 text-center">
            <p className="font-bold">ไม่พบรายการ</p>
            <p className="mt-1 text-sm text-slate-500">
              ลองปรับหรือล้างตัวกรอง
            </p>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm">
        <span>
          หน้า {page} / {totalPages}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPage(page - 1)}
            className="rounded-lg"
          >
            ก่อนหน้า
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPage(page + 1)}
            className="rounded-lg"
          >
            ถัดไป
          </Button>
        </div>
      </div>
    </Card>
  );
}
