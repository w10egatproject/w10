'use client';

import type { ReactNode } from 'react';
import { useCallback, useRef, useState } from 'react';

import MobileNavigationDrawer from './MobileNavigationDrawer';
import MobileTopBar from './MobileTopBar';
import Sidebar from './Sidebar';

export interface AppShellProps {
  pathname: string;
  children: ReactNode;
}

export function AppShell({ pathname, children }: AppShellProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

  return (
    <div
      data-testid="app-shell"
      className="min-h-screen bg-[var(--surface-mist)] text-[var(--text-primary)]"
    >
      <div className="flex min-h-screen">
        <Sidebar pathname={pathname} />
        <div className="min-w-0 flex-1">
          <MobileTopBar
            isDrawerOpen={isDrawerOpen}
            onOpen={openDrawer}
            onClose={closeDrawer}
            triggerRef={triggerRef}
          />
          <main className="min-w-0">{children}</main>
        </div>
      </div>
      <MobileNavigationDrawer
        isOpen={isDrawerOpen}
        pathname={pathname}
        onClose={closeDrawer}
        triggerRef={triggerRef}
      />
    </div>
  );
}

export default AppShell;
