import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RouteTitleSync, ROUTE_PAGE_TITLES } from './RouteTitleSync';

const usePathnameMock = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => usePathnameMock(),
}));

beforeEach(() => {
  usePathnameMock.mockReset();
  document.title = '';
});

describe('RouteTitleSync', () => {
  it.each(Object.entries(ROUTE_PAGE_TITLES))(
    'sets document.title to %s for route %s',
    (route, expectedTitle) => {
      usePathnameMock.mockReturnValue(route);
      render(<RouteTitleSync />);
      expect(document.title).toBe(expectedTitle);
    },
  );

  it('falls back to default title for unknown routes', () => {
    usePathnameMock.mockReturnValue('/unknown-page');
    render(<RouteTitleSync />);
    expect(document.title).toBe('W10 Dashboard');
  });
});
