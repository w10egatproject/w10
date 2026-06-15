const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), 'utf8');
const exists = (...parts) => fs.existsSync(path.join(root, ...parts));

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

assert(exists('app', 'purchasing-all', 'page.tsx'), 'New /purchasing-all page should exist.');
assert(exists('app', 'api', 'purchasing-all', 'route.ts'), 'New /api/purchasing-all route should exist.');

const purchasingPage = read('app', 'purchasing', 'page.tsx');
const purchasingAllPage = read('app', 'purchasing-all', 'page.tsx');
const purchasingAllRoute = read('app', 'api', 'purchasing-all', 'route.ts');
const googleSheet = read('lib', 'googleSheet.ts');

assert(
  purchasingPage.includes('export function PurchasingPageContent'),
  'Purchasing page should export a reusable content component so both pages stay visually identical.',
);

assert(
  purchasingAllPage.includes('PurchasingPageContent') &&
    purchasingAllPage.includes("apiPath=\"/api/purchasing-all\"") &&
    purchasingAllPage.includes('สถานะการซื้อจ้างทั้งหมด'),
  'New page should reuse PurchasingPageContent with the new API and title.',
);

assert(
  purchasingPage.includes('apiPath = \'/api/purchasing\'') &&
    purchasingPage.includes('pageTitle = ') &&
    purchasingPage.includes('fetch(`${apiPath}?${params.toString()}`'),
  'Reusable purchasing content should accept apiPath and pageTitle props.',
);

assert(
  googleSheet.includes('1gAFNW67DyQjzPUBRLclT3fG-QvMVop-msOguZCEw-JY') &&
    googleSheet.includes('Dashboard W11 PRPO infoAll') &&
    googleSheet.includes('getPurchasingAllSheetData'),
  'Google Sheet helper should read the provided purchasing-all spreadsheet tab.',
);

assert(
  purchasingAllRoute.includes('getPurchasingAllSheetData') &&
    !purchasingAllRoute.includes('updatePurchasingAllFilters') &&
    purchasingAllRoute.includes("'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'"),
  'New purchasing-all API should use the new sheet helper, avoid filter updates, and set no-store headers.',
);

assert(
  read('app', 'page.tsx').includes('/purchasing-all') &&
    purchasingPage.includes('/purchasing-all'),
  'Navigation menus should link to /purchasing-all.',
);

console.log('purchasing-all-page.test.js passed');
