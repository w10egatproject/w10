'use client';
import { useState } from 'react';
import { driveFileDownloadUrlFromCanonicalUrl } from '@/lib/shop-order/attachment-lifecycle';
import { formatThaiDate, getOrderStatus } from '@/lib/shop-order/domain';
import type { ShopOrder } from '@/lib/shop-order/types';

function AttachmentPreview({ order }: { order: ShopOrder }) {
  const [previewSource, setPreviewSource] = useState<'proxy' | 'direct' | 'failed'>('proxy');
  const directPreviewUrl = driveFileDownloadUrlFromCanonicalUrl(order.fileUrl);

  if (!order.fileUrl) {
    return (
      <div className="flex h-44 w-full flex-col items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-center">
        <span className="text-xs font-bold text-slate-400">ไม่มีไฟล์แนบ</span>
      </div>
    );
  }

  return (
    <div className="flex h-44 w-full items-center justify-center rounded-xl bg-slate-50 border border-slate-100 p-2 overflow-hidden">
      {previewSource === 'failed' ? (
        <div className="flex h-full w-full items-center justify-center rounded-lg bg-slate-100 text-center text-xs font-bold text-slate-500">
          ไม่พบรูปตัวอย่าง
        </div>
      ) : (
        // The authenticated, no-store proxy must be requested directly.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={
            previewSource === 'proxy'
              ? `/api/shop-order/attachment-thumbnail?no=${order.no}`
              : directPreviewUrl ?? ''
          }
          alt={`ตัวอย่างไฟล์แนบรายการ ${order.no}`}
          className="h-full w-full rounded-lg object-contain"
          onError={() => {
            if (previewSource === 'proxy' && directPreviewUrl) {
              setPreviewSource('direct');
              return;
            }
            setPreviewSource('failed');
          }}
        />
      )}
    </div>
  );
}

export function OrderDetailDialog({
  order,
  pending,
  onClose,
  onEdit,
  onDelete,
}: {
  order: ShopOrder;
  pending: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const rows = [
    ['ลำดับ', order.no],
    ['จาก', order.from],
    ['ถึง', order.to],
    ['เลขที่', order.number],
    ['วันที่รับ', formatThaiDate(order.dateIn) || '—'],
    ['เรื่อง', order.subject],
    ['หน่วยงานรับ', order.receivingUnit || '—'],
    ['ผู้รับ', order.receiverName || '—'],
    ['วันที่ออก', formatThaiDate(order.dateOut) || '—'],
    ['หมายเหตุ', order.note || '—'],
  ];

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-3">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-detail-title"
        onKeyDown={(e) => {
          if (e.key === 'Escape' && !pending) onClose();
        }}
        className="max-h-[95vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl"
      >
        <div className="flex justify-between">
          <div>
            <h2 id="order-detail-title" className="text-lg font-black">
              รายละเอียด Shop Order #{order.no}
            </h2>
            <span
              className={`mt-1 inline-block rounded-full px-2 py-1 text-xs font-bold ${
                getOrderStatus(order) === 'done'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {getOrderStatus(order) === 'done' ? 'เสร็จสิ้น' : 'รอดำเนินการ'}
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="ปิด"
            className="h-9 w-9 rounded-lg text-xl hover:bg-slate-100"
          >
            ×
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-6 sm:flex-row">
          {/* Left Side: Uploaded Image Preview */}
          <div className="w-full sm:w-48 shrink-0">
            <dt className="mb-2 text-xs font-bold text-slate-500">ไฟล์</dt>
            <dd>
              <AttachmentPreview
                key={`${order.no}:${order.fileUrl}`}
                order={order}
              />
            </dd>
          </div>

          {/* Right Side: Order Detail Fields */}
          <dl className="grid flex-1 gap-x-4 sm:grid-cols-2">
            {rows.map(([label, value]) => (
              <div key={String(label)} className="border-b border-slate-100 py-2">
                <dt className="text-xs font-bold text-slate-500">{label}</dt>
                <dd className="mt-1 break-words text-sm">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            disabled={pending}
            onClick={() => setConfirming(true)}
            className="rounded-xl border border-rose-300 px-4 py-2 font-bold text-rose-700 hover:bg-rose-50"
          >
            ลบรายการ
          </button>
          <button
            disabled={pending}
            onClick={onEdit}
            className="rounded-xl bg-indigo-600 px-4 py-2 font-bold text-white hover:bg-indigo-700"
          >
            แก้ไข
          </button>
        </div>

        {confirming && (
          <div
            role="alertdialog"
            aria-modal="true"
            aria-label="ยืนยันลบรายการ"
            className="mt-4 rounded-xl bg-rose-50 p-4"
          >
            <p className="font-bold text-rose-900">
              ยืนยันลบรายการ #{order.no}?
            </p>
            <p className="mt-1 text-sm text-rose-800">
              ไฟล์แนบที่ระบบ OAuth จัดการจะถูกตั้งเวลาย้ายเข้าถังขยะ Google Drive
              หลัง 30 วัน ส่วนไฟล์เดิม (Legacy) จะไม่ถูกจัดการ
            </p>
            <div className="mt-3 flex justify-end gap-2">
              <button
                onClick={() => setConfirming(false)}
                className="rounded-lg border px-3 py-1.5"
              >
                ยกเลิก
              </button>
              <button
                disabled={pending}
                onClick={onDelete}
                className="rounded-lg bg-rose-700 px-3 py-1.5 font-bold text-white"
              >
                ยืนยันลบ
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
