'use client';
import Image from 'next/image';
import { Trash2, UploadCloud } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ShopOrder, ShopOrderInput } from '@/lib/shop-order/types';
import { CustomDatePicker } from './CustomDatePicker';
import { CustomSelect } from './CustomSelect';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

import { Alert, AlertDescription } from "@/components/ui/alert";

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
  error?: string;
  onClose: () => void;
  onSubmit: (value: { order: ShopOrderInput; file?: File; repairFile?: File }) => void;
}

interface AttachmentFieldProps {
  label: string;
  inputLabel: string;
  file?: File;
  pending: boolean;
  onFileChange: (file?: File) => void;
}

function AttachmentField({
  label,
  inputLabel,
  file,
  pending,
  onFileChange,
}: AttachmentFieldProps) {
  const [previewUrl, setPreviewUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const selectFile = (nextFile?: File) => {
    const nextPreviewUrl = nextFile?.type.startsWith('image/')
      ? URL.createObjectURL(nextFile)
      : '';
    setPreviewUrl(nextPreviewUrl);
    onFileChange(nextFile);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="text-sm font-bold sm:col-span-2">
      <span>{label} (ไม่เกิน 10 MB)</span>
      {!file ? (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setIsDragging(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            selectFile(event.dataTransfer.files?.[0]);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={isDragging
            ? 'group mt-1 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-indigo-500 bg-indigo-50/80 p-6 text-center shadow-md ring-4 ring-indigo-500/10 transition-all'
            : 'group mt-1 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/80 p-6 text-center transition-all hover:border-indigo-400 hover:bg-indigo-50/30'}
        >
          <label className="sr-only">
            {label}
            <input
              ref={fileInputRef}
              aria-label={inputLabel}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              capture="environment"
              onChange={(event) => selectFile(event.target.files?.[0])}
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
            aria-label={inputLabel}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.pdf"
            capture="environment"
            onChange={(event) => selectFile(event.target.files?.[0])}
            className="sr-only"
          />
          <div className="flex min-w-0 items-center gap-3">
            {previewUrl ? (
              <Image
                src={previewUrl}
                alt={'ตัวอย่างไฟล์ ' + file.name}
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
              <p className="truncate text-sm font-bold text-slate-800">{file.name}</p>
              <p className="text-xs text-slate-500">
                {(file.size / 1024).toLocaleString('th-TH', {
                  maximumFractionDigits: 1,
                })}{' '}
                KB
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => selectFile(undefined)}
            className="text-rose-700 hover:text-rose-800 hover:bg-rose-50 border-rose-200"
            aria-label={label === 'ไฟล์แนบ' ? 'ลบไฟล์' : 'ลบ' + label}
          >
            <Trash2 className="h-4 w-4 mr-1.5 text-rose-600" />
            <span>ลบไฟล์</span>
          </Button>
        </div>
      )}
    </div>
  );
}
export function OrderFormDialog({
  mode,
  order,
  departments,
  receivers,
  pending,
  progress,
  error,
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
          note: order.note ?? '',
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
  const [repairFile, setRepairFile] = useState<File>();

  const set = (patch: Partial<ShopOrderInput>) =>
    setValue((current) => ({ ...current, ...patch }));

  return (
    <Dialog open={true} onOpenChange={(open) => !open && !pending && onClose()}>
      <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-black">
            {mode === 'create' ? 'เพิ่ม Shop Order' : `แก้ไขรายการ ${order?.no}`}
          </DialogTitle>
          <DialogDescription className="sr-only">Order form</DialogDescription>
        </DialogHeader>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription className="font-bold">{error}</AlertDescription>
          </Alert>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({ order: value, file, repairFile });
          }}
          className="grid gap-4 sm:grid-cols-2"
        >
          <Label className="font-bold flex flex-col gap-2">
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
          </Label>
          <Label className="font-bold flex flex-col gap-2">
            เลขที่
            <Input
              required
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              value={value.number}
              onChange={(e) =>
                set({ number: e.target.value.replace(/\D/g, '').slice(0, 6) })
              }
              className="font-mono font-normal rounded-xl h-10"
            />
          </Label>
          <Label className="font-bold flex flex-col gap-2">
            วันที่รับ
            <CustomDatePicker
              required={mode === 'create'}
              value={value.dateIn}
              onChange={(val) => set({ dateIn: val })}
              placeholder="เลือกวันที่รับ"
              disabled={pending}
            />
          </Label>
          <Label className="font-bold flex flex-col gap-2">
            วันที่ออก
            <CustomDatePicker
              required={mode === 'create'}
              value={value.dateOut}
              onChange={(val) => set({ dateOut: val })}
              placeholder="เลือกวันที่ออก"
              disabled={pending}
            />
          </Label>
          <Label className="font-bold sm:col-span-2 flex flex-col gap-2">
            เรื่อง
            <Input
              required
              value={value.subject}
              onChange={(e) => set({ subject: e.target.value })}
              className="font-normal rounded-xl h-10"
            />
          </Label>
          <Label className="font-bold flex flex-col gap-2">
            หน่วยงานรับ
            <CustomSelect
              required={mode === 'create'}
              value={value.receivingUnit}
              options={departments}
              placeholder="เลือกหรือพิมพ์หน่วยงานรับ"
              onChange={(val) => set({ receivingUnit: val })}
              disabled={pending}
              allowCustom
            />
          </Label>
          <Label className="font-bold flex flex-col gap-2">
            ผู้รับ
            <CustomSelect
              required={mode === 'create'}
              value={value.receiverName}
              options={receivers}
              placeholder="เลือกหรือพิมพ์ผู้รับ"
              onChange={(val) => set({ receiverName: val })}
              disabled={pending}
              allowCustom
            />
          </Label>
          <Label className="font-bold sm:col-span-2 flex flex-col gap-2">
            หมายเหตุ
            <Textarea
              rows={3}
              value={value.note}
              onChange={(e) => set({ note: e.target.value })}
              className="font-normal rounded-xl"
            />
          </Label>
          <AttachmentField
            label="ไฟล์แนบ"
            inputLabel="ไฟล์แนบ"
            file={file}
            pending={pending}
            onFileChange={setFile}
          />
          <AttachmentField
            label="Pic แจ้งซ่อม"
            inputLabel="repair attachment"
            file={repairFile}
            pending={pending}
            onFileChange={setRepairFile}
          />
          {pending && progress !== undefined && (
            <div aria-live="polite" className="sm:col-span-2">
              <Progress value={progress} className="h-2" />
              <p className="mt-1 text-xs">กำลังอัปโหลด {progress}%</p>
            </div>
          )}
          <DialogFooter className="sm:col-span-2 mt-4">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={onClose}
              className="font-bold"
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              disabled={pending}
              className="bg-indigo-600 font-bold text-white hover:bg-indigo-700"
            >
              {pending ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
