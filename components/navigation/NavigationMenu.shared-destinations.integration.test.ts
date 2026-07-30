import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('NavigationMenu shared destination source', () => {
  it('reads URL, label, and icon metadata from navigationDestinations', () => {
    const source = readFileSync(
      join(process.cwd(), 'components/navigation/NavigationMenu.tsx'),
      'utf8',
    );

    expect(source).toContain(
      "import { navigationDestinations } from './navigationDestinations';",
    );
    expect(source).not.toContain(
      'const destinations: readonly NavigationDestination[] = [',
    );
  });
});
