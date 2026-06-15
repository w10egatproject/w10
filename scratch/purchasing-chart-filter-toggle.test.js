const fs = require('fs');
const path = require('path');

const pagePath = path.resolve(__dirname, '..', 'app', 'purchasing', 'page.tsx');
const source = fs.readFileSync(pagePath, 'utf8');

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

assert(
  source.includes('const togglePurchaseStatusFilter = useCallback'),
  'Purchasing page should use a single toggle helper for chart/table status filters.',
);

assert(
  source.includes("return isSameStatus(currentStatus, nextStatus) ? '' : nextStatus;"),
  'Clicking the already selected purchasing status should clear the filter and show all rows.',
);

assert(
  (source.match(/togglePurchaseStatusFilter\(/g) || []).length >= 4,
  'Chart points, fallback chart pointer, and status summary cells should all use the toggle helper.',
);

assert(
  !source.includes('setHoveredPurchaseStatus(String(this.options?.custom?.statusName'),
  'Chart click handlers should not directly set hoveredPurchaseStatus because that prevents toggling back to all.',
);

console.log('purchasing-chart-filter-toggle.test.js passed');
