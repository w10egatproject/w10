import type { ComponentProps } from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import NavigationMenu from './NavigationMenu';

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

const destinations = [
  { href: '/', label: 'หน้าหลัก' },
  { href: '/purchasing', label: 'จัดซื้อจัดจ้าง' },
  { href: '/purchasing-all', label: 'สถานะการซื้อจ้างทั้งหมด' },
  { href: '/beml-inventory', label: 'คลังอะไหล่ BEML' },
  { href: '/ot-summary', label: 'สรุป OT ลูกจ้าง' },
  { href: '/ot-employee', label: 'สรุป OT พนักงาน' },
] as const;

function renderOpenMenu(pathname: string) {
  usePathnameMock.mockReturnValue(pathname);
  render(
    <NavigationMenu
      buttonClassName="bg-test-button text-test-foreground"
      accentClassName="text-test-accent"
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: 'เมนูหน้า' }));
  return screen.getByRole('navigation', { name: 'เมนูนำทางหลัก' });
}

beforeEach(() => {
  usePathnameMock.mockReset();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('NavigationMenu route contract', () => {
  it.each(destinations)(
    'renders all six destinations and disables the current route $href',
    ({ href, label }) => {
      const navigation = renderOpenMenu(href);
      const renderedDestinations = within(navigation).getAllByTestId(
        'navigation-destination',
      );

      expect(renderedDestinations.map((item) => item.textContent)).toEqual(
        destinations.map((destination) => destination.label),
      );

      const currentItem = within(navigation).getByText(label);
      expect(currentItem.getAttribute('aria-current')).toBe('page');
      expect(currentItem.closest('a')).toBeNull();
      expect(within(navigation).getAllByRole('link')).toHaveLength(5);
    },
  );

  it('preserves page-specific trigger and accent classes', () => {
    const navigation = renderOpenMenu('/');
    const trigger = screen.getByRole('button', { name: 'เมนูหน้า' });
    const purchasingLink = within(navigation).getByRole('link', {
      name: /จัดซื้อจัดจ้าง/,
    });

    expect(trigger.className).toContain('bg-test-button');
    expect(trigger.className).toContain('text-test-foreground');
    expect(purchasingLink.querySelector('svg')?.getAttribute('class')).toContain(
      'text-test-accent',
    );
  });
});
