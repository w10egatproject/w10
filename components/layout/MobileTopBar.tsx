'use client';

import { Menu, X } from 'lucide-react';
import type { RefObject } from 'react';

export interface MobileTopBarProps {
  isDrawerOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
}

export function MobileTopBar({
  isDrawerOpen,
  onOpen,
  onClose,
  triggerRef,
}: MobileTopBarProps) {
  return (
    <header className="flex min-h-16 items-center justify-between border-b border-[var(--border-default)] bg-[var(--surface-white)] px-4 md:hidden">
      <div>
        <p className="text-sm font-bold text-[var(--console-navy)]">EGAT</p>
        <p className="text-xs text-[var(--text-muted)]">W10 Operations</p>
      </div>
      <button
        ref={triggerRef}
        type="button"
        aria-label={isDrawerOpen ? 'ปิดเมนูนำทาง' : 'เปิดเมนูนำทาง'}
        aria-controls="mobile-navigation-drawer"
        aria-expanded={isDrawerOpen}
        onClick={isDrawerOpen ? onClose : onOpen}
        className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-[var(--border-default)] text-[var(--console-navy)] transition-colors duration-150 hover:bg-[var(--surface-mist)] motion-reduce:transition-none"
      >
        {isDrawerOpen ? (
          <X aria-hidden="true" size={21} />
        ) : (
          <Menu aria-hidden="true" size={21} />
        )}
      </button>
    </header>
  );
}

export default MobileTopBar;
