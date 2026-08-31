const assert = require('node:assert');

// Simulate the toNullableNumber function from route.ts
const toNullableNumber = (value) => {
  if (value === null || value === undefined) return null;
  const str = value.toString().trim();
  if (str === '') return null;
  const normalized = str.replace(/[^0-9.-]/g, '');
  if (normalized === '' || normalized === '-' || normalized === '.') return null;
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? null : parsed;
};

// Simulate formatNumber and day cell rendering logic
const formatNumber = (value) => Number(value.toFixed(2)).toLocaleString('th-TH', { maximumFractionDigits: 2 });
const renderCell = (value) => (value !== null && value !== undefined ? formatNumber(value) : '-');

// Test toNullableNumber
assert.strictEqual(toNullableNumber(''), null, 'empty string should be null');
assert.strictEqual(toNullableNumber(null), null, 'null should be null');
assert.strictEqual(toNullableNumber(undefined), null, 'undefined should be null');
assert.strictEqual(toNullableNumber('   '), null, 'whitespace string should be null');
assert.strictEqual(toNullableNumber('-'), null, 'dash string should be null');
assert.strictEqual(toNullableNumber('0'), 0, '"0" should be 0');
assert.strictEqual(toNullableNumber('0.0'), 0, '"0.0" should be 0');
assert.strictEqual(toNullableNumber(0), 0, '0 should be 0');
assert.strictEqual(toNullableNumber('2.5'), 2.5, '"2.5" should be 2.5');
assert.strictEqual(toNullableNumber('8.0'), 8, '"8.0" should be 8');
assert.strictEqual(toNullableNumber(3.5), 3.5, '3.5 should be 3.5');

// Test renderCell
assert.strictEqual(renderCell(null), '-', 'null cell renders as "-"');
assert.strictEqual(renderCell(undefined), '-', 'undefined cell renders as "-"');
assert.strictEqual(renderCell(0), '0', '0 cell renders as "0"');
assert.strictEqual(renderCell(2.5), '2.5', '2.5 cell renders as "2.5"');
assert.strictEqual(renderCell(8), '8', '8 cell renders as "8"');

// Test array of days for นายนพคุณ แก้วบุญเรือง
const rawDays = [
  '', '', '2.5', '2.5', '0.0', '2.5', '2.5', '8.0', '', '2.5',
  '0.0', '', '2.5', '2.5', '', '', '3.5', '2.5', '2.5', '2.5',
  '0.0', '', '', '2.5', '2.5', '2.5', '0.0', '3.5', '', '', ''
];

const parsedDays = rawDays.map(toNullableNumber);
const renderedDays = parsedDays.map(renderCell);

// Day 1 (index 0, blank in sheet) -> '-'
assert.strictEqual(renderedDays[0], '-');
// Day 2 (index 1, blank in sheet) -> '-'
assert.strictEqual(renderedDays[1], '-');
// Day 3 (index 2, 2.5 in sheet) -> '2.5'
assert.strictEqual(renderedDays[2], '2.5');
// Day 4 (index 3, 2.5 in sheet) -> '2.5'
assert.strictEqual(renderedDays[3], '2.5');
// Day 5 (index 4, 0.0 in sheet) -> '0'
assert.strictEqual(renderedDays[4], '0');
// Day 6 (index 5, 2.5 in sheet) -> '2.5'
assert.strictEqual(renderedDays[5], '2.5');
// Day 11 (index 10, 0.0 in sheet) -> '0'
assert.strictEqual(renderedDays[10], '0');
// Day 21 (index 20, 0.0 in sheet) -> '0'
assert.strictEqual(renderedDays[20], '0');
// Day 27 (index 26, 0.0 in sheet) -> '0'
assert.strictEqual(renderedDays[26], '0');
// Day 28 (index 27, 3.5 in sheet) -> '3.5'
assert.strictEqual(renderedDays[27], '3.5');

// Total sum calculation
const totalSum = parsedDays.reduce((sum, val) => sum + (val || 0), 0);
assert.strictEqual(totalSum, 47.5, 'Total sum should correctly equal 47.5');

console.log('All OT Zero Handling tests passed successfully!');
