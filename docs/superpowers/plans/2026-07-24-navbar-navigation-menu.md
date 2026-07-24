# Navbar Navigation Menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the duplicated page navigation dropdowns with one shared, accessible menu that opens on desktop hover, remains usable by touch and keyboard, and always shows all six routes with the current route highlighted and disabled.

**Architecture:** Add a focused client component under `components/navigation/` that owns the canonical destination list, pathname matching, menu state, dismissal behavior, and accessibility. Existing page headers keep their current structure and pass only their existing color theme classes into the shared component. Colocated Vitest tests define the component contract and a structural integration test prevents page-level menu copies from returning.

**Tech Stack:** Next.js 16.2.6 App Router, React 19.2.4, TypeScript, Tailwind CSS 4, Lucide React, Vitest, jsdom, React Testing Library, Testing Library user-event.

## Global Constraints

- Show exactly these six destinations in this order: `/`, `/purchasing`, `/purchasing-all`, `/beml-inventory`, `/ot-summary`, `/ot-employee`.
- Keep the current destination visible, highlighted, marked with `aria-current="page"`, and non-navigable.
- Open on desktop mouse hover; preserve click/tap and keyboard operation.
- Close 150 milliseconds after mouse leave, unless the pointer re-enters first.
- Escape closes the menu and restores focus to the trigger.
- Outside pointer interaction and focus leaving the navigation region close the menu.
- Preserve each page's existing navbar trigger color theme.
- Do not move whole headers into the root layout or refactor unrelated page content.
- Preserve the user's existing uncommitted change in `app/beml-inventory/page.tsx`.
- Use the checked-in Next.js 16.2.6 documentation under `node_modules/next/dist/docs/` as the API reference.

---

## File Structure

- Create `components/navigation/NavigationMenu.tsx`: canonical routes, rendering, route matching, interaction state, cleanup, and accessibility.
- Create `components/navigation/NavigationMenu.test.tsx`: component behavior and accessibility regression coverage.
- Create `components/navigation/NavigationMenu.integration.test.ts`: structural coverage proving all page sources use the shared component.
- Create `vitest.config.mts`: Vitest React, TypeScript path alias, and jsdom configuration.
- Modify `package.json`: add the deterministic `test:unit` script and test development dependencies.
- Modify `package-lock.json`: lock the installed test development dependencies.
- Modify `app/page.tsx`: replace the home-page dropdown copy.
- Modify `app/purchasing/page.tsx`: replace the shared purchasing dropdown used by `/purchasing` and `/purchasing-all`.
- Modify `app/beml-inventory/page.tsx`: replace the inventory dropdown without touching the existing unrelated heading color change.
- Modify `app/ot-summary/page.tsx`: replace the shared OT dropdown used by `/ot-summary` and `/ot-employee`.

---

### Task 1: Establish the Canonical Navigation Contract

**Files:**

- Create: `vitest.config.mts`
- Create: `components/navigation/NavigationMenu.test.tsx`
- Create: `components/navigation/NavigationMenu.tsx`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**

- Consumes: `usePathname(): string` from `next/navigation`.
- Produces: `NavigationMenu({ buttonClassName, accentClassName? }): React.ReactElement`.
- Produces: a trigger named `เมนูหน้า` and a navigation region named `เมนูนำทางหลัก`.
- Produces: six elements with `data-testid="navigation-destination"` in canonical order.

- [ ] **Step 1: Install the Next.js-recommended unit-test stack**

Run:

```powershell
npm install --save-dev vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom @testing-library/user-event vite-tsconfig-paths
```

Expected: exit code 0; `package.json` and `package-lock.json` include the seven development dependencies.

- [ ] **Step 2: Add the deterministic unit-test script**

Add this entry to the existing `scripts` object in `package.json`:

```json
"test:unit": "vitest run"
```

The complete scripts object must be:

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "test:unit": "vitest run"
}
```

- [ ] **Step 3: Configure Vitest for this Next.js TypeScript project**

Create `vitest.config.mts`:

```ts
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
  },
});
```

- [ ] **Step 4: Write the failing canonical-route and current-page tests**

Create `components/navigation/NavigationMenu.test.tsx`:

```tsx
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
```

- [ ] **Step 5: Run the test and verify RED**

Run:

```powershell
npm run test:unit -- components/navigation/NavigationMenu.test.tsx
```

Expected: FAIL because `components/navigation/NavigationMenu.tsx` does not exist.

- [ ] **Step 6: Implement the smallest canonical menu that passes**

Create `components/navigation/NavigationMenu.tsx`:

```tsx
'use client';

import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeft,
  ChevronDown,
  Clock,
  Package,
  ShoppingBag,
  ShoppingCart,
  UserRound,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useId, useState } from 'react';

interface NavigationMenuProps {
  buttonClassName: string;
  accentClassName?: string;
}

interface NavigationDestination {
  href: string;
  label: string;
  icon: LucideIcon;
  iconClassName?: string;
  hoverClassName: string;
}

const destinations: readonly NavigationDestination[] = [
  {
    href: '/',
    label: 'หน้าหลัก',
    icon: ArrowLeft,
    iconClassName: 'text-slate-500',
    hoverClassName: 'hover:bg-slate-50',
  },
  {
    href: '/purchasing',
    label: 'จัดซื้อจัดจ้าง',
    icon: ShoppingCart,
    hoverClassName: 'hover:bg-yellow-50',
  },
  {
    href: '/purchasing-all',
    label: 'สถานะการซื้อจ้างทั้งหมด',
    icon: ShoppingBag,
    hoverClassName: 'hover:bg-yellow-50',
  },
  {
    href: '/beml-inventory',
    label: 'คลังอะไหล่ BEML',
    icon: Package,
    hoverClassName: 'hover:bg-yellow-50/50',
  },
  {
    href: '/ot-summary',
    label: 'สรุป OT ลูกจ้าง',
    icon: Clock,
    iconClassName: 'text-sky-500',
    hoverClassName: 'hover:bg-sky-50',
  },
  {
    href: '/ot-employee',
    label: 'สรุป OT พนักงาน',
    icon: UserRound,
    iconClassName: 'text-amber-500',
    hoverClassName: 'hover:bg-amber-50',
  },
];

export function NavigationMenu({
  buttonClassName,
  accentClassName = 'text-[#d4a300]',
}: NavigationMenuProps) {
  const pathname = usePathname();
  const menuId = useId();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        aria-controls={menuId}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black shadow-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 md:rounded-2xl md:px-6 md:py-3 md:text-sm ${buttonClassName}`}
      >
        เมนูหน้า
        <ChevronDown
          aria-hidden="true"
          size={16}
          strokeWidth={3}
          className={`transition-transform motion-reduce:transition-none ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-full z-50 w-64 pt-2">
          <nav
            id={menuId}
            aria-label="เมนูนำทางหลัก"
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-300/40"
          >
            <ul>
              {destinations.map((destination, index) => {
                const Icon = destination.icon;
                const iconClassName =
                  destination.iconClassName ?? accentClassName;
                const commonClassName = `flex items-center gap-3 px-4 py-3 text-sm font-black text-[#4A4A49] ${
                  index === 0 ? '' : 'border-t border-slate-100'
                }`;

                return (
                  <li key={destination.href}>
                    {pathname === destination.href ? (
                      <span
                        data-testid="navigation-destination"
                        aria-current="page"
                        className={`${commonClassName} cursor-default bg-slate-100 text-slate-700`}
                      >
                        <Icon
                          aria-hidden="true"
                          size={18}
                          className={iconClassName}
                        />
                        {destination.label}
                      </span>
                    ) : (
                      <Link
                        data-testid="navigation-destination"
                        href={destination.href}
                        className={`${commonClassName} ${destination.hoverClassName} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-500`}
                      >
                        <Icon
                          aria-hidden="true"
                          size={18}
                          className={iconClassName}
                        />
                        {destination.label}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      ) : null}
    </div>
  );
}

export default NavigationMenu;
```

- [ ] **Step 7: Run the test and verify GREEN**

Run:

```powershell
npm run test:unit -- components/navigation/NavigationMenu.test.tsx
```

Expected: PASS with 7 tests.

- [ ] **Step 8: Commit the canonical contract**

```powershell
git add package.json package-lock.json vitest.config.mts components/navigation/NavigationMenu.tsx components/navigation/NavigationMenu.test.tsx
git commit -m "test: define shared navbar navigation contract"
```

---

### Task 2: Add Hover, Dismissal, Touch, and Keyboard Behavior

**Files:**

- Modify: `components/navigation/NavigationMenu.test.tsx`
- Modify: `components/navigation/NavigationMenu.tsx`

**Interfaces:**

- Consumes: the `NavigationMenuProps` interface and six-route rendering contract from Task 1.
- Produces: `CLOSE_DELAY_MS = 150` behavior for mouse leave.
- Produces: deterministic cleanup of close timers and the document `pointerdown` listener.
- Produces: Escape dismissal with trigger focus restoration.

- [ ] **Step 1: Write the failing interaction and cleanup tests**

Add these imports to `components/navigation/NavigationMenu.test.tsx`:

```tsx
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
```

Replace the existing single-line Testing Library import with the block above, then append:

```tsx
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

  it('toggles through click for touch-compatible activation', async () => {
    usePathnameMock.mockReturnValue('/');
    const user = userEvent.setup();
    render(<NavigationMenu buttonClassName="bg-test-button" />);

    const trigger = screen.getByRole('button', { name: 'เมนูหน้า' });
    await user.click(trigger);
    expect(
      screen.getByRole('navigation', { name: 'เมนูนำทางหลัก' }),
    ).toBeDefined();

    await user.click(trigger);
    expect(
      screen.queryByRole('navigation', { name: 'เมนูนำทางหลัก' }),
    ).toBeNull();
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
```

- [ ] **Step 2: Run the interaction tests and verify RED**

Run:

```powershell
npm run test:unit -- components/navigation/NavigationMenu.test.tsx
```

Expected: FAIL on hover opening, delayed closing, outside dismissal, Escape focus restoration, blur dismissal, and cleanup.

- [ ] **Step 3: Replace the component with the complete interaction implementation**

Replace `components/navigation/NavigationMenu.tsx` with:

```tsx
'use client';

import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeft,
  ChevronDown,
  Clock,
  Package,
  ShoppingBag,
  ShoppingCart,
  UserRound,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  type FocusEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';

interface NavigationMenuProps {
  buttonClassName: string;
  accentClassName?: string;
}

interface NavigationDestination {
  href: string;
  label: string;
  icon: LucideIcon;
  iconClassName?: string;
  hoverClassName: string;
}

const CLOSE_DELAY_MS = 150;

const destinations: readonly NavigationDestination[] = [
  {
    href: '/',
    label: 'หน้าหลัก',
    icon: ArrowLeft,
    iconClassName: 'text-slate-500',
    hoverClassName: 'hover:bg-slate-50',
  },
  {
    href: '/purchasing',
    label: 'จัดซื้อจัดจ้าง',
    icon: ShoppingCart,
    hoverClassName: 'hover:bg-yellow-50',
  },
  {
    href: '/purchasing-all',
    label: 'สถานะการซื้อจ้างทั้งหมด',
    icon: ShoppingBag,
    hoverClassName: 'hover:bg-yellow-50',
  },
  {
    href: '/beml-inventory',
    label: 'คลังอะไหล่ BEML',
    icon: Package,
    hoverClassName: 'hover:bg-yellow-50/50',
  },
  {
    href: '/ot-summary',
    label: 'สรุป OT ลูกจ้าง',
    icon: Clock,
    iconClassName: 'text-sky-500',
    hoverClassName: 'hover:bg-sky-50',
  },
  {
    href: '/ot-employee',
    label: 'สรุป OT พนักงาน',
    icon: UserRound,
    iconClassName: 'text-amber-500',
    hoverClassName: 'hover:bg-amber-50',
  },
];

export function NavigationMenu({
  buttonClassName,
  accentClassName = 'text-[#d4a300]',
}: NavigationMenuProps) {
  const pathname = usePathname();
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(
    null,
  );
  const [isOpen, setIsOpen] = useState(false);

  const cancelScheduledClose = useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const openMenu = useCallback(() => {
    cancelScheduledClose();
    setIsOpen(true);
  }, [cancelScheduledClose]);

  const closeMenu = useCallback(() => {
    cancelScheduledClose();
    setIsOpen(false);
  }, [cancelScheduledClose]);

  const scheduleClose = useCallback(() => {
    cancelScheduledClose();
    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = null;
      setIsOpen(false);
    }, CLOSE_DELAY_MS);
  }, [cancelScheduledClose]);

  useEffect(() => cancelScheduledClose, [cancelScheduledClose]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleOutsidePointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !rootRef.current?.contains(event.target)
      ) {
        closeMenu();
      }
    };

    document.addEventListener('pointerdown', handleOutsidePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handleOutsidePointerDown);
    };
  }, [closeMenu, isOpen]);

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    const nextTarget = event.relatedTarget;
    if (
      !(nextTarget instanceof Node) ||
      !rootRef.current?.contains(nextTarget)
    ) {
      closeMenu();
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape' && isOpen) {
      event.preventDefault();
      closeMenu();
      triggerRef.current?.focus();
    }
  };

  return (
    <div
      ref={rootRef}
      className="relative"
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
      onFocusCapture={cancelScheduledClose}
      onBlurCapture={handleBlur}
      onKeyDown={handleKeyDown}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-controls={menuId}
        aria-expanded={isOpen}
        onClick={() => {
          cancelScheduledClose();
          setIsOpen((current) => !current);
        }}
        className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black shadow-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 md:rounded-2xl md:px-6 md:py-3 md:text-sm ${buttonClassName}`}
      >
        เมนูหน้า
        <ChevronDown
          aria-hidden="true"
          size={16}
          strokeWidth={3}
          className={`transition-transform motion-reduce:transition-none ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-full z-50 w-64 pt-2">
          <nav
            id={menuId}
            aria-label="เมนูนำทางหลัก"
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-300/40"
          >
            <ul>
              {destinations.map((destination, index) => {
                const Icon = destination.icon;
                const iconClassName =
                  destination.iconClassName ?? accentClassName;
                const commonClassName = `flex items-center gap-3 px-4 py-3 text-sm font-black text-[#4A4A49] ${
                  index === 0 ? '' : 'border-t border-slate-100'
                }`;

                return (
                  <li key={destination.href}>
                    {pathname === destination.href ? (
                      <span
                        data-testid="navigation-destination"
                        aria-current="page"
                        className={`${commonClassName} cursor-default bg-slate-100 text-slate-700`}
                      >
                        <Icon
                          aria-hidden="true"
                          size={18}
                          className={iconClassName}
                        />
                        {destination.label}
                      </span>
                    ) : (
                      <Link
                        data-testid="navigation-destination"
                        href={destination.href}
                        onClick={closeMenu}
                        className={`${commonClassName} ${destination.hoverClassName} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-500`}
                      >
                        <Icon
                          aria-hidden="true"
                          size={18}
                          className={iconClassName}
                        />
                        {destination.label}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      ) : null}
    </div>
  );
}

export default NavigationMenu;
```

- [ ] **Step 4: Run the focused tests and verify GREEN**

Run:

```powershell
npm run test:unit -- components/navigation/NavigationMenu.test.tsx
```

Expected: PASS with 15 tests and no warnings.

- [ ] **Step 5: Run lint on the component and test**

Run:

```powershell
npx eslint components/navigation/NavigationMenu.tsx components/navigation/NavigationMenu.test.tsx
```

Expected: exit code 0 with no warnings or errors.

- [ ] **Step 6: Commit the interaction behavior**

```powershell
git add components/navigation/NavigationMenu.tsx components/navigation/NavigationMenu.test.tsx
git commit -m "feat: add accessible hover navbar navigation"
```

---

### Task 3: Replace All Page-Level Dropdown Copies

**Files:**

- Create: `components/navigation/NavigationMenu.integration.test.ts`
- Modify: `app/page.tsx`
- Modify: `app/purchasing/page.tsx`
- Modify: `app/beml-inventory/page.tsx`
- Modify: `app/ot-summary/page.tsx`

**Interfaces:**

- Consumes: `NavigationMenu` and `NavigationMenuProps` from Tasks 1 and 2.
- Produces: all six user-facing routes using the same destination data and interaction behavior.
- Produces: page theme mapping: home/BEML/OT use gold; purchasing uses `t.menuBtn` and `t.accent`, including teal on `/purchasing-all`.

- [ ] **Step 1: Write the failing structural integration test**

Create `components/navigation/NavigationMenu.integration.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const pageSources = [
  'app/page.tsx',
  'app/purchasing/page.tsx',
  'app/beml-inventory/page.tsx',
  'app/ot-summary/page.tsx',
] as const;

describe('shared navbar integration', () => {
  it.each(pageSources)('%s uses the shared navigation menu', (relativePath) => {
    const source = readFileSync(join(process.cwd(), relativePath), 'utf8');

    expect(source).toContain(
      "import NavigationMenu from '@/components/navigation/NavigationMenu';",
    );
    expect(source).toContain('<NavigationMenu');
    expect(source).not.toMatch(/const \[menuOpen,\s*setMenuOpen\]/);
    expect(source).not.toContain('<Link href="/purchasing"');
  });
});
```

- [ ] **Step 2: Run the structural test and verify RED**

Run:

```powershell
npm run test:unit -- components/navigation/NavigationMenu.integration.test.ts
```

Expected: FAIL four cases because none of the page sources imports `NavigationMenu`.

- [ ] **Step 3: Replace the home-page dropdown**

In `app/page.tsx`, add:

```tsx
import NavigationMenu from '@/components/navigation/NavigationMenu';
```

Change the Lucide import to:

```tsx
import { Activity, AlertCircle, CheckCircle2, Clock, Factory, HardHat, Info, LayoutDashboard, RefreshCw, Shield, Zap } from 'lucide-react';
```

Remove:

```tsx
import Link from 'next/link';
```

Remove:

```tsx
const [menuOpen, setMenuOpen] = useState(false);
```

Replace the complete `<div className="relative">` navigation block that contains `onClick={() => setMenuOpen((value) => !value)}` with:

```tsx
<NavigationMenu
  buttonClassName="bg-[#ffe08a] text-[#4A4A49] hover:bg-[#ffd56a]"
  accentClassName="text-[#d4a300]"
/>
```

- [ ] **Step 4: Replace the purchasing dropdown used by two routes**

In `app/purchasing/page.tsx`, add:

```tsx
import NavigationMenu from '@/components/navigation/NavigationMenu';
```

Change the Lucide import to:

```tsx
import { CalendarDays, ClipboardList, Filter, RefreshCw, Search, ShoppingCart, ShoppingBag, Package, Truck, AlertCircle } from 'lucide-react';
```

Remove:

```tsx
import Link from 'next/link';
```

Remove:

```tsx
const [menuOpen, setMenuOpen] = useState(false);
```

Replace the complete `<div className="relative">` navigation block that contains `onClick={() => setMenuOpen((value) => !value)}` with:

```tsx
<NavigationMenu
  buttonClassName={t.menuBtn}
  accentClassName={t.accent}
/>
```

This source powers both `/purchasing` and `/purchasing-all`; do not edit `app/purchasing-all/page.tsx`.

- [ ] **Step 5: Replace the BEML inventory dropdown without overwriting user work**

In `app/beml-inventory/page.tsx`, add:

```tsx
import NavigationMenu from '@/components/navigation/NavigationMenu';
```

Change the Lucide import to:

```tsx
import { RefreshCw, Search, Package, AlertCircle, CheckCircle2, Info, ChevronDown, Boxes, ListFilter, X, LayoutGrid, FileSpreadsheet } from 'lucide-react';
```

Remove:

```tsx
import Link from 'next/link';
```

Remove:

```tsx
const [menuOpen, setMenuOpen] = useState(false);
```

Replace the complete navigation block below `{/* Navigation Dropdown Menu */}` with:

```tsx
{/* Navigation Dropdown Menu */}
<NavigationMenu
  buttonClassName="bg-[#ffe08a] text-[#4A4A49] hover:bg-[#ffd56a]"
  accentClassName="text-[#d4a300]"
/>
```

Keep the existing unrelated working-tree line unchanged:

```tsx
<h3 className="text-sm font-bold text-slate-100">สถานะอะไหล่</h3>
```

- [ ] **Step 6: Replace the OT dropdown used by two routes**

In `app/ot-summary/page.tsx`, add:

```tsx
import NavigationMenu from '@/components/navigation/NavigationMenu';
```

Remove:

```tsx
import Link from 'next/link';
```

Change the Lucide import to:

```tsx
import { Check, Clock, ExternalLink, FileSpreadsheet, Filter, RefreshCw, UserRound } from 'lucide-react';
```

Remove:

```tsx
const [menuOpen, setMenuOpen] = useState(false);
```

Replace the complete `<div className="relative">` navigation block that contains `onClick={() => setMenuOpen((v) => !v)}` with:

```tsx
<NavigationMenu
  buttonClassName="bg-[#ffe08a] text-[#4A4A49] hover:bg-[#ffd56a]"
  accentClassName="text-[#d4a300]"
/>
```

This source powers both `/ot-summary` and `/ot-employee`; do not edit `app/ot-employee/page.tsx`.

- [ ] **Step 7: Run the structural test and verify GREEN**

Run:

```powershell
npm run test:unit -- components/navigation/NavigationMenu.integration.test.ts
```

Expected: PASS with 4 tests.

- [ ] **Step 8: Run all unit tests**

Run:

```powershell
npm run test:unit
```

Expected: PASS with 19 tests and no warnings.

- [ ] **Step 9: Lint every changed source file**

Run:

```powershell
npx eslint components/navigation/NavigationMenu.tsx components/navigation/NavigationMenu.test.tsx components/navigation/NavigationMenu.integration.test.ts app/page.tsx app/purchasing/page.tsx app/beml-inventory/page.tsx app/ot-summary/page.tsx
```

Expected: exit code 0 with no warnings or errors.

- [ ] **Step 10: Commit only the navbar integration changes**

Stage the integration test and the four page files. For `app/beml-inventory/page.tsx`, stage only the navbar-related hunk so the user's pre-existing `text-slate-100` change remains unstaged.

```powershell
git add components/navigation/NavigationMenu.integration.test.ts app/page.tsx app/purchasing/page.tsx app/ot-summary/page.tsx
git add -p app/beml-inventory/page.tsx
git diff --cached --check
git commit -m "refactor: share navbar navigation across pages"
```

Expected: the staged diff contains the BEML navbar replacement but not the pre-existing health-card heading change.

---

## Final Verification

- [ ] **Step 1: Run the complete unit suite**

Run:

```powershell
npm run test:unit
```

Expected: all 19 tests pass.

- [ ] **Step 2: Run the project linter**

Run:

```powershell
npm run lint
```

Expected: exit code 0 with no warnings or errors.

- [ ] **Step 3: Run a production build**

Run:

```powershell
npm run build
```

Expected: exit code 0 and all six routes compile successfully.

- [ ] **Step 4: Start the local development server**

Run:

```powershell
npm run dev
```

Expected: Next.js reports a local URL and the server remains running for browser verification.

- [ ] **Step 5: Verify all routes at desktop width**

At a viewport of 1440 by 900 pixels, inspect:

```text
/
/purchasing
/purchasing-all
/beml-inventory
/ot-summary
/ot-employee
```

For each route, verify:

- hovering the trigger opens the dropdown;
- moving into the dropdown does not close it;
- all six destinations are visible;
- the current destination is highlighted and has no link target;
- leaving the navigation region closes it after a short delay;
- the dropdown is above content and is not clipped;
- the trigger retains the page's previous color theme.

- [ ] **Step 6: Verify touch-sized and keyboard behavior**

At a viewport of 390 by 844 pixels, verify trigger taps open and close the dropdown and the panel stays inside the viewport. Then at either viewport:

1. Tab to `เมนูหน้า`.
2. Press Enter and confirm the menu opens.
3. Tab through the five navigable destinations.
4. Press Escape and confirm the menu closes and focus returns to `เมนูหน้า`.
5. Open the menu and click outside it; confirm it closes.

- [ ] **Step 7: Confirm working-tree safety**

Run:

```powershell
git status --short
git diff -- app/beml-inventory/page.tsx
```

Expected: the only remaining unrelated working-tree change is the user's pre-existing BEML heading class change, unless the user has made additional changes during implementation.
