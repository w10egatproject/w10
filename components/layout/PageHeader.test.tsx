import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { PageHeader } from './PageHeader';
import { RouteChromeAdapter } from './RouteChromeAdapter';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('PageHeader contract', () => {
  it('renders the page title as an h1 with its description', () => {
    render(
      <PageHeader
        title="สรุป OT พนักงาน"
        description="ตรวจสอบข้อมูลการทำงานล่วงเวลา"
      />,
    );

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'สรุป OT พนักงาน',
      }),
    ).toBeDefined();
    expect(screen.getByText('ตรวจสอบข้อมูลการทำงานล่วงเวลา')).toBeDefined();
  });

  it('supports the console-card presentation with a leading icon and compact refresh state', () => {
    render(
      <PageHeader
        variant="console-card"
        icon={<span data-testid="page-header-icon">clock</span>}
        title="สรุป OT พนักงาน"
        description="EGAT EMPLOYEE OT SUMMARY"
        syncStatus="loading"
        isRefreshing
        onRefresh={vi.fn()}
        filters={<div>พบ B2:AL20</div>}
      />,
    );

    const header = screen.getByRole('banner');

    expect(header.getAttribute('data-variant')).toBe('console-card');
    expect(screen.getByTestId('page-header-icon')).toBeDefined();
    expect(screen.getByText('EGAT EMPLOYEE OT SUMMARY')).toBeDefined();
    expect(screen.getByText('พบ B2:AL20')).toBeDefined();
    expect(screen.getByText('กำลังรีเฟรช…')).toBeDefined();
    expect(screen.getByRole('button', { name: 'รีเฟรชข้อมูล' })).toBeDefined();
  });


  it('does not render a refresh button when no refresh callback is provided', () => {
    render(<PageHeader title="สรุป OT" />);

    expect(screen.queryByRole('button', { name: 'รีเฟรชข้อมูล' })).toBeNull();
  });

  it('renders filter and action slots and calls refresh once when ready', () => {
    const onRefresh = vi.fn();

    render(
      <PageHeader
        title="สรุป OT"
        onRefresh={onRefresh}
        filters={<div data-testid="filters">ตัวกรองเดือน</div>}
        actions={<button type="button">ส่งออก</button>}
      />,
    );

    expect(screen.getByTestId('filters')).toBeDefined();
    expect(screen.getByRole('button', { name: 'ส่งออก' })).toBeDefined();

    const refreshButton = screen.getByRole('button', { name: 'รีเฟรชข้อมูล' });
    expect(refreshButton).toBeDefined();

    fireEvent.click(refreshButton);

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('keeps title, filters, and actions available while refresh is in progress', () => {
    const onRefresh = vi.fn();

    render(
      <PageHeader
        title="สรุป OT"
        description="ข้อมูลการทำงานล่วงเวลา"
        syncStatus="loading"
        isRefreshing
        onRefresh={onRefresh}
        filters={<div data-testid="filters">ตัวกรอง</div>}
        actions={<button type="button">ดูรายละเอียด</button>}
      />,
    );

    const refreshButton = screen.getByRole('button', { name: 'รีเฟรชข้อมูล' });

    expect((refreshButton as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByRole('heading', { level: 1, name: 'สรุป OT' })).toBeDefined();
    expect(screen.getByTestId('filters')).toBeDefined();
    expect(screen.getByRole('button', { name: 'ดูรายละเอียด' })).toBeDefined();
    expect(screen.getByText('กำลังอัปเดตข้อมูล')).toBeDefined();

    fireEvent.click(refreshButton);

    expect(onRefresh).not.toHaveBeenCalled();
  });

  it.each([
    ['idle', 'ยังไม่ได้ซิงก์ข้อมูล'],
    ['loading', 'กำลังอัปเดตข้อมูล'],
    ['ready', 'พร้อมใช้งาน'],
    ['error', 'อัปเดตไม่สำเร็จ'],
    ['stale', 'ข้อมูลอาจไม่เป็นปัจจุบัน'],
  ] as const)('communicates the %s sync status with text', (syncStatus, label) => {
    render(<PageHeader title="สรุป OT" syncStatus={syncStatus} />);

    expect(screen.getByText(label)).toBeDefined();
  });

  it('renders lastUpdated only when the route provides it', () => {
    const { unmount } = render(
      <PageHeader
        title="สรุป OT"
        syncStatus="ready"
        lastUpdated="30 ก.ค. 2569 14:30"
      />,
    );

    expect(screen.getByText('อัปเดตล่าสุด: 30 ก.ค. 2569 14:30')).toBeDefined();

    unmount();
    render(<PageHeader title="สรุป OT" syncStatus="ready" />);

    expect(screen.queryByText(/อัปเดตล่าสุด:/)).toBeNull();
  });

  it('does not generate timestamps or access route or data APIs', () => {
    const source = readFileSync(join(__dirname, 'PageHeader.tsx'), 'utf8');

    expect(source).not.toContain('new Date');
    expect(source).not.toContain('Date.now');
    expect(source).not.toContain('fetch(');
    expect(source).not.toContain('usePathname');
    expect(source).not.toContain('useSearchParams');
  });
});

describe('RouteChromeAdapter contract', () => {
  function EffectBranch({
    label,
    onMount,
  }: {
    label: string;
    onMount: () => void;
  }) {
    return (
      <div data-testid={label}>
        <EffectCounter onMount={onMount} />
        {label}
      </div>
    );
  }

  function EffectCounter({ onMount }: { onMount: () => void }) {
    useEffect(() => {
      onMount();
    }, [onMount]);

    return null;
  }

  it('mounts only the legacy branch in legacy mode', () => {
    const legacyMount = vi.fn();
    const consoleMount = vi.fn();

    render(
      <RouteChromeAdapter
        mode="legacy"
        legacy={<EffectBranch label="legacy-branch" onMount={legacyMount} />}
        console={<EffectBranch label="console-branch" onMount={consoleMount} />}
      />,
    );

    expect(screen.getByTestId('legacy-branch')).toBeDefined();
    expect(screen.queryByTestId('console-branch')).toBeNull();
    expect(legacyMount).toHaveBeenCalledTimes(1);
    expect(consoleMount).not.toHaveBeenCalled();
  });

  it('mounts only the console branch in console mode', () => {
    const legacyMount = vi.fn();
    const consoleMount = vi.fn();

    render(
      <RouteChromeAdapter
        mode="console"
        legacy={<EffectBranch label="legacy-branch" onMount={legacyMount} />}
        console={<EffectBranch label="console-branch" onMount={consoleMount} />}
      />,
    );

    expect(screen.queryByTestId('legacy-branch')).toBeNull();
    expect(screen.getByTestId('console-branch')).toBeDefined();
    expect(legacyMount).not.toHaveBeenCalled();
    expect(consoleMount).toHaveBeenCalledTimes(1);
  });

  it('accepts optional branch nodes without requiring both modes', () => {
    render(<RouteChromeAdapter mode="console" console={<span>Console chrome</span>} />);

    expect(screen.getByText('Console chrome')).toBeDefined();
  });
});
