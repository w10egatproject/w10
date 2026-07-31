import type { ComponentProps } from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import OtEmployeePage from '@/app/ot-employee/page';
import ShellMigrationGate from './ShellMigrationGate';

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
  employeeTitle: 'Employee OT integration fixture',
  employees: [
    {
      sequence: 1,
      employeeId: 'E-INT-001',
      name: 'Employee Integration One',
      position: 'Operator',
      group: 'W11',
      days: Array.from({ length: 31 }, () => 0),
      total: 1,
      total2: 1,
    },
  ],
  employeeEtas: [],
  employeeErrors: [],
  contractors: [],
  contractorEtas: [],
  contractorErrors: [],
};

beforeEach(() => {
  usePathnameMock.mockReturnValue('/ot-employee');
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => employeePayload,
    }),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('pilot route AppShell integration', () => {
  it('renders the pilot route inside AppShell with console chrome only', async () => {
    render(
      <ShellMigrationGate>
        <OtEmployeePage />
      </ShellMigrationGate>,
    );

    expect(screen.getByTestId('app-shell')).toBeDefined();
    expect(screen.getByRole('complementary')).toBeDefined();
    expect(screen.getByRole('main')).toBeDefined();

    await waitFor(() => {
      expect(screen.getAllByText(/Employee OT integration fixture/).length).toBeGreaterThan(0);
    });

    expect(
      screen.getByRole('heading', { level: 1, name: 'สรุป OT พนักงาน' }),
    ).toBeDefined();
    expect(screen.queryByRole('button', { name: 'เมนูหน้า' })).toBeNull();
    expect(screen.getByRole('link', { current: 'page' }).getAttribute('href')).toBe(
      '/ot-employee',
    );
  });

  it('opens and closes the mobile drawer through the route shell', () => {
    render(
      <ShellMigrationGate>
        <OtEmployeePage />
      </ShellMigrationGate>,
    );

    const trigger = screen.getByRole('button', { name: 'เปิดเมนูนำทาง' });
    fireEvent.click(trigger);

    const drawer = screen.getByRole('dialog');
    expect(drawer).toBeDefined();
    expect(document.activeElement).toBe(
      within(drawer).getByRole('button', { name: 'ปิดเมนูนำทาง' }),
    );

    fireEvent.keyDown(drawer, { key: 'Escape' });

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('keeps wide tables inside horizontal overflow containers', async () => {
    render(
      <ShellMigrationGate>
        <OtEmployeePage />
      </ShellMigrationGate>,
    );

    await waitFor(() => {
      expect(screen.getAllByRole('table').length).toBeGreaterThan(0);
    });

    for (const table of screen.getAllByRole('table')) {
      expect(table.parentElement?.className).toContain('overflow-x-auto');
    }
  });
});
