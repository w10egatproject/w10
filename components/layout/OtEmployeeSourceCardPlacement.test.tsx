import type { ComponentProps } from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import OtEmployeePage from '@/app/ot-employee/page';

vi.mock('next/navigation', () => ({
  usePathname: () => '/ot-employee',
}));

vi.mock('next/link', () => ({
  default: ({ children, ...props }: ComponentProps<'a'>) => (
    <a {...props}>{children}</a>
  ),
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('/ot-employee source card placement', () => {
  it('places the employee Google Sheet card immediately after the legacy header', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        employeeTitle: 'Employee placement fixture',
        employees: [{
          sequence: 1,
          employeeId: 'E-PLACE-001',
          name: 'Employee Placement One',
          position: 'Operator',
          group: 'W11',
          days: Array.from({ length: 31 }, () => 0),
          total: 1,
          total2: 1,
        }],
        employeeEtas: [],
        employeeErrors: [],
        contractors: [],
        contractorEtas: [],
        contractorErrors: [],
      }),
    }));

    render(<OtEmployeePage />);

    await waitFor(() => {
      expect(screen.getAllByText('Employee Placement One').length).toBeGreaterThan(0);
    });

    const heading = screen.getByRole('heading', {
      level: 1,
      name: '\u0e2a\u0e23\u0e38\u0e1b OT \u0e1e\u0e19\u0e31\u0e01\u0e07\u0e32\u0e19',
    });
    const header = heading.closest('header');
    const sourceLinks = screen.getAllByRole('link', {
      name: /\u0e40\u0e1b\u0e34\u0e14 Google Sheet/,
    });

    expect(header).not.toBeNull();
    expect(sourceLinks).toHaveLength(3);
    expect(header?.nextElementSibling?.contains(sourceLinks[0])).toBe(true);
  });
});
