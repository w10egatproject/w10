const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const page = fs.readFileSync(path.join(root, 'app', 'ot-summary', 'page.tsx'), 'utf8');

assert.match(page, /sheetLinks/, 'OT page must define worker-specific source sheet links');
assert.match(page, /1ucCTBZBLF8tkTWyuIE46_aRx0vUwen382wWokuR55UQ/, 'contractor OT page must link to the contractor source sheet');
assert.match(page, /1__JtmwYd3xmL6XL-VkEU1E53NyaySwcT7dQY3OQ4aCA/, 'employee OT page must link to the employee source sheet');
assert.match(page, /560156838/, 'contractor OT page must link to the ETAS_dataลจ tab');
assert.match(page, /803186817/, 'contractor OT page must link to the Check OT Error tab');
assert.match(page, /2120946153/, 'contractor OT page must link to the สรุปOT tab');
assert.match(page, /1501422016/, 'employee OT page must link to the employee summary tab');
assert.match(page, /560056512/, 'employee OT page must link to the ETAS_data tab');
assert.match(page, /ETAS_data/, 'employee source sheet action must label the ETAS_data tab');
assert.match(page, /สรุปOTประจำเดือนปี2569_กบย-ช._หสบ-ช./, 'employee source sheet action must label the employee summary tab');
assert.match(page, /sourceSheetLinks/, 'OT page must choose multiple source sheet links for contractors');
assert.match(page, /ETAS_dataลจ/, 'contractor source sheet action must label the ETAS_dataลจ tab');
assert.match(page, /Check OT Error/, 'contractor source sheet action must label the Check OT Error tab');
assert.match(page, /สรุปOT/, 'contractor source sheet action must label the สรุปOT tab');
assert.match(page, /Source-sheet quick action/, 'source sheet action bar must include a code comment');
assert.match(page, /target="_blank"/, 'source sheet button must open Google Sheets in a new tab');
assert.match(page, /rel="noreferrer"/, 'source sheet button must avoid passing referrer data');
assert.match(page, /เปิด Google Sheet/, 'source sheet button must have a clear Thai label');
assert.ok(
  page.indexOf('</motion.header>') < page.indexOf('Source-sheet quick action'),
  'source sheet action bar must be below the navbar/header',
);
assert.ok(
  page.indexOf('Source-sheet quick action') < page.indexOf('<AnimatePresence mode="wait">'),
  'source sheet action bar must appear before the page loading/content area',
);
