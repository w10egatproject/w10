import type { ComponentProps } from 'react';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

describe('NavigationMenu interactions', () => {
  it('opens on mouse hover and closes 150ms after mouse leave', () => {
    vi.useFakeTimers();
    usePathnameMock.mockReturnValue('/');
    render(<NavigationMenu buttonClassName="bg-test-button" />);

    const trigger = screen.getByRole('button', { name: 'เมนูหน้า' });
    const root = trigger.parentElement;
    expect(root).not.toBeNull();

    fireEvent.mouseEnter(root!);
    expect(
      screen.getByRole('navigation', { name: 'เมนูนำทางหลัก' }),
    ).toBeDefined();

    fireEvent.mouseLeave(root!);
    act(() => vi.advanceTimersByTime(149));
    expect(
      screen.getByRole('navigation', { name: 'เมนูนำทางหลัก' }),
    ).toBeDefined();

    act(() => vi.advanceTimersByTime(1));
    expect(
      screen.queryByRole('navigation', { name: 'เมนูนำทางหลัก' }),
    ).toBeNull();
  });

  it('cancels a scheduled close when the mouse re-enters', () => {
    vi.useFakeTimers();
    usePathnameMock.mockReturnValue('/');
    render(<NavigationMenu buttonClassName="bg-test-button" />);

    const trigger = screen.getByRole('button', { name: 'เมนูหน้า' });
    const root = trigger.parentElement;
    expect(root).not.toBeNull();

    fireEvent.mouseEnter(root!);
    fireEvent.mouseLeave(root!);
    act(() => vi.advanceTimersByTime(100));
    fireEvent.mouseEnter(root!);
    act(() => vi.advanceTimersByTime(100));

    expect(
      screen.getByRole('navigation', { name: 'เมนูนำทางหลัก' }),
    ).toBeDefined();
  });

  it('toggles through touch pointer activation', () => {
    usePathnameMock.mockReturnValue('/');
    render(<NavigationMenu buttonClassName="bg-test-button" />);

    const trigger = screen.getByRole('button', { name: 'เมนูหน้า' });
    fireEvent.pointerDown(trigger, { pointerType: 'touch' });
    fireEvent.click(trigger);
    expect(
      screen.getByRole('navigation', { name: 'เมนูนำทางหลัก' }),
    ).toBeDefined();

    fireEvent.pointerDown(trigger, { pointerType: 'touch' });
    fireEvent.click(trigger);
    expect(
      screen.queryByRole('navigation', { name: 'เมนูนำทางหลัก' }),
    ).toBeNull();
  });

  it('keeps a hover-open menu open when a mouse click follows hover', () => {
    usePathnameMock.mockReturnValue('/');
    render(<NavigationMenu buttonClassName="bg-test-button" />);

    const trigger = screen.getByRole('button', { name: 'เมนูหน้า' });
    const root = trigger.parentElement;
    expect(root).not.toBeNull();

    fireEvent.mouseEnter(root!);
    fireEvent.pointerDown(trigger, { pointerType: 'mouse' });
    fireEvent.click(trigger);

    expect(
      screen.getByRole('navigation', { name: 'เมนูนำทางหลัก' }),
    ).toBeDefined();
  });

  it('supports native Enter and Space button activation', async () => {
    usePathnameMock.mockReturnValue('/');
    const user = userEvent.setup();
    render(<NavigationMenu buttonClassName="bg-test-button" />);

    await user.tab();
    expect(screen.getByRole('button', { name: 'เมนูหน้า' })).toBe(
      document.activeElement,
    );

    await user.keyboard('{Enter}');
    expect(
      screen.getByRole('navigation', { name: 'เมนูนำทางหลัก' }),
    ).toBeDefined();

    await user.keyboard(' ');
    expect(
      screen.queryByRole('navigation', { name: 'เมนูนำทางหลัก' }),
    ).toBeNull();
  });

  it('closes on outside pointer interaction', () => {
    usePathnameMock.mockReturnValue('/');
    render(<NavigationMenu buttonClassName="bg-test-button" />);

    fireEvent.click(screen.getByRole('button', { name: 'เมนูหน้า' }));
    fireEvent.pointerDown(document.body);

    expect(
      screen.queryByRole('navigation', { name: 'เมนูนำทางหลัก' }),
    ).toBeNull();
  });

  it('closes on Escape and restores focus to the trigger', () => {
    usePathnameMock.mockReturnValue('/');
    render(<NavigationMenu buttonClassName="bg-test-button" />);

    const trigger = screen.getByRole('button', { name: 'เมนูหน้า' });
    fireEvent.click(trigger);
    fireEvent.keyDown(trigger, { key: 'Escape' });

    expect(
      screen.queryByRole('navigation', { name: 'เมนูนำทางหลัก' }),
    ).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('closes when focus leaves the navigation region', () => {
    usePathnameMock.mockReturnValue('/');
    render(
      <>
        <NavigationMenu buttonClassName="bg-test-button" />
        <button type="button">ปุ่มภายนอก</button>
      </>,
    );

    const trigger = screen.getByRole('button', { name: 'เมนูหน้า' });
    const outsideButton = screen.getByRole('button', { name: 'ปุ่มภายนอก' });
    fireEvent.click(trigger);
    fireEvent.blur(trigger, { relatedTarget: outsideButton });

    expect(
      screen.queryByRole('navigation', { name: 'เมนูนำทางหลัก' }),
    ).toBeNull();
  });

  it('clears its close timer and outside listener on unmount', () => {
    vi.useFakeTimers();
    const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');
    const removeListenerSpy = vi.spyOn(document, 'removeEventListener');
    usePathnameMock.mockReturnValue('/');
    const { unmount } = render(
      <NavigationMenu buttonClassName="bg-test-button" />,
    );

    const trigger = screen.getByRole('button', { name: 'เมนูหน้า' });
    const root = trigger.parentElement;
    expect(root).not.toBeNull();

    fireEvent.mouseEnter(root!);
    fireEvent.mouseLeave(root!);
    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    expect(removeListenerSpy).toHaveBeenCalledWith(
      'pointerdown',
      expect.any(Function),
    );
  });
});
