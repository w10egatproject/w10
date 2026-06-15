const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dashboardSource = fs.readFileSync(path.join(root, 'app', 'page.tsx'), 'utf8');
const purchasingSource = fs.readFileSync(path.join(root, 'app', 'purchasing', 'page.tsx'), 'utf8');
const chartClientSource = fs.readFileSync(path.join(root, 'components', 'charts', 'HighchartsClient.tsx'), 'utf8');
const speedometerClientSource = fs.readFileSync(path.join(root, 'components', 'charts', 'SpeedometerClient.tsx'), 'utf8');

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

for (const [name, source] of [
  ['dashboard', dashboardSource],
  ['purchasing', purchasingSource],
]) {
  assert(source.includes("import dynamic from 'next/dynamic'"), `${name} should use next/dynamic for chart widgets.`);
  assert(source.includes("import('@/components/charts/HighchartsClient')"), `${name} should lazy-load HighchartsClient.`);
  assert(source.includes("import('@/components/charts/SpeedometerClient')"), `${name} should lazy-load SpeedometerClient.`);
  assert(!source.includes("from 'highcharts'"), `${name} should not statically import highcharts.`);
  assert(!source.includes("from 'highcharts-react-official'"), `${name} should not statically import highcharts-react-official.`);
  assert(!source.includes("from 'react-d3-speedometer'"), `${name} should not statically import react-d3-speedometer.`);
}

assert(chartClientSource.includes("import Highcharts from 'highcharts'"), 'Highcharts should be isolated inside HighchartsClient.');
assert(speedometerClientSource.includes("import ReactSpeedometer from 'react-d3-speedometer'"), 'Speedometer should be isolated inside SpeedometerClient.');

console.log('chart-lazy-loading.test.js passed');
