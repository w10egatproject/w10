'use client';

import { cn } from '@/lib/utils';

interface BorderBeamProps {
  className?: string;
  size?: number;
  duration?: number;
  delay?: number;
  colorFrom?: string;
  colorTo?: string;
}

export function BorderBeam({
  className,
  size = 200,
  duration = 15,
  delay = 9,
  colorFrom = '#ffaa40',
  colorTo = '#9c40ff',
}: BorderBeamProps) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 rounded-[inherit] [border:1px_solid_transparent]',
        '[background:linear-gradient(var(--card-bg),var(--card-bg))_padding-box,linear-gradient(to_right,transparent,transparent)_border-box]',
        className,
      )}
      style={
        {
          '--size': size,
          '--duration': duration,
          '--delay': `-${delay}s`,
          '--color-from': colorFrom,
          '--color-to': colorTo,
          animation: `border-beam calc(var(--duration)*1s) var(--delay) infinite linear`,
        } as React.CSSProperties
      }
    />
  );
}
