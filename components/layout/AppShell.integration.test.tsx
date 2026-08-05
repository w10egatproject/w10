import type { ComponentProps } from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
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

describe('employee legacy route integration', () => {
  it('renders employee content without the Console AppShell', async () => {
    render(
      <ShellMigrationGate>
        <OtEmployeePage />
      </ShellMigrationGate>,
    );

    await waitFor(() => {
      expect(screen.getAllByText(/Employee OT integration fixture/).length).toBeGreaterThan(0);
    });

    expect(screen.queryByTestId('app-shell')).toBeNull();
    expect(
      screen.queryByRole('complementary', { name: '\u0e40\u0e21\u0e19\u0e39 EGAT' }),
    ).toBeNull();
    expect(screen.getByRole('button', { name: '\u0e40\u0e21\u0e19\u0e39\u0e2b\u0e19\u0e49\u0e32' })).toBeDefined();
    expect(
      screen.getByRole('heading', { level: 1, name: '\u0e2a\u0e23\u0e38\u0e1b OT \u0e1e\u0e19\u0e31\u0e01\u0e07\u0e32\u0e19' }),
    ).toBeDefined();
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

    expect(screen.queryByTestId('app-shell')).toBeNull();
    for (const table of screen.getAllByRole('table')) {
      expect(table.parentElement?.className).toContain('overflow-x-auto');
    }
  });
});
