const { google } = require('googleapis');
const fs = require('fs');

// Parser for .env.local
const envContent = fs.readFileSync('d:/w10_dashboard/.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)$/);
  if (match) {
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.slice(1, -1);
    }
    env[match[1]] = val;
  }
});

function getSheetsClient() {
  const clientEmail = env.GOOGLE_CLIENT_EMAIL;
  const privateKey = env.GOOGLE_PRIVATE_KEY;
  const sheetId = env.GOOGLE_BEML_INVENTORY_SHEET_ID;

  if (!clientEmail || !privateKey || !sheetId) {
    console.error('Missing environment variables');
    return null;
  }

  let sanitizedKey = privateKey.replace(/^"(.*)"$/, '$1');
  const keyStart = sanitizedKey.indexOf('-----BEGIN PRIVATE KEY-----');

  if (keyStart !== -1) {
    sanitizedKey = sanitizedKey.substring(keyStart);
  }
  sanitizedKey = sanitizedKey.replace(/\\n/g, '\n');

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: sanitizedKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return {
    sheetId,
    sheets: google.sheets({
      version: 'v4',
      auth,
    }),
  };
}

async function testParse() {
  const client = getSheetsClient();
  if (!client) return;

  try {
    console.log(`Connecting to Google Sheet ID: ${client.sheetId}...`);
    const response = await client.sheets.spreadsheets.values.get({
      spreadsheetId: client.sheetId,
      range: "'PrintCheck'!A1:CZ2000",
    });

    const rawData = response.data.values;
    if (!rawData || rawData.length === 0) {
      console.log('No data found in PrintCheck tab.');
      return;
    }

    console.log(`Successfully fetched ${rawData.length} rows!`);
    const headers = rawData[0];
    const rows = rawData.slice(1);

    console.log('Headers in Sheet:', headers);

    const idxCode = headers.indexOf('รหัส/Code');
    const idxPN = headers.indexOf('P/N');
    const idxName = headers.indexOf('รายการอะไหล่');
    const idxSystem = headers.indexOf('ระบบ');
    const idxBal = headers.indexOf('จำนวนคงเหลือ');
    const idxMin = headers.indexOf('MIN');
    const idxMax = headers.indexOf('MAX');
    const idxAction = headers.indexOf('การดำเนินการ');

    console.log('Mapped Column Indices:', {
      idxCode,
      idxPN,
      idxName,
      idxSystem,
      idxBal,
      idxMin,
      idxMax,
      idxAction
    });

    const formattedData = [];
    rows.slice(0, 10).forEach((row, idx) => {
      const code = idxCode !== -1 ? row[idxCode]?.toString().trim() : '';
      const name = idxName !== -1 ? row[idxName]?.toString().trim() : '';

      const rawBal = idxBal !== -1 ? row[idxBal]?.toString() || '0' : '0';
      const rawMin = idxMin !== -1 ? row[idxMin]?.toString() || '0' : '0';
      const rawMax = idxMax !== -1 ? row[idxMax]?.toString() || '0' : '0';
      const pn = idxPN !== -1 ? row[idxPN]?.toString() || '-' : '-';
      const system = idxSystem !== -1 ? row[idxSystem]?.toString().trim() || '-' : '-';
      const action = idxAction !== -1 ? row[idxAction]?.toString() || '-' : '-';

      const balance = parseFloat(rawBal.replace(/,/g, '')) || 0;
      const min = parseFloat(rawMin.replace(/,/g, '')) || 0;
      const max = parseFloat(rawMax.replace(/,/g, '')) || 0;

      formattedData.push({
        rowNum: idx + 2,
        code,
        pn,
        name,
        system,
        balance,
        min,
        max,
        action
      });
    });

    console.log('First 10 Mapped Rows:', JSON.stringify(formattedData, null, 2));

  } catch (error) {
    console.error('API Error:', error.message);
  }
}

testParse();
