const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const googleSheet = read('lib/googleSheet.ts');
const route = read('app/api/ot-summary/route.ts');
const page = read('app/ot-summary/page.tsx');

assert.match(googleSheet, /getEmployeeEtasSheetData/, 'Google Sheets helper must fetch employee ETAS data');
assert.match(googleSheet, /1__JtmwYd3xmL6XL-VkEU1E53NyaySwcT7dQY3OQ4aCA/, 'helper must use the provided employee spreadsheet id');
assert.match(googleSheet, /AL1:BU19/, 'helper must fetch the requested employee ETAS range');
assert.match(route, /employeeEtas/, 'API must return employeeEtas rows');
assert.match(route, /parseEmployeeEtasRows/, 'API must parse employee ETAS rows separately from contractor ETAS rows');
assert.match(route, /position:\s*row\[3\]/, 'employee ETAS parser must include the position column');
assert.match(page, /employeeEtas/, 'employee page data model must include employeeEtas');
assert.match(page, /renderEtasTable/, 'page must render reusable ETAS tables');

assert.ok(
  page.indexOf('renderEmployeeTable(rows, group)') < page.indexOf('renderEtasTable(employeeEtasRows'),
  'group employee ETAS table must appear after the group employee OT table',
);
assert.ok(
  page.indexOf('renderEtasTable(employeeEtasRows') < page.indexOf("renderOtErrorTable(errors, 'employee')"),
  'group employee ETAS table must appear before the group employee error table',
);
assert.ok(
  page.indexOf('ALL-EMPLOYEES') < page.indexOf('ALL-EMPLOYEE-ETAS'),
  'all employee ETAS table must appear after the final employee OT table',
);
assert.ok(
  page.indexOf('ALL-EMPLOYEE-ETAS') < page.indexOf("renderOtErrorTable(employeeErrors, 'employee')"),
  'all employee ETAS table must appear before the final employee error table',
);

const etasTableSource = page.slice(page.indexOf('const renderEtasTable'), page.indexOf('/**\n * renderOtErrorTable'));
assert.doesNotMatch(etasTableSource, /row\.employeeId/, 'ETAS tables should not render employee id cells');
