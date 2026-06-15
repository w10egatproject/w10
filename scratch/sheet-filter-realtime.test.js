const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dashboardSource = fs.readFileSync(path.join(root, 'app', 'page.tsx'), 'utf8');
const purchasingSource = fs.readFileSync(path.join(root, 'app', 'purchasing', 'page.tsx'), 'utf8');
const dashboardApiSource = fs.readFileSync(path.join(root, 'app', 'api', 'dashboard', 'route.ts'), 'utf8');
const purchasingApiSource = fs.readFileSync(path.join(root, 'app', 'api', 'purchasing', 'route.ts'), 'utf8');

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

for (const [name, source] of [
  ['dashboard page', dashboardSource],
  ['purchasing page', purchasingSource],
]) {
  assert(
    source.includes('loadDashboard(null, null, true)') || source.includes('loadData(null, null, true)'),
    `${name} should read the current sheet filters on initial load instead of replaying localStorage filters.`,
  );

  assert(
    source.includes('setInterval') && (source.includes('loadDashboard(null, null)') || source.includes('loadData(null, null)')),
    `${name} should poll the sheet without query params so external sheet month/year edits appear automatically.`,
  );

  assert(
    source.includes('setYear(payload.currentYear)') || source.includes('setYear(d.currentYear)'),
    `${name} should update the visible year selector from every API response, not only initial load.`,
  );

  assert(
    source.includes("localStorage.setItem('dashboard_year'") && source.includes("localStorage.setItem('dashboard_month'"),
    `${name} should still persist explicit web dropdown selections.`,
  );
}

for (const [name, source] of [
  ['dashboard api', dashboardApiSource],
  ['purchasing api', purchasingApiSource],
]) {
  assert(
    source.includes("'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'"),
    `${name} should explicitly disable browser/proxy caching for sheet-backed realtime reads.`,
  );
}

console.log('sheet-filter-realtime.test.js passed');
