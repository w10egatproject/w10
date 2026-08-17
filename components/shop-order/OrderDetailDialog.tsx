'use client';
import { useState } from 'react';
import { driveFilePreviewUrlFromCanonicalUrl } from '@/lib/shop-order/attachment-lifecycle';
import { formatThaiDate, getOrderStatus } from '@/lib/shop-order/domain';
import type { ShopOrder } from '@/lib/shop-order/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function AttachmentPreview({
  order,
  fileUrl,
  slot,
  label,
}: {
  order: ShopOrder;
  fileUrl: string;
  slot: 'primary' | 'repair';
  label: string;
}) {
  const [previewSource, setPreviewSource] = useState<'proxy' | 'direct' | 'failed'>('proxy');
  const directPreviewUrl = driveFilePreviewUrlFromCanonicalUrl(fileUrl);

  if (!fileUrl) {
    return (
      <div className="flex h-32 w-full flex-col items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-center">
        <span className="text-xs font-bold text-slate-400">ไม่พบรูปตัวอย่าง</span>
      </div>
    );
  }

  const thumbnailUrl =
    '/api/shop-order/attachment-thumbnail?no=' +
    order.no +
    (slot === 'repair' ? '&slot=repair' : '');

  return (
    <div className="flex h-44 w-full items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-slate-50 p-2">
      {previewSource === 'failed' ? (
        <div className="flex h-full w-full items-center justify-center rounded-lg bg-slate-100 text-center text-xs font-bold text-slate-500">
          ไม่พบรูปตัวอย่าง
        </div>
      ) : (
        // The authenticated, no-store proxy must be requested directly.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewSource === 'proxy' ? thumbnailUrl : directPreviewUrl ?? ''}
          alt={slot === 'repair' ? 'ตัวอย่างไฟล์แนบรายการ ' + order.no + ' ' + label : 'ตัวอย่างไฟล์แนบรายการ ' + order.no}
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
    <Dialog open={true} onOpenChange={(open) => !open && !pending && onClose()}>
      <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-black flex items-center gap-2">
            รายละเอียด Shop Order #{order.no}
            {getOrderStatus(order) === 'done' ? (
              <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-none">เสร็จสิ้น</Badge>
            ) : (
              <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-none">รอดำเนินการ</Badge>
            )}
          </DialogTitle>
          <DialogDescription className="sr-only">Order details for {order.no}</DialogDescription>
        </DialogHeader>

        <div className="mt-5 flex flex-col gap-6 sm:flex-row">
          <div className="w-full shrink-0 sm:w-64">
            <dt className="mb-2 text-xs font-bold text-slate-500">ไฟล์แนบ</dt>
            <dd className="grid gap-3">
              {[
                {
                  slot: 'primary' as const,
                  label: 'Pic',
                  fileUrl: order.fileUrl,
                },
                {
                  slot: 'repair' as const,
                  label: 'Pic แจ้งซ่อม',
                  fileUrl: order.repairFileUrl,
                },
              ].filter(({ fileUrl }) => fileUrl).length === 0 ? (
                <AttachmentPreview
                  order={order}
                  fileUrl=""
                  slot="primary"
                  label="Pic"
                />
              ) : (
                [
                  {
                    slot: 'primary' as const,
                    label: 'Pic',
                    fileUrl: order.fileUrl,
                  },
                  {
                    slot: 'repair' as const,
                    label: 'Pic แจ้งซ่อม',
                    fileUrl: order.repairFileUrl,
                  },
                ]
                  .filter(({ fileUrl }) => fileUrl)
                  .map((attachment) => (
                    <div key={attachment.slot}>
                      <p className="mb-1 text-[11px] font-bold text-slate-500">
                        {attachment.label}
                      </p>
                      <AttachmentPreview order={order} {...attachment} />
                    </div>
                  ))
              )}
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

        <DialogFooter className="mt-5 flex justify-end gap-2 sm:justify-end">
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() => setConfirming(true)}
            className="font-bold"
          >
            ลบรายการ
          </Button>
          <Button
            disabled={pending}
            onClick={onEdit}
            className="bg-indigo-600 font-bold text-white hover:bg-indigo-700"
          >
            แก้ไข
          </Button>
        </DialogFooter>

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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirming(false)}
              >
                ยกเลิก
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={pending}
                onClick={onDelete}
              >
                ยืนยันลบ
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
