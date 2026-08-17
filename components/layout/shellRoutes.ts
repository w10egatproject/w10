export type ConsoleRoute =
  | '/'
  | '/purchasing'
  | '/purchasing-all'
  | '/beml-inventory'
  | '/ot-summary'
  | '/ot-employee'
  | '/shop-order'
  | '/consumables';

export const publicRoutes: readonly ConsoleRoute[] = [
  '/',
  '/purchasing',
  '/purchasing-all',
  '/beml-inventory',
  '/ot-summary',
  '/ot-employee',
  '/shop-order',
  '/consumables',
];

export const consoleRoutes: readonly ConsoleRoute[] = [];

export function isConsoleRoute(pathname: string): boolean {
  return consoleRoutes.some((route) => route === pathname);
}
