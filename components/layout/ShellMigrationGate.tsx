'use client';

import { usePathname } from 'next/navigation';

import AppShell from './AppShell';
import { isConsoleRoute } from './shellRoutes';

export interface ShellMigrationGateProps {
  children: React.ReactNode;
}

export function ShellMigrationGate({ children }: ShellMigrationGateProps) {
  const pathname = usePathname() ?? '';

  if (!isConsoleRoute(pathname)) {
    return children;
  }

  return <AppShell pathname={pathname}>{children}</AppShell>;
}

export default ShellMigrationGate;
