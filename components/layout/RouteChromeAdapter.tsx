import type { ReactNode } from 'react';

export type RouteChromeMode = 'legacy' | 'console';

export interface RouteChromeAdapterProps {
  mode: RouteChromeMode;
  legacy?: ReactNode;
  console?: ReactNode;
}

export function RouteChromeAdapter({
  mode,
  legacy,
  console: consoleChrome,
}: RouteChromeAdapterProps) {
  return mode === 'console' ? consoleChrome ?? null : legacy ?? null;
}
