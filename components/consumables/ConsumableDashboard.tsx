'use client';

import Image from 'next/image';
import { Package } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BlurFade } from '@/components/magicui/blur-fade';
import { SplitText } from '@/components/reactbits/split-text';
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
  const showToast = (message: string, isError = false) => {
    if (isError) {
      toast.error(message);
    } else {
      toast.success(message);
    }
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch('/api/consumables', {
        cache: 'no-store',
        signal: controller.signal,
      });
      const result = (await response.json()) as ConsumableApiResult<ConsumableBootstrap>;
      if (!response.ok || !result.ok) {
        throw new Error(result.ok ? '' : result.error.message);
      }
      setData(result.data);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('การเชื่อมต่อกับ Google Sheets หมดเวลา (Timeout) กรุณากดปุ่มรีเฟรชข้อมูลเพื่อลองใหม่อีกครั้ง');
      } else {
        setError('ไม่สามารถโหลดข้อมูล Consumables ได้ กรุณาลองใหม่');
      }
    } finally {
      window.clearTimeout(timeoutId);
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

  const periodFiltered = useMemo(() => {
    return (data?.items ?? []).filter((d) => {
      if (filters.year !== 'all' && String(d.year) !== filters.year) return false;
      if (filters.month !== 'all' && String(d.month) !== filters.month) return false;
      return true;
    });
  }, [data, filters.year, filters.month]);

  const periodSummary = useMemo(() => summarizeConsumables(periodFiltered), [periodFiltered]);
  const filteredSummary = useMemo(() => summarizeConsumables(filtered), [filtered]);

  const summary = useMemo(() => ({
    ...filteredSummary,
    topReceivers: periodSummary.topReceivers,
  }), [filteredSummary, periodSummary]);

  const pagination = useMemo(() => paginateConsumables(filtered, page, 18), [filtered, page]);

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
    } catch (err: unknown) {
      showToast(`บันทึกไม่สำเร็จ: ${err instanceof Error ? err.message : 'เกิดข้อผิดพลาด'}`, true);
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
    } catch (err: unknown) {
      showToast(`ลบไม่สำเร็จ: ${err instanceof Error ? err.message : 'เกิดข้อผิดพลาด'}`, true);
    }
  };

  return (
    <BlurFade delay={0.1}>
      <div className="min-h-screen bg-slate-200 p-3 font-sans text-slate-800 md:p-6">
        {/* Header — matches Shop Order card style */}
        <header className="sticky top-0 z-30 mb-4 flex flex-col gap-3 rounded-2xl border-b-4 border-amber-300 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="/picture/egat.png"
            alt="การไฟฟ้าฝ่ายผลิตแห่งประเทศไทย"
            width={48}
            height={48}
            priority
          />
          <div>
            <h1 className="flex items-center gap-2 text-xl font-black md:text-2xl">
              <SplitText text="Consumables" className="flex items-center gap-2 text-xl font-black md:text-2xl" />
              <Package className="h-6 w-6 text-emerald-600" />
            </h1>
            <p className="text-xs font-bold text-slate-500">ระบบคลังวัสดุเบิกจ่าย · W10</p>
          </div>
        </div>
        <NavigationMenu buttonClassName="bg-amber-300 text-slate-900 hover:bg-amber-400" accentClassName="text-emerald-600" />
      </header>

      {/* Main Content Container */}
      <main>
        <ConsumableToolbar
          filters={filters}
          years={years}
          loading={loading}
          onChange={handleFilterChange}
          onRefresh={loadData}
          onAdd={() => setFormMode('create')}
        />

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription className="font-bold">{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-stretch">
          {/* Main Table Panel */}
          <section className="min-w-0 flex flex-col h-full">
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
          <ConsumableSummaryComponent
            summary={summary}
            loading={loading}
            selectedReceiver={filters.query}
            onSelectReceiver={(receiver) => {
              if (
                filters.query &&
                filters.query.trim().toLowerCase() === receiver.trim().toLowerCase()
              ) {
                handleFilterChange({ ...filters, query: '' });
              } else {
                handleFilterChange({ ...filters, query: receiver });
              }
            }}
          />
        </div>
      </main>

      {/* Dialogs */}
      <ConsumableDetailDialog
        item={selected}
        isOpen={Boolean(selected) && !formMode}
        onClose={() => setSelected(null)}
        onEdit={() => setFormMode('edit')}
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

      <Toaster />
    </div>
    </BlurFade>
  );
}
