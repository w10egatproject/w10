import { createRef, type ComponentProps } from 'react';
import {
  act,
  fireEvent,
  cleanup,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import MobileNavigationDrawer from './MobileNavigationDrawer';

vi.mock('next/link', () => ({
  default: ({ children, onClick, ...props }: ComponentProps<'a'>) => (
    <a
      {...props}
      onClick={(event) => {
        event.preventDefault();
        onClick?.(event);
      }}
    >
      {children}
    </a>
  ),
}));

afterEach(() => {
  cleanup();
  document.body.style.overflow = '';
});

function renderDrawer(isOpen = true) {
  const triggerRef = createRef<HTMLButtonElement>();
  const onClose = vi.fn();

  const view = render(
    <>
      <button ref={triggerRef} type="button">
        เปิดเมนู
      </button>
      <MobileNavigationDrawer
        isOpen={isOpen}
        pathname="/ot-employee"
        onClose={onClose}
        triggerRef={triggerRef}
      />
    </>,
  );

  return { ...view, onClose, triggerRef };
}

describe('MobileNavigationDrawer', () => {
  it('does not render an interactive drawer while closed', () => {
    renderDrawer(false);

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.body.style.overflow).toBe('');
  });

  it('transfers focus into the drawer and marks the current route', async () => {
    renderDrawer();

    const closeButton = screen.getByRole('button', {
      name: 'ปิดเมนูนำทาง',
    });

    await waitFor(() => expect(document.activeElement).toBe(closeButton));
    expect(screen.getByRole('link', { name: 'สรุป OT พนักงาน' }).getAttribute('aria-current')).toBe('page');
  });

  it('closes on Escape and does not close from Escape while closed', async () => {
    const { onClose, rerender, triggerRef } = renderDrawer();
    const dialog = screen.getByRole('dialog');

    expect(dialog).toBeDefined();
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);

    rerender(
      <>
        <button ref={triggerRef} type="button">
          เปิดเมนู
        </button>
        <MobileNavigationDrawer
          isOpen={false}
          pathname="/ot-employee"
          onClose={onClose}
          triggerRef={triggerRef}
        />
      </>,
    );
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('dismisses through the overlay without a document-wide click handler', () => {
    const { onClose } = renderDrawer();

    fireEvent.click(
      screen.getByRole('button', { name: 'ปิดเมนูนำทางด้านหลัง' }),
    );

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('restores focus and the previous body overflow when closed', async () => {
    document.body.style.overflow = 'scroll';
    const { rerender, onClose, triggerRef } = renderDrawer();

    expect(document.body.style.overflow).toBe('hidden');
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'ปิดเมนูนำทาง' }),
      ).toBe(document.activeElement),
    );

    rerender(
      <>
        <button ref={triggerRef} type="button">
          เปิดเมนู
        </button>
        <MobileNavigationDrawer
          isOpen={false}
          pathname="/ot-employee"
          onClose={onClose}
          triggerRef={triggerRef}
        />
      </>,
    );

    expect(document.body.style.overflow).toBe('scroll');
    expect(document.activeElement).toBe(triggerRef.current);
  });

  it('restores body overflow when unmounted while open', () => {
    document.body.style.overflow = 'auto';
    const { unmount } = renderDrawer();

    expect(document.body.style.overflow).toBe('hidden');
    act(() => unmount());

    expect(document.body.style.overflow).toBe('auto');
  });

  it('closes after an internal navigation is selected', () => {
    const { onClose } = renderDrawer();

    fireEvent.click(screen.getByRole('link', { name: 'จัดซื้อจัดจ้าง' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
