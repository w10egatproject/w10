import type { ComponentProps } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import AppShell from './AppShell';
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

afterEach(() => {
  cleanup();
});

describe('ShellMigrationGate', () => {
  it('returns legacy route children without an AppShell', () => {
    usePathnameMock.mockReturnValue('/ot-summary');

    render(
      <ShellMigrationGate>
        <p data-testid="legacy-content">Legacy content</p>
      </ShellMigrationGate>,
    );

    expect(screen.getByTestId('legacy-content')).toBeDefined();
    expect(screen.queryByTestId('app-shell')).toBeNull();
    expect(screen.queryByRole('complementary', { name: 'เมนู EGAT' })).toBeNull();
  });

  it('wraps only the pilot route while preserving its children', () => {
    usePathnameMock.mockReturnValue('/ot-employee');

    render(
      <ShellMigrationGate>
        <p data-testid="pilot-content">Pilot content</p>
      </ShellMigrationGate>,
    );

    expect(screen.getByTestId('app-shell')).toBeDefined();
    expect(screen.getByTestId('pilot-content')).toBeDefined();
    expect(screen.getByRole('main').contains(screen.getByTestId('pilot-content'))).toBe(true);
  });
});

describe('AppShell', () => {
  it('provides a main content region without owning page content', () => {
    render(
      <AppShell pathname="/ot-employee">
        <section data-testid="route-content">Route content</section>
      </AppShell>,
    );

    expect(screen.getByRole('main').contains(screen.getByTestId('route-content'))).toBe(true);
    expect(screen.queryByRole('heading', { name: /PageHeader/i })).toBeNull();
  });
});
