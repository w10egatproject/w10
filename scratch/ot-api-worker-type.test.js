const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const routePath = path.join(root, 'app', 'api', 'ot-summary', 'route.ts');
const pagePath = path.join(root, 'app', 'ot-summary', 'page.tsx');

const routeSource = fs.readFileSync(routePath, 'utf8');
const pageSource = fs.readFileSync(pagePath, 'utf8');

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

assert(
  pageSource.includes('workerType=${workerType}') || pageSource.includes('workerType=') && pageSource.includes('workerType'),
  'OT page should pass workerType to /api/ot-summary so each page loads only its own sheet data.',
);

assert(
  /export\s+async\s+function\s+GET\s*\(\s*request\s*:\s*Request\s*\)/.test(routeSource),
  'OT API route should accept the Request object and read query params.',
);

assert(
  routeSource.includes("searchParams.get('workerType')") || routeSource.includes('searchParams.get("workerType")'),
  'OT API route should read the workerType search param.',
);

assert(
  routeSource.includes('shouldLoadEmployees') && routeSource.includes('shouldLoadContractors'),
  'OT API route should derive booleans for conditional employee/contractor loading.',
);

assert(
  routeSource.includes("shouldLoadEmployees ? getEmployeeOtSheetData()") &&
    routeSource.includes("shouldLoadContractors ? getContractorOtSheetData()") &&
    routeSource.includes("shouldLoadEmployees ? getEmployeeOtErrorSheetData()") &&
    routeSource.includes("shouldLoadContractors ? getContractorOtErrorSheetData()") &&
    routeSource.includes("shouldLoadContractors ? getContractorEtasSheetData()") &&
    routeSource.includes("shouldLoadEmployees ? getEmployeeEtasSheetData()"),
  'OT API route should conditionally fetch each Google Sheet by requested worker type.',
);

console.log('ot-api-worker-type.test.js passed');
