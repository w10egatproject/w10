'use client';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { formatThaiDate } from '@/lib/shop-order/domain';
import type { ShopOrder, ShopOrderInput } from '@/lib/shop-order/types';

const empty: ShopOrderInput = { to: '', number: '', dateIn: null, subject: '', receivingUnit: '', receiverName: '', dateOut: null, note: '' };

interface Props {
  mode: 'create' | 'edit'; order?: ShopOrder; departments: string[]; receivers: string[];
  pending: boolean; progress?: number; onClose: () => void;
  onSubmit: (value: { order: ShopOrderInput; file?: File }) => void;
}

export function OrderFormDialog({ mode, order, departments, receivers, pending, progress, onClose, onSubmit }: Props) {
  const [value, setValue] = useState<ShopOrderInput>(order ? {
    to: order.to, number: order.number, dateIn: order.dateIn, subject: order.subject,
    receivingUnit: order.receivingUnit, receiverName: order.receiverName,
    dateOut: order.dateOut, note: order.note,
  } : empty);
  const [file, setFile] = useState<File>();
  const [previewUrl, setPreviewUrl] = useState('');
  const previewUrlRef = useRef('');
  const first = useRef<HTMLSelectElement>(null);
  useEffect(() => {
    first.current?.focus();
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);
  const selectFile = (nextFile?: File) => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = '';
    }
    setFile(nextFile);
    if (nextFile?.type.startsWith('image/')) {
      const url = URL.createObjectURL(nextFile);
      previewUrlRef.current = url;
      setPreviewUrl(url);
    } else {
      setPreviewUrl('');
    }
  };
  const set = (patch: Partial<ShopOrderInput>) => setValue((current) => ({ ...current, ...patch }));
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-3" onMouseDown={(e) => { if (e.target === e.currentTarget && !pending) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="order-form-title" onKeyDown={(e) => { if (e.key === 'Escape' && !pending) onClose(); }}
      className="max-h-[95vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
      <div className="mb-4 flex items-center justify-between"><h2 id="order-form-title" className="text-lg font-black">{mode === 'create' ? 'เพิ่ม Shop Order' : `แก้ไขรายการ ${order?.no}`}</h2>
        <button type="button" disabled={pending} onClick={onClose} aria-label="ปิด" className="rounded-lg px-3 py-1 text-xl hover:bg-slate-100">×</button></div>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit({ order: value, file }); }} className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-bold">ถึง
          <select ref={first} required value={value.to} onChange={(e) => set({ to: e.target.value })} className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 font-normal">
            <option value="">เลือกหน่วยงาน</option>{departments.map((d) => <option key={d}>{d}</option>)}
          </select>
        </label>
        <label className="text-sm font-bold">เลขที่
          <input required inputMode="numeric" pattern="\d{6}" maxLength={6} value={value.number} onChange={(e) => set({ number: e.target.value.replace(/\D/g, '').slice(0, 6) })} className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 font-mono font-normal" />
        </label>
        <label className="text-sm font-bold">วันที่รับ
          <input type="date" value={value.dateIn ?? ''} onChange={(e) => set({ dateIn: e.target.value || null })} className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 font-normal" />
          {value.dateIn && <span className="mt-1 block text-xs font-normal text-slate-500">พ.ศ. {formatThaiDate(value.dateIn)}</span>}
        </label>
        <label className="text-sm font-bold">วันที่ออก
          <input type="date" value={value.dateOut ?? ''} onChange={(e) => set({ dateOut: e.target.value || null })} className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 font-normal" />
          {value.dateOut && <span className="mt-1 block text-xs font-normal text-slate-500">พ.ศ. {formatThaiDate(value.dateOut)}</span>}
        </label>
        <label className="text-sm font-bold sm:col-span-2">เรื่อง
          <input required value={value.subject} onChange={(e) => set({ subject: e.target.value })} className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 font-normal" />
        </label>
        <label className="text-sm font-bold">หน่วยงานรับ
          <input value={value.receivingUnit} onChange={(e) => set({ receivingUnit: e.target.value })} className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 font-normal" />
        </label>
        <label className="text-sm font-bold">ผู้รับ
          <input list="shop-order-receivers" value={value.receiverName} onChange={(e) => set({ receiverName: e.target.value })} className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 font-normal" />
          <datalist id="shop-order-receivers">{receivers.map((r) => <option key={r} value={r} />)}</datalist>
        </label>
        <label className="text-sm font-bold sm:col-span-2">หมายเหตุ
          <textarea rows={3} value={value.note} onChange={(e) => set({ note: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 p-3 font-normal" />
        </label>
        <label className="text-sm font-bold sm:col-span-2">ไฟล์แนบ (ไม่เกิน 10 MB)
          <input type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" capture="environment" onChange={(e) => selectFile(e.target.files?.[0])} className="mt-1 block w-full text-sm font-normal" />
        </label>
        {file && <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 sm:col-span-2">
          {previewUrl ? <Image src={previewUrl} alt={`ตัวอย่างไฟล์ ${file.name}`} width={80} height={80} unoptimized className="h-20 w-20 rounded-lg object-cover" />
            : <div className="grid h-20 w-20 place-items-center rounded-lg bg-slate-200 text-xs font-bold text-slate-600">{file.type === 'application/pdf' ? 'PDF' : 'ไฟล์'}</div>}
          <div className="min-w-0"><p className="truncate text-sm font-bold">{file.name}</p><p className="text-xs text-slate-500">{(file.size / 1024).toLocaleString('th-TH', { maximumFractionDigits: 1 })} KB</p></div>
        </div>}
        {pending && progress !== undefined && <div aria-live="polite" className="sm:col-span-2"><div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-indigo-600" style={{ width: `${progress}%` }} /></div><p className="mt-1 text-xs">กำลังอัปโหลด {progress}%</p></div>}
        <div className="flex justify-end gap-2 sm:col-span-2"><button type="button" disabled={pending} onClick={onClose} className="rounded-xl border px-4 py-2 font-bold">ยกเลิก</button>
          <button type="submit" disabled={pending} className="rounded-xl bg-indigo-600 px-5 py-2 font-bold text-white disabled:opacity-50">{pending ? 'กำลังบันทึก...' : 'บันทึก'}</button></div>
      </form>
    </section>
  </div>;
}
