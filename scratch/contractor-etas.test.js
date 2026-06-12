const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const googleSheet = read('lib/googleSheet.ts');
const route = read('app/api/ot-summary/route.ts');
const page = read('app/ot-summary/page.tsx');

assert.match(googleSheet, /getContractorEtasSheetData/, 'Google Sheets helper must fetch contractor ETAS data');
assert.match(googleSheet, /1ucCTBZBLF8tkTWyuIE46_aRx0vUwen382wWokuR55UQ/, 'helper must use the provided spreadsheet id');
assert.match(route, /contractorEtas/, 'API must return contractorEtas rows');
assert.match(route, /contractorIndex/, 'ETAS parser must track contractor row order because ETAS sequence resets inside each group');
assert.match(route, /getGroup\(contractorIndex, false\)/, 'ETAS parser must group rows by cumulative contractor order, not the reset ETAS sequence value');
assert.match(page, /renderEtasTable/, 'contractor page must render ETAS tables');
assert.ok(page.indexOf('renderContractorTable(rows, totals, group)') < page.indexOf('renderEtasTable(etasRows, etasTotals'), 'group ETAS table must appear after the group contractor OT table');
assert.ok(page.indexOf('renderEtasTable(etasRows, etasTotals') < page.indexOf("renderOtErrorTable(errors, 'contractor')"), 'group ETAS table must appear before the group contractor error table');
assert.ok(page.indexOf('ALL-CONTRACTORS') < page.indexOf('ALL-CONTRACTOR-ETAS'), 'all ETAS table must appear after the final contractor OT table');
assert.ok(page.indexOf('ALL-CONTRACTOR-ETAS') < page.indexOf("renderOtErrorTable(contractorErrors, 'contractor')"), 'all ETAS table must appear before the final contractor error table');
assert.match(page, /ALL-CONTRACTOR-ETAS/, 'contractor page must render the all-contractors ETAS table');
const etasTableSource = page.slice(page.indexOf('const renderEtasTable'), page.indexOf('/**\n * renderOtErrorTable'));
assert.doesNotMatch(etasTableSource, /เลขประจำตัว/, 'ETAS table should not display employee id column');
assert.doesNotMatch(etasTableSource, /row\.employeeId/, 'ETAS table should not render employee id cells');
