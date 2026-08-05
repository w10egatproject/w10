import type { ComponentProps } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

describe('/ot-employee legacy route', () => {
  it('shows the employee legacy header and page menu', async () => {
    mockEmployeeFetch();
    render(<OtEmployeePage />);

    await waitFor(() => {
      expect(screen.getAllByText('Employee One').length).toBeGreaterThan(0);
    });

    expect(
      screen.getByRole('heading', { level: 1, name: '\u0e2a\u0e23\u0e38\u0e1b OT \u0e1e\u0e19\u0e31\u0e01\u0e07\u0e32\u0e19' }),
    ).toBeDefined();
    expect(screen.getByRole('button', { name: '\u0e40\u0e21\u0e19\u0e39\u0e2b\u0e19\u0e49\u0e32' })).toBeDefined();
    expect(screen.queryByRole('complementary', { name: '\u0e40\u0e21\u0e19\u0e39 EGAT' })).toBeNull();
  });

  it('shows the three employee Google Sheet links below the legacy header', async () => {
    mockEmployeeFetch();
    render(<OtEmployeePage />);

    await waitFor(() => {
      expect(screen.getAllByText('Employee One').length).toBeGreaterThan(0);
    });

    const sourceLinks = screen.getAllByRole('link', {
      name: /\u0e40\u0e1b\u0e34\u0e14 Google Sheet/,
    });

    expect(sourceLinks).toHaveLength(3);
    expect(sourceLinks[0].getAttribute('href')).toBe(
      'https://docs.google.com/spreadsheets/d/1__JtmwYd3xmL6XL-VkEU1E53NyaySwcT7dQY3OQ4aCA/edit?gid=1501422016#gid=1501422016',
    );
  });

  it('renders the existing employee error message in the legacy layout', async () => {
    const errorMessage = '\u0e2d\u0e48\u0e32\u0e19\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25 OT \u0e1e\u0e19\u0e31\u0e01\u0e07\u0e32\u0e19\u0e44\u0e21\u0e48\u0e2a\u0e33\u0e40\u0e23\u0e47\u0e08 \u0e01\u0e23\u0e38\u0e13\u0e32\u0e41\u0e0a\u0e23\u0e4c\u0e0a\u0e35\u0e17\u0e43\u0e2b\u0e49 service account \u0e02\u0e2d\u0e07\u0e23\u0e30\u0e1a\u0e1a\u0e01\u0e48\u0e2d\u0e19';
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error(errorMessage)));

    render(<OtEmployeePage />);

    expect(await screen.findByText(errorMessage)).toBeDefined();
    expect(screen.getByRole('button', { name: '\u0e40\u0e21\u0e19\u0e39\u0e2b\u0e19\u0e49\u0e32' })).toBeDefined();
    expect(screen.queryByTestId('app-shell')).toBeNull();
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
      expect((screen.getByRole('button', { name: /\u0e23\u0e35\u0e40\u0e1f\u0e23\u0e0a\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25/ }) as HTMLButtonElement).disabled).toBe(false);
    });

    const refreshButton = screen.getByRole('button', { name: /\u0e23\u0e35\u0e40\u0e1f\u0e23\u0e0a\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25/ });
    expect((refreshButton as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect((screen.getByRole('button', { name: /\u0e23\u0e35\u0e40\u0e1f\u0e23\u0e0a\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25/ }) as HTMLButtonElement).disabled).toBe(true);
    });

    resolveRefresh?.({
      ok: true,
      json: async () => employeePayload,
    } as Response);
  });

  it('keeps legacy chrome visible for the loading state', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => undefined)));
    render(<OtEmployeePage />);

    expect(
      screen.getByRole('heading', { level: 1, name: '\u0e2a\u0e23\u0e38\u0e1b OT \u0e1e\u0e19\u0e31\u0e01\u0e07\u0e32\u0e19' }),
    ).toBeDefined();
    expect(screen.getByRole('button', { name: '\u0e40\u0e21\u0e19\u0e39\u0e2b\u0e19\u0e49\u0e32' })).toBeDefined();
    expect(screen.queryByTestId('app-shell')).toBeNull();
  });

  it('keeps legacy chrome visible for the error state', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('employee load failed')));
    render(<OtEmployeePage />);

    await waitFor(() => {
      expect(screen.getByText('employee load failed')).toBeDefined();
    });

    expect(
      screen.getByRole('heading', { level: 1, name: '\u0e2a\u0e23\u0e38\u0e1b OT \u0e1e\u0e19\u0e31\u0e01\u0e07\u0e32\u0e19' }),
    ).toBeDefined();
    expect(screen.getByRole('button', { name: '\u0e40\u0e21\u0e19\u0e39\u0e2b\u0e19\u0e49\u0e32' })).toBeDefined();
    expect(screen.queryByTestId('app-shell')).toBeNull();
  });
});
