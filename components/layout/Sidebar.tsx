'use client';

import { navigationDestinations } from '@/components/navigation/navigationDestinations';
import SidebarNavItem from './SidebarNavItem';

export interface SidebarProps {
  pathname: string;
}

export function Sidebar({ pathname }: SidebarProps) {
  return (
    <aside
      aria-label="เมนู EGAT"
      className="hidden w-60 shrink-0 border-r border-[var(--border-default)] bg-[var(--surface-white)] md:flex md:min-h-screen md:flex-col"
    >
      <div className="border-b border-[var(--border-default)] px-5 py-5">
        <div className="flex items-center gap-3">
          <div
            aria-hidden="true"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--egat-blue)] text-lg font-bold text-[var(--surface-white)]"
          >
            E
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-[var(--console-navy)]">
              EGAT
            </p>
            <p className="truncate text-xs font-medium text-[var(--text-muted)]">
              W10 Operations
            </p>
          </div>
        </div>
      </div>

      <nav
        aria-label="เมนูนำทางหลัก"
        className="min-h-0 flex-1 overflow-y-auto px-3 py-4"
      >
        <ul className="space-y-1">
          {navigationDestinations.map((destination) => (
            <li key={destination.href}>
              <SidebarNavItem destination={destination} pathname={pathname} />
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-[var(--border-default)] px-5 py-4 text-xs text-[var(--text-muted)]">
        Mae Moh, Lampang
      </div>
    </aside>
  );
}

export default Sidebar;
