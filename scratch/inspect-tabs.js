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

async function inspectTabs() {
  const client = getSheetsClient();
  if (!client) return;

  try {
    console.log(`Connecting to Google Sheet ID: ${client.sheetId}...`);
    
    // Get spreadsheet metadata (list of sheets/tabs)
    const meta = await client.sheets.spreadsheets.get({
      spreadsheetId: client.sheetId,
    });

    const sheetNames = meta.data.sheets.map(s => s.properties.title);
    console.log('Tabs in Spreadsheet:', sheetNames);

    for (const tabName of sheetNames) {
      console.log(`\n--- Tab: "${tabName}" ---`);
      const response = await client.sheets.spreadsheets.values.get({
        spreadsheetId: client.sheetId,
        range: `'${tabName}'!A1:Z10`,
      });

      const values = response.data.values;
      if (!values || values.length === 0) {
        console.log('No data found in this tab.');
        continue;
      }

      console.log('Headers:', values[0]);
      console.log('Sample Rows (first 3 rows):');
      values.slice(1, 4).forEach((row, i) => {
        console.log(`Row ${i + 1}:`, row);
      });
    }

  } catch (error) {
    console.error('API Error:', error.message);
  }
}

inspectTabs();
