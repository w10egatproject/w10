import { formatThaiDate, getOrderStatus } from '@/lib/shop-order/domain';
import type { ShopOrder } from '@/lib/shop-order/types';

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
  const headers = [
    'ลำดับ',
    'จาก',
    'เลขที่',
    'วันที่รับ',
    'เรื่อง',
    'หน่วยงานรับ',
    'ผู้รับ',
    'วันที่ออก',
    'หมายเหตุ',
    'สถานะ',
  ];
  return (
    <section className="min-w-0 rounded-2xl bg-white shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <h2 className="font-bold">ตารางรายการ Shop Order</h2>
          <p className="text-xs text-slate-500">
            พบ {total.toLocaleString('th-TH')} รายการ
          </p>
        </div>
      </div>
      <div className="max-h-[68vh] overflow-auto">
        <table className="w-full min-w-[1100px] border-collapse text-left text-xs">
          <thead className="sticky top-0 z-10 bg-slate-100">
            <tr>
              {headers.map((h) => (
                <th
                  key={h}
                  className="whitespace-nowrap border-b border-slate-200 px-3 py-3 font-bold"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((order) => {
              const done = getOrderStatus(order) === 'done';
              return (
                <tr
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
                  <td className="px-3 py-3 font-bold">{order.no}</td>
                  <td className="px-3 py-3">{order.from}</td>
                  <td className="px-3 py-3 font-mono">{order.number}</td>
                  <td className="px-3 py-3">{formatThaiDate(order.dateIn)}</td>
                  <td className="max-w-64 px-3 py-3 font-medium">
                    {order.subject}
                  </td>
                  <td className="px-3 py-3">{order.receivingUnit || '—'}</td>
                  <td className="px-3 py-3">{order.receiverName || '—'}</td>
                  <td className="px-3 py-3">
                    {formatThaiDate(order.dateOut) || '—'}
                  </td>
                  <td className="max-w-52 truncate px-3 py-3">
                    {order.note || '—'}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`whitespace-nowrap rounded-full px-2 py-1 font-bold ${
                        done
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {done ? 'เสร็จสิ้น' : 'รอดำเนินการ'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
          <button
            disabled={page <= 1}
            onClick={() => onPage(page - 1)}
            className="rounded-lg border px-3 py-1.5 disabled:opacity-40"
          >
            ก่อนหน้า
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => onPage(page + 1)}
            className="rounded-lg border px-3 py-1.5 disabled:opacity-40"
          >
            ถัดไป
          </button>
        </div>
      </div>
    </section>
  );
}
