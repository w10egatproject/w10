const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const route = fs.readFileSync(path.join(root, 'app', 'api', 'purchasing-all', 'route.ts'), 'utf8');
const page = fs.readFileSync(path.join(root, 'app', 'purchasing-all', 'page.tsx'), 'utf8');
const purchasingPage = fs.readFileSync(path.join(root, 'app', 'purchasing', 'page.tsx'), 'utf8');

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

assert(
  page.includes('fixedFilters') &&
    page.includes('showGaugePanel={false}') &&
    !page.includes('showSummaryPanel={false}') &&
    page.includes('tableColumnCount={9}'),
  'Purchasing-all page should fix filters, hide the left gauge panel, keep the pie chart summary panel visible, and render a 9-column table.',
);

assert(
  purchasingPage.includes('fixedFilters?: boolean') &&
    purchasingPage.includes('showGaugePanel?: boolean') &&
    purchasingPage.includes('{showGaugePanel && (') &&
    purchasingPage.includes('disabled={fixedFilters}') &&
    purchasingPage.includes('if (fixedFilters) return;'),
  'Reusable purchasing page should support fixed all-year/all-month filters and optional gauge panel visibility.',
);

assert(
  purchasingPage.includes('tableColumnCount') && purchasingPage.includes('colSpan={tableColumnCount}'),
  'Reusable purchasing page should allow purchasing-all to use a 9-column empty-state colspan.',
);

assert(
  route.includes("const currentYear = 'all';") &&
    route.includes("const currentMonth = 'all';") &&
    !route.includes('updatePurchasingAllFilters') &&
    !route.includes('selectedYear') &&
    !route.includes('selectedMonth'),
  'Purchasing-all API should be fixed to all years/months and should not update sheet filters.',
);

assert(
  route.includes('for (let r = 0; r <= 8; r++)') &&
    route.includes('const statusName = infoData[r]?.[7]') &&
    route.includes('value: getNum(r, 8)'),
  'Purchasing-all status chart/table should read H1:I9.',
);

assert(
    route.includes('for (let r = 4; r <= 8; r++)') &&
    route.includes('const pieName = infoData[r]?.[24]') &&
    route.includes('const pieValue = infoData[r]?.[25]') &&
    route.includes('value: getNum(r, 25)') &&
    route.includes('col2: pieValue'),
  'Purchasing-all pie chart and summary table should read Y5:Z9.',
);

assert(
    route.includes('for (let r = 9; r < rawData.length; r++)') &&
    route.includes('ecm_buy: row[0]') &&
    route.includes('status: row[8]') &&
    !route.includes('for (let r = 31; r < rawData.length; r++)'),
  'Purchasing-all big table should read A10:I downward.',
);

console.log('purchasing-all-fixed-layout.test.js passed');
