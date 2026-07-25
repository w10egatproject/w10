'use client';
import { useState } from 'react';
import { formatThaiDate, getOrderStatus } from '@/lib/shop-order/domain';
import type { ShopOrder } from '@/lib/shop-order/types';

export function OrderDetailDialog({ order, pending, onClose, onEdit, onDelete }: { order: ShopOrder; pending: boolean; onClose: () => void; onEdit: () => void; onDelete: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const rows = [['ลำดับ', order.no], ['จาก', order.from], ['ถึง', order.to], ['เลขที่', order.number], ['วันที่รับ', formatThaiDate(order.dateIn) || '—'], ['เรื่อง', order.subject], ['หน่วยงานรับ', order.receivingUnit || '—'], ['ผู้รับ', order.receiverName || '—'], ['วันที่ออก', formatThaiDate(order.dateOut) || '—'], ['หมายเหตุ', order.note || '—'], ['ไฟล์', order.fileUrl || '—']];
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-3">
    <section role="dialog" aria-modal="true" aria-labelledby="order-detail-title" onKeyDown={(e) => { if (e.key === 'Escape' && !pending) onClose(); }} className="max-h-[95vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5">
      <div className="flex justify-between"><div><h2 id="order-detail-title" className="text-lg font-black">รายละเอียด Shop Order #{order.no}</h2><span className={`mt-1 inline-block rounded-full px-2 py-1 text-xs font-bold ${getOrderStatus(order) === 'done' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{getOrderStatus(order) === 'done' ? 'เสร็จสิ้น' : 'รอดำเนินการ'}</span></div><button onClick={onClose} aria-label="ปิด" className="h-9 w-9 rounded-lg text-xl hover:bg-slate-100">×</button></div>
      <dl className="mt-5 grid gap-x-4 sm:grid-cols-2">{rows.map(([label, value]) => <div key={String(label)} className="border-b border-slate-100 py-2"><dt className="text-xs font-bold text-slate-500">{label}</dt><dd className="mt-1 break-words text-sm">{value}</dd></div>)}</dl>
      <div className="mt-5 flex justify-end gap-2"><button disabled={pending} onClick={() => setConfirming(true)} className="rounded-xl border border-rose-300 px-4 py-2 font-bold text-rose-700">ลบรายการ</button><button disabled={pending} onClick={onEdit} className="rounded-xl bg-indigo-600 px-4 py-2 font-bold text-white">แก้ไข</button></div>
      {confirming && <div role="alertdialog" aria-modal="true" aria-label="ยืนยันลบรายการ" className="mt-4 rounded-xl bg-rose-50 p-4"><p className="font-bold text-rose-900">ยืนยันลบรายการ #{order.no}?</p><p className="mt-1 text-sm text-rose-800">ข้อมูลในชีทจะถูกล้าง แต่ไฟล์ใน Drive จะยังคงอยู่</p><div className="mt-3 flex justify-end gap-2"><button onClick={() => setConfirming(false)} className="rounded-lg border px-3 py-1.5">ยกเลิก</button><button disabled={pending} onClick={onDelete} className="rounded-lg bg-rose-700 px-3 py-1.5 font-bold text-white">ยืนยันลบ</button></div></div>}
    </section>
  </div>;
}
