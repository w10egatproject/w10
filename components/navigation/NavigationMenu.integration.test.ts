import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const pageSources = [
  'app/page.tsx',
  'app/purchasing/page.tsx',
  'app/beml-inventory/page.tsx',
  'app/ot-summary/page.tsx',
] as const;

describe('shared navbar integration', () => {
  it.each(pageSources)('%s uses the shared navigation menu', (relativePath) => {
    const source = readFileSync(join(process.cwd(), relativePath), 'utf8');

    expect(source).toContain(
      "import NavigationMenu from '@/components/navigation/NavigationMenu';",
    );
    expect(source).toContain('<NavigationMenu');
    expect(source).not.toMatch(/const \[menuOpen,\s*setMenuOpen\]/);
    expect(source).not.toContain('<Link href="/purchasing"');
  });
});
