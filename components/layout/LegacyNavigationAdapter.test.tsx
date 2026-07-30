import type { ComponentProps } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import LegacyNavigationAdapter from './LegacyNavigationAdapter';
import { navigationDestinations } from '@/components/navigation/navigationDestinations';

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

describe('LegacyNavigationAdapter contract', () => {
  it('renders the existing trigger and every centralized destination label', () => {
    usePathnameMock.mockReturnValue('/purchasing');
    render(
      <LegacyNavigationAdapter
        buttonClassName="bg-test-button"
        accentClassName="text-test-accent"
        itemHoverClassName="hover:bg-test-theme"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'เมนูหน้า' }));
    const navigation = screen.getByRole('navigation', {
      name: 'เมนูนำทางหลัก',
    });

    for (const destination of navigationDestinations) {
      expect(within(navigation).getByText(destination.label)).toBeDefined();
    }
  });
});
