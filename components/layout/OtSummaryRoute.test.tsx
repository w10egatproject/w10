import type { ComponentProps } from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import OtSummaryPage, { OtSummaryContent } from '@/app/ot-summary/page';

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

const contractorPayload = {
  contractorTitle: 'Contractor OT fixture',
  contractors: [
    {
      sequence: 1,
      employeeId: 'C-001',
      name: 'Contractor One',
      position: 'Vendor',
      group: 'W11',
      days: Array.from({ length: 31 }, () => 0),
      holidayHours: 1,
      total: 2,
      oneTime: 0,
      oneHalfTime: 0,
      total2: 2,
      threeTime: 0,
    },
  ],
  employeeEtas: [],
  contractorEtas: [],
  employeeErrors: [],
  contractorErrors: [],
};

function mockContractorFetch() {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => contractorPayload,
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

beforeEach(() => {
  usePathnameMock.mockReturnValue('/ot-summary');
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('/ot-summary legacy regression', () => {
  it('declares legacy as the shared content default', () => {
    const source = readFileSync(join(process.cwd(), 'app/ot-summary/page.tsx'), 'utf8');

    expect(source).toContain("chrome = 'legacy'");
  });

  it('keeps the default route on legacy chrome and contractor data', async () => {
    mockContractorFetch();

    render(<OtSummaryPage />);

    await waitFor(() => {
      expect(screen.getAllByText('Contractor One').length).toBeGreaterThan(0);
    });

    expect(screen.getByRole('button', { name: 'เมนูหน้า' })).toBeDefined();
    expect(screen.getAllByText(/Contractor OT fixture/).length).toBeGreaterThan(0);
    expect(screen.queryByText('Employee One')).toBeNull();
    expect(screen.queryByRole('heading', { level: 1, name: 'สรุป OT พนักงาน' })).toBeNull();
  });

  it('keeps explicit legacy mode available on the shared content', async () => {
    mockContractorFetch();

    render(<OtSummaryContent workerType="contractor" chrome="legacy" />);

    await waitFor(() => {
      expect(screen.getAllByText('Contractor One').length).toBeGreaterThan(0);
    });

    expect(screen.getByRole('button', { name: 'เมนูหน้า' })).toBeDefined();
  });

  it('preserves the existing workerType fetch URL and no-store request', () => {
    const source = readFileSync(join(process.cwd(), 'app/ot-summary/page.tsx'), 'utf8');

    expect(source).toContain(
      "fetch(`/api/ot-summary?workerType=${workerType}`, { cache: 'no-store' })",
    );
  });
});
