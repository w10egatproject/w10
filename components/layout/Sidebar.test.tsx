import type { ComponentProps } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { navigationDestinations } from '@/components/navigation/navigationDestinations';
import Sidebar from './Sidebar';

vi.mock('next/link', () => ({
  default: ({ children, ...props }: ComponentProps<'a'>) => (
    <a {...props}>{children}</a>
  ),
}));

afterEach(() => {
  cleanup();
});

describe('Sidebar', () => {
  it('renders centralized destinations as internal links', () => {
    render(<Sidebar pathname="/ot-employee" />);

    const navigation = screen.getByRole('navigation', {
      name: 'เมนูนำทางหลัก',
    });

    for (const destination of navigationDestinations) {
      const link = screen.getByRole('link', { name: destination.label });

      expect(link.getAttribute('href')).toBe(destination.href);
      expect(navigation.contains(link)).toBe(true);
    }
  });

  it('communicates the current route with aria-current and a text cue', () => {
    render(<Sidebar pathname="/ot-employee" />);

    const currentLink = screen.getAllByRole('link', { name: 'สรุป OT พนักงาน' }).find((link) => link.getAttribute('aria-current') === 'page');

    expect(currentLink).toBeDefined();
    expect(currentLink?.getAttribute('aria-current')).toBe('page');
    expect(currentLink?.textContent).toContain('สรุป OT พนักงาน');
  });
});
