import type { ReactNode } from 'react';

export type PageHeaderSyncStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'error'
  | 'stale';

export interface PageHeaderProps {
  title: string;
  description?: string;
  syncStatus?: PageHeaderSyncStatus;
  lastUpdated?: string;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  filters?: ReactNode;
  actions?: ReactNode;
}

const syncStatusCopy: Record<PageHeaderSyncStatus, string> = {
  idle: 'ยังไม่ได้ซิงก์ข้อมูล',
  loading: 'กำลังอัปเดตข้อมูล',
  ready: 'พร้อมใช้งาน',
  error: 'อัปเดตไม่สำเร็จ',
  stale: 'ข้อมูลอาจไม่เป็นปัจจุบัน',
};

const syncStatusClasses: Record<PageHeaderSyncStatus, string> = {
  idle: 'border-[var(--border-default)] bg-[var(--surface-muted)] text-[var(--text-muted)]',
  loading: 'border-[var(--egat-blue)]/30 bg-[var(--surface-mist)] text-[var(--egat-blue)]',
  ready: 'border-[var(--operations-green)]/30 bg-[var(--surface-mist)] text-[var(--operations-green)]',
  error: 'border-[var(--alert-rose)]/30 bg-[var(--surface-mist)] text-[var(--alert-rose)]',
  stale: 'border-[var(--warning-orange)]/30 bg-[var(--surface-mist)] text-[var(--warning-orange)]',
};

export function PageHeader({
  title,
  description,
  syncStatus = 'idle',
  lastUpdated,
  isRefreshing = false,
  onRefresh,
  filters,
  actions,
}: PageHeaderProps) {
  const status = isRefreshing ? 'loading' : syncStatus;
  const descriptionId = description ? 'page-header-description' : undefined;

  return (
    <header
      className="flex min-w-0 flex-col gap-4 border-b border-[var(--border-default)] bg-[var(--surface-white)] px-4 py-5 sm:px-6 lg:flex-row lg:items-start lg:justify-between"
    >
      <div className="min-w-0 flex-1">
        <h1 aria-describedby={descriptionId} className="break-words text-2xl font-semibold leading-tight text-[var(--console-navy)]">
          {title}
        </h1>
        {description ? (
          <p
            id={descriptionId}
            className="mt-2 max-w-3xl break-words text-sm leading-6 text-[var(--text-secondary)]"
          >
            {description}
          </p>
        ) : null}
        <p
          className={`mt-3 inline-flex max-w-full flex-wrap items-center gap-x-1 rounded-md border px-2.5 py-1.5 text-sm leading-5 ${syncStatusClasses[status]}`}
          role="status"
          aria-live="polite"
        >
          <span>{syncStatusCopy[status]}</span>
          {lastUpdated ? <span>อัปเดตล่าสุด: {lastUpdated}</span> : null}
        </p>
      </div>

      <div className="flex min-w-0 w-full flex-col gap-3 lg:w-auto lg:max-w-[52%] lg:items-end">
        {filters ? <div className="min-w-0 w-full max-w-full">{filters}</div> : null}
        <div className="flex min-w-0 w-full max-w-full flex-wrap items-center justify-start gap-2 lg:justify-end">
          {actions}
          {onRefresh ? (
            <button
              type="button"
              className="inline-flex min-h-11 min-w-11 max-w-full items-center justify-center rounded-md border border-[var(--egat-blue)] bg-[var(--egat-blue)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--egat-blue-hover)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="รีเฟรชข้อมูล"
              aria-busy={isRefreshing}
              disabled={isRefreshing}
              onClick={onRefresh}
            >
              รีเฟรชข้อมูล
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
