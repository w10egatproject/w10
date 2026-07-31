import type { ComponentProps } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import OtEmployeePage from '@/app/ot-employee/page';

const { usePathnameMock } = vi.hoisted(() => ({
  usePathnameMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  usePathname: usePathnameMock,
}));

vi.mock('next/link', () => ({
  default: ({ children, ...props }: ComponentProps<'a'>) => (
    <a {...props}>{children}</a>
  ),
}));

const employeePayload = {
  employeeTitle: 'Employee OT fixture',
  employees: [
    {
      sequence: 1,
      employeeId: 'E-001',
      name: 'Employee One',
      position: 'Operator',
      group: 'W11',
      days: Array.from({ length: 31 }, () => 0),
      total: 4,
      total2: 4,
    },
  ],
  employeeEtas: [],
  employeeErrors: [],
  contractors: [],
  contractorEtas: [],
  contractorErrors: [],
};

function mockEmployeeFetch() {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => employeePayload,
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

beforeEach(() => {
  usePathnameMock.mockReturnValue('/ot-employee');
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('/ot-employee pilot route', () => {
  it('selects console chrome in the route wrapper', () => {
    const source = readFileSync(join(process.cwd(), 'app/ot-employee/page.tsx'), 'utf8');

    expect(source).toContain('chrome="console"');
  });

  it('shows the employee PageHeader without the legacy NavigationMenu', async () => {
    mockEmployeeFetch();

    render(<OtEmployeePage />);

    await waitFor(() => {
      expect(screen.getAllByText('Employee One').length).toBeGreaterThan(0);
    });

    expect(
      screen.getByRole('heading', { level: 1, name: 'สรุป OT พนักงาน' }),
    ).toBeDefined();
    expect(screen.queryByRole('button', { name: 'เมนูหน้า' })).toBeNull();
  });

  it('keeps source-sheet links in a separate card below the console hero', async () => {
    mockEmployeeFetch();

    render(<OtEmployeePage />);

    await waitFor(() => {
      expect(screen.getAllByText('Employee One').length).toBeGreaterThan(0);
    });

    const heading = screen.getByRole('heading', {
      level: 1,
      name: 'สรุป OT พนักงาน',
    });
    const pageHeader = heading.closest('header');
    const sourceLinks = screen.getAllByRole('link', {
      name: /เปิด Google Sheet/,
    });

    expect(pageHeader).not.toBeNull();
    expect(sourceLinks.length).toBeGreaterThan(0);
    const sourceCard = screen.getByRole('region', { name: 'แหล่งข้อมูล' });

    expect(pageHeader?.contains(sourceLinks[0])).toBe(false);
    expect(sourceCard.contains(sourceLinks[0])).toBe(true);
    expect(sourceCard).not.toBe(pageHeader);
    expect(sourceLinks[0].getAttribute('href')).toBe(
      'https://docs.google.com/spreadsheets/d/1__JtmwYd3xmL6XL-VkEU1E53NyaySwcT7dQY3OQ4aCA/edit?gid=1501422016#gid=1501422016',
    );
  });

  it('renders the existing employee error message in an alert card', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('อ่านข้อมูล OT พนักงานไม่สำเร็จ กรุณาแชร์ชีทให้ service account ของระบบก่อน')));

    render(<OtEmployeePage />);

    const alert = await screen.findByRole('alert');

    expect(alert.textContent).toContain('อ่านข้อมูล OT พนักงานไม่สำเร็จ กรุณาแชร์ชีทให้ service account ของระบบก่อน');
    expect(alert.querySelector('h2')).not.toBeNull();
  });
  it('preserves employee rows and does not render contractor data', async () => {
    mockEmployeeFetch();

    render(<OtEmployeePage />);

    await waitFor(() => {
      expect(screen.getAllByText('Employee One').length).toBeGreaterThan(0);
    });

    expect(screen.getAllByText(/Employee OT fixture/).length).toBeGreaterThan(0);
    expect(screen.queryByText('Contractor One')).toBeNull();
  });

  it('passes the existing refresh callback and disables it after refresh starts', async () => {
    let resolveRefresh: ((value: Response) => void) | undefined;
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => employeePayload,
      })
      .mockImplementationOnce(
        () =>
          new Promise<Response>((resolve) => {
            resolveRefresh = resolve;
          }),
      );
    vi.stubGlobal('fetch', fetchMock);

    render(<OtEmployeePage />);

    await waitFor(() => {
      expect((screen.getByRole('button', { name: /รีเฟรชข้อมูล/ }) as HTMLButtonElement).disabled).toBe(false);
    });

    const refreshButton = screen.getByRole('button', { name: /รีเฟรชข้อมูล/ });
    expect((refreshButton as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect((screen.getByRole('button', { name: /รีเฟรชข้อมูล/ }) as HTMLButtonElement).disabled).toBe(true);
    });

    resolveRefresh?.({
      ok: true,
      json: async () => employeePayload,
    } as Response);
  });
  it('keeps console chrome visible for the loading state', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => undefined)));

    render(<OtEmployeePage />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'สรุป OT พนักงาน' }),
    ).toBeDefined();
    expect(screen.queryByRole('button', { name: 'เมนูหน้า' })).toBeNull();
  });

  it('keeps console chrome visible for the error state', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('employee load failed')));

    render(<OtEmployeePage />);

    await waitFor(() => {
      expect(screen.getByText('employee load failed')).toBeDefined();
    });

    expect(
      screen.getByRole('heading', { level: 1, name: 'สรุป OT พนักงาน' }),
    ).toBeDefined();
    expect(screen.queryByRole('button', { name: 'เมนูหน้า' })).toBeNull();
  });
});
