'use client';

import Image from 'next/image';
import { CheckCircle, ClipboardList, RefreshCw, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import NavigationMenu from '@/components/navigation/NavigationMenu';
import { filterAndSortOrders, getOrderStatus, paginateOrders, summarizeOrders } from '@/lib/shop-order/domain';
import { inspectLocalFile } from '@/lib/shop-order/file-rules';
import { uploadToDriveSession } from '@/lib/shop-order/upload-client';
import type { ApiResult, ShopOrder, ShopOrderBootstrap, ShopOrderFilters, ShopOrderInput, ShopOrderMutationResult, UploadSession } from '@/lib/shop-order/types';
import { OrderDetailDialog } from './OrderDetailDialog';
import { OrderFormDialog } from './OrderFormDialog';
import { ShopOrderSummary } from './ShopOrderSummary';
import { ShopOrderTable } from './ShopOrderTable';
import { ShopOrderToolbar } from './ShopOrderToolbar';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BlurFade } from "@/components/magicui/blur-fade";
import { SplitText } from "@/components/reactbits/split-text";

const EMPTY_FILTERS: ShopOrderFilters = { query: '', year: 'all', month: 'all', status: 'all' };

export function ShopOrderDashboard() {
  const [data, setData] = useState<ShopOrderBootstrap | null>(null);
  const [filters, setFilters] = useState<ShopOrderFilters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<ShopOrder | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
  const [mutationPending, setMutationPending] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>();
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [attachmentWarning, setAttachmentWarning] = useState<{
    message: string;
    order: ShopOrder;
  } | null>(null);

  const loadData = useCallback(async () => {
    setError('');
    try {
      const response = await fetch('/api/shop-order', { cache: 'no-store' });
      const result = await response.json() as ApiResult<ShopOrderBootstrap>;
      if (!response.ok || !result.ok) throw new Error(result.ok ? '' : result.error.message);
      setData(result.data);
    } catch {
      setError('ไม่สามารถโหลดข้อมูล Shop Order ได้ กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadData(), 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);
  const periodFiltered = useMemo(() => {
    return (data?.orders ?? []).filter((o) => {
      if (filters.year !== 'all' && o.dateIn && String(Number(o.dateIn.slice(0, 4)) + 543) !== filters.year) return false;
      if (filters.month !== 'all' && o.dateIn && String(Number(o.dateIn.slice(5, 7))) !== filters.month) return false;
      return true;
    });
  }, [data, filters.year, filters.month]);

  const periodSummary = useMemo(() => summarizeOrders(periodFiltered), [periodFiltered]);
  const baseFiltered = useMemo(() => filterAndSortOrders(data?.orders ?? [], { ...filters, status: 'all' }), [data, filters]);
  const filteredSummary = useMemo(() => summarizeOrders(baseFiltered), [baseFiltered]);

  const summary = useMemo(() => ({
    ...filteredSummary,
    popularUnits: periodSummary.popularUnits,
    popularReceivers: periodSummary.popularReceivers,
  }), [filteredSummary, periodSummary]);

  const filtered = useMemo(() => filters.status === 'all' ? baseFiltered : baseFiltered.filter((o) => getOrderStatus(o) === filters.status), [baseFiltered, filters.status]);
  const pagination = useMemo(() => paginateOrders(filtered, page, 12), [filtered, page]);
  const years = useMemo(() => Array.from(new Set((data?.orders ?? []).flatMap((o) => o.dateIn ? [String(Number(o.dateIn.slice(0, 4)) + 543)] : []))).sort().reverse(), [data]);

  const updateFilters = (next: ShopOrderFilters) => { setFilters(next); setPage(1); };

  const requestJson = async <T,>(url: string, init: RequestInit): Promise<T> => {
    const response = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json', ...init.headers } });
    const result = await response.json() as ApiResult<T>;
    if (!response.ok || !result.ok) throw new Error(result.ok ? 'ดำเนินการไม่สำเร็จ' : result.error.message);
    return result.data;
  };

  const uploadAttachment = async (
    file: File | undefined,
    orderNumber: string,
  ): Promise<{ fileId?: string; failed: boolean }> => {
    if (!file) return { failed: false };

    const metadata = await inspectLocalFile(file);
    try {
      const session = await requestJson<UploadSession>(
        '/api/shop-order/upload-session',
        {
          method: 'POST',
          body: JSON.stringify({ orderNumber, ...metadata }),
        },
      );
      setUploadProgress(0);
      await uploadToDriveSession(file, session, setUploadProgress);
      return { fileId: session.fileId, failed: false };
    } catch {
      setUploadProgress(undefined);
      return { failed: true };
    }
  };

  const saveOrder = async ({
    order,
    file,
    repairFile,
  }: {
    order: ShopOrderInput;
    file?: File;
    repairFile?: File;
  }) => {
    setMutationPending(true);
    setError('');
    setAttachmentWarning(null);
    try {
      const primaryUpload = await uploadAttachment(file, order.number);
      const repairUpload = await uploadAttachment(repairFile, order.number);
      const mutation = await requestJson<ShopOrderMutationResult>(
        '/api/shop-order',
        {
          method: formMode === 'edit' ? 'PATCH' : 'POST',
          body: JSON.stringify({
            ...(formMode === 'edit' && selected ? { no: selected.no } : {}),
            order,
            ...(primaryUpload.fileId
              ? { uploadedFileId: primaryUpload.fileId }
              : {}),
            ...(repairUpload.fileId
              ? { repairUploadedFileId: repairUpload.fileId }
              : {}),
          }),
        },
      );
      const attachmentFailed =
        primaryUpload.failed ||
        repairUpload.failed ||
        mutation.attachment.status === 'order_saved_without_attachment' ||
        mutation.repairAttachment?.status === 'order_saved_without_attachment';
      setFormMode(null);
      setSelected(null);
      setUploadProgress(undefined);
      await loadData();
      if (attachmentFailed) {
        setAttachmentWarning({
          message:
            'บันทึกออเดอร์แล้ว แต่แนบไฟล์ไม่สำเร็จ กรุณาเพิ่มไฟล์อีกครั้ง',
          order: mutation.order,
        });
      } else {
        setShowSaveSuccess(true);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'บันทึกรายการไม่สำเร็จ');
    } finally {
      setMutationPending(false);
    }
  };
  const deleteOrder = async () => {
    if (!selected) return;
    setMutationPending(true); setError('');
    try {
      await requestJson('/api/shop-order', { method: 'DELETE', body: JSON.stringify({ no: selected.no }) });
      setSelected(null);
      await loadData();
      setShowDeleteSuccess(true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'ลบรายการไม่สำเร็จ'); }
    finally { setMutationPending(false); }
  };

  return (
    <BlurFade delay={0.1}>
    <main className="min-h-screen bg-slate-200 p-3 text-slate-800 md:p-6">
      <header className="sticky top-0 z-30 mb-4 flex flex-col gap-3 rounded-2xl border-b-4 border-amber-300 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Image src="/picture/egat.png" alt="การไฟฟ้าฝ่ายผลิตแห่งประเทศไทย" width={48} height={48} priority />
          <div>
            <div className="flex items-center gap-2">
              <SplitText text="Shop Order" className="text-xl font-black md:text-2xl" />
              <ClipboardList className="h-6 w-6 text-indigo-600" />
            </div>
            <p className="text-xs font-bold text-slate-500">ระบบติดตามหนังสือสั่งการ · W10</p>
          </div>
        </div>
        <NavigationMenu buttonClassName="bg-amber-300 text-slate-900 hover:bg-amber-400" accentClassName="text-indigo-600" />
      </header>

      <ShopOrderToolbar filters={filters} years={years} loading={loading} onChange={updateFilters} onRefresh={() => void loadData()} onAdd={() => { setSelected(null); setFormMode('create'); }} />
      {error && (
        <Alert variant="destructive" className="mb-4 flex items-center justify-between">
          <AlertDescription className="font-bold">{error}</AlertDescription>
          <button onClick={() => { setLoading(true); void loadData(); }} className="flex items-center gap-1 rounded-lg border border-rose-300 px-3 py-1.5"><RefreshCw className="h-4 w-4" /> ลองใหม่</button>
        </Alert>
      )}
      {attachmentWarning && <div role="status" className="mb-4 flex flex-col gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm font-bold text-amber-900 sm:flex-row sm:items-center sm:justify-between">
        <span>{attachmentWarning.message}</span>
        <button type="button" onClick={() => { setSelected(attachmentWarning.order); setFormMode('edit'); setAttachmentWarning(null); }} className="rounded-lg border border-amber-400 bg-white px-3 py-1.5">เพิ่มไฟล์อีกครั้ง</button>
      </div>}
      <div data-testid="shop-order-layout" className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-stretch">
        <section className="min-w-0 flex flex-col h-full">
          <ShopOrderTable
            orders={pagination.items}
            page={pagination.page}
            pageSize={pagination.pageSize}
            totalPages={pagination.totalPages}
            total={pagination.total}
            onPage={setPage}
            onSelect={setSelected}
          />
        </section>
        <ShopOrderSummary
          summary={summary}
          loading={loading}
          activeStatus={filters.status}
          onStatusSelect={(status) => updateFilters({ ...filters, status })}
          selectedQuery={filters.query}
          onQuerySelect={(query) => {
            if (
              filters.query &&
              filters.query.trim().toLowerCase() === query.trim().toLowerCase()
            ) {
              updateFilters({ ...filters, query: '' });
            } else {
              updateFilters({ ...filters, query });
            }
          }}
        />
      </div>
      {data && <p className="mt-4 text-right text-xs text-slate-500">อัปเดตล่าสุด {new Date(data.generatedAt).toLocaleString('th-TH')}</p>}
      {selected && !formMode && <OrderDetailDialog order={selected} pending={mutationPending} onClose={() => setSelected(null)} onEdit={() => setFormMode('edit')} onDelete={() => void deleteOrder()} />}
      {formMode && data && <OrderFormDialog mode={formMode} order={formMode === 'edit' ? selected ?? undefined : undefined} departments={data.departments} receivers={data.receivers} pending={mutationPending} progress={uploadProgress} error={error} onClose={() => { if (!mutationPending) setFormMode(null); }} onSubmit={(value) => void saveOrder(value)} />}

      {/* Save Success Modal */}
      {showSaveSuccess && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4 animate-in fade-in-50 duration-150"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowSaveSuccess(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="save-success-title"
            onKeyDown={(e) => {
              if (e.key === 'Escape') setShowSaveSuccess(false);
            }}
            className="flex w-full max-w-sm flex-col items-center rounded-2xl bg-white p-6 text-center shadow-2xl animate-in zoom-in-95 duration-150"
          >
            <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600 shadow-inner">
              <CheckCircle className="h-10 w-10 text-emerald-600" />
            </div>
            <h3
              id="save-success-title"
              className="text-lg font-black text-slate-800"
            >
              บันทึกข้อมูลสำเร็จ!
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              รายการ Shop Order ถูกบันทึกข้อมูลเรียบร้อยแล้ว
            </p>
            <button
              type="button"
              onClick={() => setShowSaveSuccess(false)}
              className="mt-5 w-full rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-emerald-700 transition-colors"
            >
              ตกลง
            </button>
          </div>
        </div>
      )}

      {/* Delete Success Modal */}
      {showDeleteSuccess && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4 animate-in fade-in-50 duration-150"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowDeleteSuccess(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-success-title"
            onKeyDown={(e) => {
              if (e.key === 'Escape') setShowDeleteSuccess(false);
            }}
            className="flex w-full max-w-sm flex-col items-center rounded-2xl bg-white p-6 text-center shadow-2xl animate-in zoom-in-95 duration-150"
          >
            <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-rose-100 text-rose-600 shadow-inner">
              <Trash2 className="h-9 w-9 text-rose-600" />
            </div>
            <h3
              id="delete-success-title"
              className="text-lg font-black text-slate-800"
            >
              ลบรายการสำเร็จ!
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              ลบรายการ Shop Order เรียบร้อยแล้ว
            </p>
            <button
              type="button"
              onClick={() => setShowDeleteSuccess(false)}
              className="mt-5 w-full rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-rose-700 transition-colors"
            >
              ตกลง
            </button>
          </div>
        </div>
      )}
    </main>
    </BlurFade>
  );
}
