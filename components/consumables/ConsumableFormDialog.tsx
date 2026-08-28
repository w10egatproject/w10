'use client';

import { Camera, Paperclip, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import type { ConsumableInput, ConsumableItem } from '@/lib/consumables/types';
import { formatThaiDate, normalizeDate } from '@/lib/consumables/domain';

interface Props {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialItem?: ConsumableItem | null;
  receivers: string[];
  pending: boolean;
  onClose: () => void;
  onSubmit: (data: {
    input: ConsumableInput;
    file?: File;
    existingPicUrl?: string;
  }) => Promise<void>;
}

export function ConsumableFormDialog({
  isOpen,
  mode,
  initialItem,
  receivers,
  pending,
  onClose,
  onSubmit,
}: Props) {
  const [date, setDate] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [item, setItem] = useState('');
  const [receiver, setReceiver] = useState('');
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | undefined>();
  const [previewUrl, setPreviewUrl] = useState<string | undefined>();
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && initialItem) {
        setDate(initialItem.date || '');
        setQuantity(initialItem.quantity || 1);
        setItem(initialItem.item || '');
        setReceiver(initialItem.receiver || '');
        setNote(initialItem.note || '');
        setPreviewUrl(initialItem.picUrl || undefined);
      } else {
        const todayStr = new Date().toISOString().split('T')[0];
        setDate(todayStr);
        setQuantity(1);
        setItem('');
        setReceiver('');
        setNote('');
        setFile(undefined);
        setPreviewUrl(undefined);
      }
      setErrorMsg('');
    }
  }, [isOpen, mode, initialItem]);

  if (!isOpen) return null;

  const thaiDatePreview = (() => {
    if (!date) return 'แสดงเป็น พ.ศ.: -';
    const parsed = normalizeDate(date);
    return parsed ? `แสดงเป็น พ.ศ.: ${formatThaiDate(parsed)}` : 'แสดงเป็น พ.ศ.: -';
  })();

  const handleFileChange = (selectedFile?: File) => {
    if (!selectedFile) return;
    if (selectedFile.size > 10 * 1024 * 1024) {
      setErrorMsg('ไฟล์ต้องมีขนาดไม่เกิน 10 MB');
      return;
    }
    setErrorMsg('');
    setFile(selectedFile);

    if (selectedFile.type.startsWith('image/')) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(undefined);
    }
  };

  const handleClearFile = () => {
    setFile(undefined);
    setPreviewUrl(undefined);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!item.trim()) {
      setErrorMsg('กรุณากรอก "รายการ"');
      return;
    }

    setErrorMsg('');
    try {
      await onSubmit({
        input: {
          date: date || null,
          item: item.trim(),
          quantity: Number(quantity) || 0,
          receiver: receiver.trim(),
          note: note.trim(),
        },
        file,
        existingPicUrl: initialItem?.picUrl,
      });
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'บันทึกข้อมูลไม่สำเร็จ');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !pending && onClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden" aria-describedby="consumable-form-description">
        <DialogDescription id="consumable-form-description" className="sr-only">
          {mode === 'edit' ? 'ฟอร์มแก้ไขรายการ' : 'ฟอร์มเพิ่มรายการ'}
        </DialogDescription>
        <DialogHeader className="border-b border-slate-100 p-6 pb-4">
          <DialogTitle className="text-lg font-bold text-slate-900 text-left">
            {mode === 'edit' ? '✏️ แก้ไขรายการ Consumable' : '📦 เพิ่มรายการ Consumable'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 pb-6 pt-2 space-y-4 text-sm max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-2 block font-bold text-slate-700">วันที่</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-10 rounded-xl border-slate-300 focus-visible:ring-emerald-500"
              />
              <small className="mt-1 block text-[11px] font-semibold text-emerald-600">
                {thaiDatePreview}
              </small>
            </div>
            <div>
              <Label className="mb-2 block font-bold text-slate-700">จำนวน</Label>
              <Input
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                placeholder="จำนวนชิ้น"
                className="h-10 rounded-xl border-slate-300 focus-visible:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <Label className="mb-2 block font-bold text-slate-700">
              รายการ <span className="text-rose-500">*</span>
            </Label>
            <Input
              type="text"
              required
              value={item}
              onChange={(e) => setItem(e.target.value)}
              placeholder="เช่น ปากกาเคมีสีแดง"
              className="h-10 rounded-xl border-slate-300 focus-visible:ring-emerald-500"
            />
          </div>

          <div>
            <Label className="mb-2 block font-bold text-slate-700">ผู้รับ</Label>
            <Input
              type="text"
              list="consumableReceiverList"
              value={receiver}
              onChange={(e) => setReceiver(e.target.value)}
              placeholder="ชื่อผู้รับ หรือเลือกจากรายการ"
              className="h-10 rounded-xl border-slate-300 focus-visible:ring-emerald-500"
            />
            <datalist id="consumableReceiverList">
              {receivers.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>

          <div>
            <Label className="mb-2 block font-bold text-slate-700">
              หมายเหตุ <span className="font-normal text-slate-400">(ไม่บังคับ)</span>
            </Label>
            <Textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="รายละเอียดเพิ่มเติม..."
              className="rounded-xl border-slate-300 focus-visible:ring-emerald-500 resize-y"
            />
          </div>

          {/* Photo Section */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-2 font-bold text-slate-700">📷 PIC รูปภาพ</div>
            <div className="flex flex-wrap gap-2">
              <label className="flex h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700">
                <Camera className="h-4 w-4" /> ถ่ายรูป
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handleFileChange(e.target.files?.[0])}
                />
              </label>
              <label className="flex h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700">
                <Paperclip className="h-4 w-4" /> เลือกไฟล์
                <input
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                  className="hidden"
                  onChange={(e) => handleFileChange(e.target.files?.[0])}
                />
              </label>
            </div>

            {previewUrl && (
              <div className="relative mt-3 inline-block max-w-[200px]">
                <img
                  src={previewUrl}
                  alt="preview"
                  className="max-h-36 w-full rounded-xl border border-slate-200 object-cover"
                />
                <button
                  type="button"
                  onClick={handleClearFile}
                  className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-rose-600 text-white shadow-md hover:bg-rose-700"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            {file && <p className="mt-1 text-xs text-slate-500">{file.name}</p>}
          </div>

          {errorMsg && (
            <div className="text-xs font-bold text-rose-600">{errorMsg}</div>
          )}

          <DialogFooter className="gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={onClose}
              className="rounded-xl border-slate-300 font-bold text-slate-700"
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              disabled={pending}
              className="rounded-xl bg-emerald-600 font-bold text-white hover:bg-emerald-700"
            >
              {pending ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
