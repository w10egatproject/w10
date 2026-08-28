'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  ease?: string;
  splitBy?: 'words' | 'chars';
}

export function SplitText({
  text,
  className,
  delay = 0,
  duration = 0.5,
  splitBy = 'words',
}: SplitTextProps) {
  const items = splitBy === 'chars' ? text.split('') : text.split(' ');

  return (
    <span className={cn('inline-block', className)} aria-label={text}>
      {items.map((item, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{
            delay: delay + i * 0.05,
            duration,
            ease: [0.25, 0.4, 0.25, 1],
          }}
          className="inline-block"
          aria-hidden
        >
          {item}
          {splitBy === 'words' && i < items.length - 1 ? '\u00a0' : ''}
        </motion.span>
      ))}
    </span>
  );
}
