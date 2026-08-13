import { describe, expect, it } from 'vitest';

import {
  consoleRoutes,
  isConsoleRoute,
  publicRoutes,
} from './shellRoutes';

describe('shell route foundation', () => {
  it('knows all seven public console paths', () => {
    expect(publicRoutes).toEqual([
      '/',
      '/purchasing',
      '/purchasing-all',
      '/beml-inventory',
      '/ot-summary',
      '/ot-employee',
      '/shop-order',
    ]);
  });

  it('keeps both OT routes on the legacy shell', () => {
    expect(consoleRoutes).toEqual([]);
    expect(isConsoleRoute('/ot-employee')).toBe(false);
    expect(isConsoleRoute('/ot-summary')).toBe(false);
    expect(isConsoleRoute('/')).toBe(false);
  });

  it('matches exact paths and does not treat query strings as routes', () => {
    expect(isConsoleRoute('/ot-employee?workerType=employee')).toBe(false);
    expect(isConsoleRoute('/ot-employee/')).toBe(false);
    expect(isConsoleRoute('/unknown')).toBe(false);
  });
});
