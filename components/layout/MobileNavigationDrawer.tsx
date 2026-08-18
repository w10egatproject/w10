'use client';

import { ExternalLink, X } from 'lucide-react';
import type { KeyboardEvent, RefObject } from 'react';
import { useEffect, useRef } from 'react';
import Link from 'next/link';

import { navigationDestinations } from '@/components/navigation/navigationDestinations';

export interface MobileNavigationDrawerProps {
  isOpen: boolean;
  pathname: string;
  onClose: () => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
}

export function MobileNavigationDrawer({
  isOpen,
  pathname,
  onClose,
  triggerRef,
}: MobileNavigationDrawerProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const triggerElement = triggerRef.current;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      triggerElement?.focus();
    };
  }, [isOpen, triggerRef]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label="ปิดเมนูนำทางด้านหลัง"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-[var(--console-navy)]/35"
      />

      <aside
        id="mobile-navigation-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="เมนูนำทางหลัก"
        onKeyDown={handleKeyDown}
        className="fixed inset-y-0 left-0 z-50 flex w-[min(88vw,20rem)] flex-col border-r border-[var(--border-default)] bg-[var(--surface-white)] shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-[var(--border-default)] px-4 py-4">
          <div>
            <p className="text-base font-bold text-[var(--console-navy)]">EGAT</p>
            <p className="text-xs text-[var(--text-muted)]">W10 Operations</p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            aria-label="ปิดเมนูนำทาง"
            onClick={onClose}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-[var(--border-default)] text-[var(--console-navy)] transition-colors duration-150 hover:bg-[var(--surface-mist)] motion-reduce:transition-none"
          >
            <X aria-hidden="true" size={21} />
          </button>
        </div>

        <nav
          aria-label="เมนูนำทางหลัก"
          className="min-h-0 flex-1 overflow-y-auto px-3 py-4"
        >
          <ul className="space-y-1">
            {navigationDestinations.map((destination) => {
              const isCurrent = pathname === destination.href;
              const Icon = destination.icon;

              return (
                <li key={destination.href}>
                  {destination.external || destination.href.startsWith('http') ? (
                    <a
                      href={destination.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={onClose}
                      className="flex min-h-11 items-center gap-3 rounded-lg border-l-4 border-transparent px-3 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-colors duration-150 motion-reduce:transition-none hover:bg-[var(--surface-mist)] hover:text-[var(--egat-blue)]"
                    >
                      <Icon
                        aria-hidden="true"
                        size={19}
                        strokeWidth={2}
                        className="text-[var(--text-muted)]"
                      />
                      <span className="min-w-0 flex-1 truncate">
                        {destination.label}
                      </span>
                      <ExternalLink size={14} className="text-slate-400" />
                    </a>
                  ) : (
                    <Link
                      href={destination.href}
                      aria-current={isCurrent ? 'page' : undefined}
                      onClick={onClose}
                      className={`flex min-h-11 items-center gap-3 rounded-lg border-l-4 px-3 py-2.5 text-sm transition-colors duration-150 motion-reduce:transition-none ${
                        isCurrent
                          ? 'border-[var(--mae-moh-amber)] bg-[var(--surface-muted)] font-semibold text-[var(--console-navy)]'
                          : 'border-transparent font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-mist)] hover:text-[var(--egat-blue)]'
                      }`}
                    >
                      <Icon
                        aria-hidden="true"
                        size={19}
                        strokeWidth={isCurrent ? 2.75 : 2}
                        className={
                          isCurrent
                            ? 'text-[var(--egat-blue)]'
                            : 'text-[var(--text-muted)]'
                        }
                      />
                      <span className="min-w-0 flex-1 truncate">
                        {destination.label}
                      </span>
                      {isCurrent ? (
                        <span
                          aria-hidden="true"
                          className="h-2 w-2 shrink-0 rounded-full bg-[var(--mae-moh-amber)]"
                        />
                      ) : null}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </div>
  );
}

export default MobileNavigationDrawer;
