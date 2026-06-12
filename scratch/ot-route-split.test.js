const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

assert.ok(fs.existsSync(path.join(root, 'app', 'ot-summary', 'page.tsx')), 'contractor OT route must exist');
assert.ok(fs.existsSync(path.join(root, 'app', 'ot-employee', 'page.tsx')), 'employee OT route must exist');

const contractorPage = read('app/ot-summary/page.tsx');
const employeePage = read('app/ot-employee/page.tsx');

assert.match(contractorPage, /สรุป OT ลูกจ้าง/, 'contractor page should identify contractor OT');
assert.match(contractorPage, /workerType = 'contractor'/, 'contractor route should default to contractor OT');
assert.match(employeePage, /workerType="employee"/, 'employee route should render employee OT mode');

for (const file of ['app/page.tsx', 'app/purchasing/page.tsx', 'app/ot-summary/page.tsx']) {
  const content = read(file);
  assert.match(content, /href="\/ot-summary"[\s\S]*สรุป OT ลูกจ้าง/, `${file} should link to contractor OT`);
  assert.match(content, /href="\/ot-employee"[\s\S]*สรุป OT พนักงาน/, `${file} should link to employee OT`);
  assert.doesNotMatch(content, /สรุปโอทีลูกจ้างและพนักงาน/, `${file} should not use the combined OT label`);
}
