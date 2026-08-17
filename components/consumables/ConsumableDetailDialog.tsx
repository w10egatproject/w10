'use client';

import Image from 'next/image';
import { Edit, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import type { ConsumableItem } from '@/lib/consumables/types';

interface Props {
  item: ConsumableItem | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (item: ConsumableItem) => void;
  onDelete: (item: ConsumableItem) => void;
}

export function ConsumableDetailDialog({
  item,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}: Props) {
  const [showLightbox, setShowLightbox] = useState(false);

  if (!isOpen || !item) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
        <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
          {/* Top Header */}
          <div className="flex items-center justify-between border-b border-slate-100 p-6">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                รายละเอียด Consumable #{item.no}
              </h2>
              <span className="mt-1 inline-block rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-bold text-emerald-800">
                Consumable
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6">
            <div className="flex flex-col gap-6 sm:flex-row">
              {/* Left Photo Preview */}
              <div className="w-full sm:w-44 shrink-0">
                <div className="mb-1 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  📷 PIC รูปภาพ
                </div>
                <div
                  onClick={() => {
                    if (item.picUrl) setShowLightbox(true);
                  }}
                  className={`relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 ${
                    item.picUrl ? 'cursor-pointer hover:opacity-90' : ''
                  }`}
                >
                  {item.picUrl ? (
                    <Image
                      src={item.picUrl}
                      alt="pic full preview"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-xs font-medium text-slate-400">
                      ไม่พบรูปตัวอย่าง
                    </span>
                  )}
                </div>
                {item.picUrl && (
                  <p className="mt-1.5 text-center text-xs font-semibold text-emerald-600">
                    กดเพื่อดูภาพเต็ม
                  </p>
                )}
              </div>

              {/* Right Fields Grid */}
              <div className="grid flex-1 grid-cols-2 gap-4">
                <div>
                  <div className="text-[11px] font-extrabold uppercase text-slate-400">
                    ลำดับ
                  </div>
                  <div className="mt-0.5 text-sm font-semibold text-slate-900">
                    {item.no}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-extrabold uppercase text-slate-400">
                    วันที่
                  </div>
                  <div className="mt-0.5 text-sm font-semibold text-slate-900">
                    {item.dateDisplay || '—'}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-[11px] font-extrabold uppercase text-slate-400">
                    รายการ
                  </div>
                  <div className="mt-0.5 text-sm font-bold text-slate-900">
                    {item.item || '—'}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-extrabold uppercase text-slate-400">
                    จำนวน
                  </div>
                  <div className="mt-0.5 text-sm font-black text-emerald-600">
                    {item.quantity} ชิ้น
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-extrabold uppercase text-slate-400">
                    ผู้รับ
                  </div>
                  <div className="mt-0.5 text-sm font-semibold text-slate-900">
                    {item.receiver || '—'}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-[11px] font-extrabold uppercase text-slate-400">
                    หมายเหตุ
                  </div>
                  <div className="mt-0.5 text-sm text-slate-700 whitespace-pre-wrap">
                    {item.note || '—'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 p-4">
            <button
              type="button"
              onClick={() => onDelete(item)}
              className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
            >
              <Trash2 className="h-3.5 w-3.5" /> ลบรายการ
            </button>
            <button
              type="button"
              onClick={() => onEdit(item)}
              className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition"
            >
              <Edit className="h-3.5 w-3.5" /> แก้ไข
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox Overlay */}
      {showLightbox && item.picUrl && (
        <div
          onClick={() => setShowLightbox(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md cursor-pointer"
        >
          <button
            type="button"
            onClick={() => setShowLightbox(false)}
            className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/40 transition"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={item.picUrl}
            alt="full resolution"
            className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
          />
        </div>
      )}
    </>
  );
}
