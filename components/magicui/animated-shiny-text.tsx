'use client';

import { cn } from '@/lib/utils';

interface AnimatedShinyTextProps {
  children: React.ReactNode;
  className?: string;
  shimmerWidth?: number;
}

export function AnimatedShinyText({
  children,
  className,
  shimmerWidth = 100,
}: AnimatedShinyTextProps) {
  return (
    <p
      style={{ '--shimmer-width': `${shimmerWidth}px` } as React.CSSProperties}
      className={cn(
        'mx-auto max-w-md text-slate-600/70',
        // Shine effect
        'animate-shiny-text bg-clip-text bg-no-repeat [background-position:0_0] [background-size:var(--shimmer-width)_100%] [transition:background-position_1s_cubic-bezier(.6,.6,0,1)_infinite]',
        // Shiny gradient
        'bg-gradient-to-r from-transparent via-slate-900/80 via-50% to-transparent',
        className,
      )}
    >
      {children}
    </p>
  );
}
