'use client';

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

import type { NavigationDestination } from '@/components/navigation/navigationDestinations';

export interface SidebarNavItemProps {
  destination: NavigationDestination;
  pathname: string;
}

export function SidebarNavItem({
  destination,
  pathname,
}: SidebarNavItemProps) {
  const isCurrent = pathname === destination.href;
  const Icon = destination.icon;

  if (destination.external || destination.href.startsWith('http')) {
    return (
      <a
        href={destination.href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-h-11 items-center gap-3 rounded-lg border-l-4 border-transparent px-3 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-colors duration-150 motion-reduce:transition-none hover:bg-[var(--surface-mist)] hover:text-[var(--egat-blue)]"
      >
        <Icon
          aria-hidden="true"
          size={19}
          strokeWidth={2}
          className="text-[var(--text-muted)]"
        />
        <span className="min-w-0 flex-1 truncate">{destination.label}</span>
        <ExternalLink size={14} className="text-slate-400" />
      </a>
    );
  }

  return (
    <Link
      href={destination.href}
      aria-current={isCurrent ? 'page' : undefined}
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
        className={isCurrent ? 'text-[var(--egat-blue)]' : 'text-[var(--text-muted)]'}
      />
      <span className="min-w-0 flex-1 truncate">{destination.label}</span>
      {isCurrent ? (
        <span
          aria-hidden="true"
          className="h-2 w-2 shrink-0 rounded-full bg-[var(--mae-moh-amber)]"
        />
      ) : null}
    </Link>
  );
}

export default SidebarNavItem;
