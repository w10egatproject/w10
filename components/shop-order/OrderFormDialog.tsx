'use client';
import Image from 'next/image';
import { Trash2, UploadCloud } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ShopOrder, ShopOrderInput } from '@/lib/shop-order/types';
import { CustomDatePicker } from './CustomDatePicker';
import { CustomSelect } from './CustomSelect';

function getTodayIso(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface Props {
  mode: 'create' | 'edit';
  order?: ShopOrder;
  departments: string[];
  receivers: string[];
  pending: boolean;
  progress?: number;
  onClose: () => void;
  onSubmit: (value: { order: ShopOrderInput; file?: File }) => void;
}

export function OrderFormDialog({
  mode,
  order,
  departments,
  receivers,
  pending,
  progress,
  onClose,
  onSubmit,
}: Props) {
  const today = getTodayIso();
  const [value, setValue] = useState<ShopOrderInput>(
    order
      ? {
          to: order.to,
          number: order.number,
          dateIn: order.dateIn,
          subject: order.subject,
          receivingUnit: order.receivingUnit,
          receiverName: order.receiverName,
          dateOut: order.dateOut,
          note: order.note,
        }
      : {
          to: '',
          number: '',
          dateIn: today,
          subject: '',
          receivingUnit: '',
          receiverName: '',
          dateOut: today,
          note: '',
        },
  );
  const [file, setFile] = useState<File>();
  const [previewUrl, setPreviewUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const previewUrlRef = useRef('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
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

  const removeFile = () => {
    selectFile(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const set = (patch: Partial<ShopOrderInput>) =>
    setValue((current) => ({ ...current, ...patch }));

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-3"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !pending) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-form-title"
        onKeyDown={(e) => {
          if (e.key === 'Escape' && !pending) onClose();
        }}
        className="max-h-[95vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="order-form-title" className="text-lg font-black">
            {mode === 'create' ? 'เพิ่ม Shop Order' : `แก้ไขรายการ ${order?.no}`}
          </h2>
          <button
            type="button"
            disabled={pending}
            onClick={onClose}
            aria-label="ปิด"
            className="rounded-lg px-3 py-1 text-xl hover:bg-slate-100"
          >
            ×
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({ order: value, file });
          }}
          className="grid gap-4 sm:grid-cols-2"
        >
          <label className="text-sm font-bold">
            ถึง
            <CustomSelect
              required
              value={value.to}
              options={departments}
              placeholder="เลือกหน่วยงาน"
              onChange={(val) => set({ to: val })}
              disabled={pending}
              allowCustom
            />
          </label>
          <label className="text-sm font-bold">
            เลขที่
            <input
              required
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              value={value.number}
              onChange={(e) =>
                set({ number: e.target.value.replace(/\D/g, '').slice(0, 6) })
              }
              className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 font-mono font-normal"
            />
          </label>
          <label className="text-sm font-bold">
            วันที่รับ
            <CustomDatePicker
              value={value.dateIn}
              onChange={(val) => set({ dateIn: val })}
              placeholder="เลือกวันที่รับ"
              disabled={pending}
            />
          </label>
          <label className="text-sm font-bold">
            วันที่ออก
            <CustomDatePicker
              value={value.dateOut}
              onChange={(val) => set({ dateOut: val })}
              placeholder="เลือกวันที่ออก"
              disabled={pending}
            />
          </label>
          <label className="text-sm font-bold sm:col-span-2">
            เรื่อง
            <input
              required
              value={value.subject}
              onChange={(e) => set({ subject: e.target.value })}
              className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 font-normal"
            />
          </label>
          <label className="text-sm font-bold">
            หน่วยงานรับ
            <CustomSelect
              value={value.receivingUnit}
              options={departments}
              placeholder="เลือกหรือพิมพ์หน่วยงานรับ"
              onChange={(val) => set({ receivingUnit: val })}
              disabled={pending}
              allowCustom
            />
          </label>
          <label className="text-sm font-bold">
            ผู้รับ
            <CustomSelect
              value={value.receiverName}
              options={receivers}
              placeholder="เลือกหรือพิมพ์ผู้รับ"
              onChange={(val) => set({ receiverName: val })}
              disabled={pending}
              allowCustom
            />
          </label>
          <label className="text-sm font-bold sm:col-span-2">
            หมายเหตุ
            <textarea
              rows={3}
              value={value.note}
              onChange={(e) => set({ note: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-300 p-3 font-normal"
            />
          </label>
          <div className="text-sm font-bold sm:col-span-2">
            <span>ไฟล์แนบ (ไม่เกิน 10 MB)</span>
            {!file ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const droppedFile = e.dataTransfer.files?.[0];
                  if (droppedFile) selectFile(droppedFile);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`group mt-1 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-indigo-500 bg-indigo-50/80 shadow-md ring-4 ring-indigo-500/10'
                    : 'border-slate-300 bg-slate-50/80 hover:border-indigo-400 hover:bg-indigo-50/30'
                }`}
              >
                <label className="sr-only">
                  ไฟล์แนบ (ไม่เกิน 10 MB)
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.pdf"
                    capture="environment"
                    onChange={(e) => selectFile(e.target.files?.[0])}
                    className="sr-only"
                  />
                </label>
                <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-indigo-100/80 text-indigo-600 transition-transform group-hover:scale-110">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <p className="text-sm font-bold text-slate-800">
                  คลิก หรือลากไฟล์มาวางที่นี่เพื่อเพิ่มไฟล์แนบ
                </p>
                <p className="mt-1 text-xs font-normal text-slate-500">
                  รองรับรูปภาพ (JPG, PNG, WEBP) หรือไฟล์ PDF (ขนาดไม่เกิน 10 MB)
                </p>
              </div>
            ) : (
              <div className="mt-1 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.pdf"
                  capture="environment"
                  onChange={(e) => selectFile(e.target.files?.[0])}
                  className="sr-only"
                />
                <div className="flex items-center gap-3 min-w-0">
                  {previewUrl ? (
                    <Image
                      src={previewUrl}
                      alt={`ตัวอย่างไฟล์ ${file.name}`}
                      width={80}
                      height={80}
                      unoptimized
                      className="h-20 w-20 rounded-lg border border-slate-200 object-cover"
                    />
                  ) : (
                    <div className="grid h-20 w-20 shrink-0 place-items-center rounded-lg bg-slate-200 text-xs font-bold text-slate-600">
                      {file.type === 'application/pdf' ? 'PDF' : 'ไฟล์'}
                    </div>
                  )}
                  <div className="min-w-0 font-normal">
                    <p className="truncate text-sm font-bold text-slate-800">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {(file.size / 1024).toLocaleString('th-TH', {
                        maximumFractionDigits: 1,
                      })}{' '}
                      KB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={pending}
                  onClick={removeFile}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-50 hover:border-rose-300 disabled:opacity-50"
                  aria-label="ลบไฟล์"
                >
                  <Trash2 className="h-4 w-4 text-rose-600" />
                  <span>ลบไฟล์</span>
                </button>
              </div>
            )}
          </div>
          {pending && progress !== undefined && (
            <div aria-live="polite" className="sm:col-span-2">
              <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full bg-indigo-600"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-1 text-xs">กำลังอัปโหลด {progress}%</p>
            </div>
          )}
          <div className="flex justify-end gap-2 sm:col-span-2">
            <button
              type="button"
              disabled={pending}
              onClick={onClose}
              className="rounded-xl border px-4 py-2 font-bold"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-xl bg-indigo-600 px-5 py-2 font-bold text-white disabled:opacity-50"
            >
              {pending ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
