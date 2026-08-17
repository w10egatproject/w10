'use client';

import Image from 'next/image';
import { Package } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import NavigationMenu from '@/components/navigation/NavigationMenu';
import {
  filterAndSortConsumables,
  paginateConsumables,
  summarizeConsumables,
} from '@/lib/consumables/domain';
import { inspectLocalFile } from '@/lib/shop-order/file-rules';
import { uploadToDriveSession } from '@/lib/shop-order/upload-client';
import type { UploadSession } from '@/lib/shop-order/types';
import type {
  ConsumableApiResult,
  ConsumableBootstrap,
  ConsumableFilters,
  ConsumableInput,
  ConsumableItem,
} from '@/lib/consumables/types';
import { ConsumableDetailDialog } from './ConsumableDetailDialog';
import { ConsumableFormDialog } from './ConsumableFormDialog';
import { ConsumableSummaryComponent } from './ConsumableSummary';
import { ConsumableTable } from './ConsumableTable';
import { ConsumableToolbar } from './ConsumableToolbar';

const EMPTY_FILTERS: ConsumableFilters = {
  query: '',
  year: 'all',
  month: 'all',
};

export function ConsumableDashboard() {
  const [data, setData] = useState<ConsumableBootstrap | null>(null);
  const [filters, setFilters] = useState<ConsumableFilters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<ConsumableItem | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
  const [formPending, setFormPending] = useState(false);
  const [toast, setToast] = useState<{ message: string; isError?: boolean } | null>(null);

  const showToast = (message: string, isError = false) => {
    setToast({ message, isError });
    window.setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/consumables', { cache: 'no-store' });
      const result = (await response.json()) as ConsumableApiResult<ConsumableBootstrap>;
      if (!response.ok || !result.ok) {
        throw new Error(result.ok ? '' : result.error.message);
      }
      setData(result.data);
    } catch {
      setError('ไม่สามารถโหลดข้อมูล Consumables ได้ กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadData(), 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  const filtered = useMemo(
    () => filterAndSortConsumables(data?.items ?? [], filters),
    [data, filters],
  );

  const summary = useMemo(() => summarizeConsumables(filtered), [filtered]);
  const pagination = useMemo(() => paginateConsumables(filtered, page, 20), [filtered, page]);

  const years = useMemo(() => {
    const yearSet = new Set<string>();
    (data?.items ?? []).forEach((item) => {
      if (item.year) yearSet.add(String(item.year));
    });
    return Array.from(yearSet).sort().reverse();
  }, [data]);

  const handleFilterChange = (nextFilters: ConsumableFilters) => {
    setFilters(nextFilters);
    setPage(1);
  };

  const requestJson = async <T,>(url: string, init: RequestInit): Promise<T> => {
    const response = await fetch(url, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init.headers },
    });
    const result = (await response.json()) as ConsumableApiResult<T>;
    if (!response.ok || !result.ok) {
      throw new Error(result.ok ? 'ดำเนินการไม่สำเร็จ' : result.error.message);
    }
    return result.data;
  };

  const uploadAttachment = async (
    file: File | undefined,
  ): Promise<string | undefined> => {
    if (!file) return undefined;

    const metadata = await inspectLocalFile(file);
    const session = await requestJson<UploadSession>(
      '/api/consumables/upload-session',
      {
        method: 'POST',
        body: JSON.stringify({ orderNumber: 'CONSUMABLE', ...metadata }),
      },
    );

    await uploadToDriveSession(file, session, () => {});
    return session.fileId;
  };

  const handleSaveForm = async ({
    input,
    file,
    existingPicUrl,
  }: {
    input: ConsumableInput;
    file?: File;
    existingPicUrl?: string;
  }) => {
    setFormPending(true);
    try {
      const uploadedFileId = await uploadAttachment(file);
      await requestJson<ConsumableItem>('/api/consumables', {
        method: formMode === 'edit' ? 'PATCH' : 'POST',
        body: JSON.stringify({
          ...(formMode === 'edit' && selected ? { no: selected.no } : {}),
          item: input,
          uploadedFileId,
          existingPicUrl,
        }),
      });

      setFormMode(null);
      setSelected(null);
      showToast(formMode === 'edit' ? 'แก้ไขข้อมูลสำเร็จ ✓' : 'บันทึกข้อมูลสำเร็จ ✓');
      await loadData();
    } catch (err: any) {
      showToast(`บันทึกไม่สำเร็จ: ${err.message || 'เกิดข้อผิดพลาด'}`, true);
      throw err;
    } finally {
      setFormPending(false);
    }
  };

  const handleDeleteItem = async (item: ConsumableItem) => {
    if (!window.confirm(`ต้องการลบรายการ "${item.item}" ใช่หรือไม่?`)) return;

    try {
      await requestJson<{ no: number }>('/api/consumables', {
        method: 'DELETE',
        body: JSON.stringify({ no: item.no }),
      });

      setSelected(null);
      showToast('ลบรายการสำเร็จ ✓');
      await loadData();
    } catch (err: any) {
      showToast(`ลบไม่สำเร็จ: ${err.message || 'เกิดข้อผิดพลาด'}`, true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 pb-12">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b-4 border-yellow-400 bg-white px-4 py-3 shadow-sm md:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 shadow-md">
              <Image
                src="https://www.egat.co.th/home/wp-content/uploads/2025/02/LOGO-EGAT-THAI-ALL-06.png"
                alt="กฟผ."
                fill
                unoptimized
                className="object-contain p-1"
              />
            </div>
            <div>
              <h1 className="flex items-center gap-2 text-lg font-black text-slate-900 md:text-xl">
                Consumables <Package className="h-5 w-5 text-emerald-600" />
              </h1>
              <p className="text-xs font-semibold text-slate-500">
                ระบบคลังวัสดุเบิกจ่าย · W10
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <NavigationMenu buttonClassName="border-2 border-emerald-500 bg-emerald-50 text-emerald-800 hover:bg-emerald-100" />
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="mx-auto max-w-7xl px-4 pt-6 md:px-8">
        <ConsumableToolbar
          filters={filters}
          years={years}
          loading={loading}
          onChange={handleFilterChange}
          onRefresh={loadData}
          onAdd={() => setFormMode('create')}
        />

        {error && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-700">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          {/* Main Table Panel */}
          <section className="flex-1 min-w-0">
            <ConsumableTable
              items={pagination.items}
              totalItems={pagination.totalItems}
              page={pagination.page}
              totalPages={pagination.totalPages}
              pageSize={pagination.pageSize}
              loading={loading}
              onPageChange={setPage}
              onSelect={setSelected}
            />
          </section>

          {/* Sidebar Summary */}
          <ConsumableSummaryComponent summary={summary} />
        </div>
      </main>

      {/* Dialogs */}
      <ConsumableDetailDialog
        item={selected}
        isOpen={Boolean(selected) && !formMode}
        onClose={() => setSelected(null)}
        onEdit={(item) => setFormMode('edit')}
        onDelete={handleDeleteItem}
      />

      <ConsumableFormDialog
        isOpen={Boolean(formMode)}
        mode={formMode ?? 'create'}
        initialItem={selected}
        receivers={data?.receivers ?? []}
        pending={formPending}
        onClose={() => setFormMode(null)}
        onSubmit={handleSaveForm}
      />

      {/* Toast Feedback */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-2xl px-6 py-3 text-sm font-bold text-white shadow-2xl transition-all ${
            toast.isError ? 'bg-rose-600' : 'bg-slate-900'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
