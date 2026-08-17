'use client';

import { cn } from '@/lib/utils';

interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  shimmerColor?: string;
  shimmerSize?: string;
  borderRadius?: string;
  shimmerDuration?: string;
  background?: string;
  className?: string;
  children: React.ReactNode;
}

export function ShimmerButton({
  shimmerColor = '#ffffff',
  shimmerSize = '0.05em',
  shimmerDuration = '3s',
  borderRadius = '100px',
  background = 'rgba(0, 0, 0, 1)',
  className,
  children,
  ...props
}: ShimmerButtonProps) {
  return (
    <button
      style={
        {
          '--spread': '90deg',
          '--shimmer-color': shimmerColor,
          '--radius': borderRadius,
          '--speed': shimmerDuration,
          '--cut': shimmerSize,
          '--bg': background,
        } as React.CSSProperties
      }
      className={cn(
        'group relative z-0 flex cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap border border-white/10 px-6 py-3 text-white [background:var(--bg)] [border-radius:var(--radius)]',
        'transition-shadow duration-300 ease-in-out hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]',
        // Shimmer pseudo-element
        'before:absolute before:inset-0 before:rounded-[inherit]',
        'before:[background:conic-gradient(from_calc(270deg-(var(--spread)*0.5)),transparent_0,var(--shimmer-color)_var(--spread),transparent_var(--spread))]',
        'before:[--shimmer-size:calc(100%+var(--cut))]',
        'before:animate-spin',
        className,
      )}
      {...props}
    >
      {/* Backdrop */}
      <div
        className={cn(
          'absolute inset-[var(--cut)] rounded-[calc(var(--radius)-var(--cut))] [background:var(--bg)]',
        )}
      />
      <span className="relative z-10">{children}</span>
    </button>
  );
}
