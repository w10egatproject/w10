import { RefreshCw } from 'lucide-react';
import type { ReactNode } from 'react';

export type PageHeaderSyncStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'error'
  | 'stale';

export type PageHeaderVariant = 'default' | 'console-card';

export interface PageHeaderProps {
  title: string;
  description?: string;
  syncStatus?: PageHeaderSyncStatus;
  lastUpdated?: string;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  filters?: ReactNode;
  actions?: ReactNode;
  icon?: ReactNode;
  variant?: PageHeaderVariant;
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
  icon,
  variant = 'default',
}: PageHeaderProps) {
  const status = isRefreshing ? 'loading' : syncStatus;
  const isConsoleCard = variant === 'console-card';
  const descriptionId = description ? 'page-header-description' : undefined;
  const headerClassName = isConsoleCard
    ? 'flex min-w-0 flex-col gap-5 rounded-[20px] border border-[var(--border-default)] border-b-[3px] border-b-[var(--mae-moh-amber)] bg-[var(--surface-white)] p-4 shadow-sm sm:p-6 lg:min-h-[112px] lg:flex-row lg:items-center lg:justify-between'
    : 'flex min-w-0 flex-col gap-4 border-b border-[var(--border-default)] bg-[var(--surface-white)] px-4 py-5 sm:px-6 lg:flex-row lg:items-start lg:justify-between';
  const titleClassName = isConsoleCard
    ? 'break-words text-balance text-2xl font-bold leading-tight text-[var(--console-navy)]'
    : 'break-words text-2xl font-semibold leading-tight text-[var(--console-navy)]';
  const descriptionClassName = isConsoleCard
    ? 'mt-1 break-words text-sm font-semibold uppercase tracking-[0.04em] text-[var(--text-muted)]'
    : 'mt-2 max-w-3xl break-words text-sm leading-6 text-[var(--text-secondary)]';
  const controlsClassName = isConsoleCard
    ? 'flex min-w-0 w-full flex-wrap items-center justify-start gap-3 lg:w-auto lg:max-w-[58%] lg:justify-end'
    : 'flex min-w-0 w-full flex-col gap-3 lg:w-auto lg:max-w-[52%] lg:items-end';
  const actionRowClassName = isConsoleCard
    ? 'flex min-w-0 max-w-full flex-wrap items-center justify-start gap-3 lg:justify-end'
    : 'flex min-w-0 w-full max-w-full flex-wrap items-center justify-start gap-2 lg:justify-end';
  const refreshButtonClassName = isConsoleCard
    ? 'inline-flex min-h-11 min-w-11 max-w-full items-center justify-center gap-2 rounded-xl border border-[var(--egat-blue)] bg-[var(--egat-blue)] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[var(--egat-blue-hover)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60'
    : 'inline-flex min-h-11 min-w-11 max-w-full items-center justify-center rounded-md border border-[var(--egat-blue)] bg-[var(--egat-blue)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--egat-blue-hover)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60';
  const statusClassName = isConsoleCard
    ? `mt-3 inline-flex max-w-full flex-wrap items-center gap-x-1 rounded-full border px-3 py-1.5 text-xs font-semibold leading-5 ${syncStatusClasses[status]}`
    : `mt-3 inline-flex max-w-full flex-wrap items-center gap-x-1 rounded-md border px-2.5 py-1.5 text-sm leading-5 ${syncStatusClasses[status]}`;

  return (
    <header data-variant={variant} className={headerClassName}>
      <div className={`min-w-0 flex-1 ${isConsoleCard ? 'flex items-start gap-4' : ''}`}>
        {icon ? (
          <div
            aria-hidden="true"
            className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--console-navy)] text-[var(--mae-moh-amber)]"
          >
            {icon}
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <h1 aria-describedby={descriptionId} className={titleClassName}>
            {title}
          </h1>
          {description ? (
            <p id={descriptionId} className={descriptionClassName}>
              {description}
            </p>
          ) : null}
          <p
            className={statusClassName}
            role="status"
            aria-live="polite"
          >
            <span>{syncStatusCopy[status]}</span>
            {lastUpdated ? <span>อัปเดตล่าสุด: {lastUpdated}</span> : null}
          </p>
        </div>
      </div>

      <div className={controlsClassName}>
        {filters ? <div className={`min-w-0 max-w-full ${isConsoleCard ? 'w-auto flex-1' : 'w-full'}`}>{filters}</div> : null}
        <div className={actionRowClassName}>
          {actions}
          {onRefresh ? (
            <button
              type="button"
              className={refreshButtonClassName}
              aria-label="รีเฟรชข้อมูล"
              aria-busy={isRefreshing}
              disabled={isRefreshing}
              onClick={onRefresh}
            >
              {isConsoleCard ? (
                <>
                  <RefreshCw size={16} aria-hidden="true" />
                  {isRefreshing ? 'กำลังรีเฟรช…' : 'รีเฟรชข้อมูล'}
                </>
              ) : 'รีเฟรชข้อมูล'}
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
