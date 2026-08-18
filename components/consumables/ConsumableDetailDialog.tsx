'use client';

import Image from 'next/image';
import { Edit, ExternalLink, Trash2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import type { ConsumableItem } from '@/lib/consumables/types';
import { getDriveImageThumbnailUrl, getDriveThumbnailFallbackUrl } from '@/lib/utils/drive-images';

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
  const [imgSrc, setImgSrc] = useState<string | null>(null);

  if (!isOpen || !item) return null;

  const initialImgUrl = getDriveImageThumbnailUrl(item.picUrl) || item.picUrl || null;
  const currentImgSrc = imgSrc ?? initialImgUrl;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-xl p-0 overflow-hidden rounded-2xl" aria-describedby="consumable-detail-description">
          <DialogDescription id="consumable-detail-description" className="sr-only">
            รายละเอียด Consumable #{item.no}
          </DialogDescription>
          {/* Top Header */}
          <DialogHeader className="border-b border-slate-100 p-6 pb-4">
            <div className="flex flex-col items-start text-left">
              <DialogTitle className="text-lg font-extrabold text-slate-900">
                รายละเอียด Consumable #{item.no}
              </DialogTitle>
              <Badge variant="secondary" className="mt-1 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                Consumable
              </Badge>
            </div>
          </DialogHeader>

          {/* Body Content */}
          <div className="p-6 pt-2 max-h-[60vh] overflow-y-auto">
            <div className="flex flex-col gap-6 sm:flex-row">
              {/* Left Photo Preview */}
              <div className="w-full sm:w-44 shrink-0">
                <div className="mb-1 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  📷 PIC รูปภาพ
                </div>
                <div
                  onClick={() => {
                    if (currentImgSrc) setShowLightbox(true);
                  }}
                  className={`relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 ${
                    currentImgSrc ? 'cursor-pointer hover:opacity-90' : ''
                  }`}
                >
                  {currentImgSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={currentImgSrc}
                      alt="pic full preview"
                      className="h-full w-full object-cover"
                      onError={() => {
                        const fallback = getDriveThumbnailFallbackUrl(item.picUrl);
                        if (fallback && currentImgSrc !== fallback) {
                          setImgSrc(fallback);
                        } else {
                          setImgSrc(null);
                        }
                      }}
                    />
                  ) : (
                    <span className="text-xs font-medium text-slate-400">
                      ไม่พบรูปตัวอย่าง
                    </span>
                  )}
                </div>
                {item.picUrl && (
                  <div className="mt-1.5 flex flex-col items-center gap-1">
                    {currentImgSrc && (
                      <p className="text-center text-xs font-semibold text-emerald-600">
                        กดเพื่อดูภาพเต็ม
                      </p>
                    )}
                    <a
                      href={item.picUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:underline"
                    >
                      <ExternalLink size={12} /> เปิดไฟล์ใน Google Drive
                    </a>
                  </div>
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
          <DialogFooter className="border-t border-slate-100 p-5 bg-slate-50/80 flex flex-row items-center justify-end sm:justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onDelete(item)}
              className="border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800 font-bold px-4"
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" /> ลบรายการ
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onEdit(item)}
              className="border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 font-bold px-4"
            >
              <Edit className="mr-1.5 h-3.5 w-3.5" /> แก้ไข
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lightbox Overlay */}
      {showLightbox && currentImgSrc && (
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
            src={currentImgSrc}
            alt="full resolution"
            className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
          />
        </div>
      )}
    </>
  );
}
