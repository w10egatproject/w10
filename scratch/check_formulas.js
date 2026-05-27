const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    let value = parts.slice(1).join('=').trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    }
    env[key] = value;
  }
});

const clientEmail = env['GOOGLE_CLIENT_EMAIL'];
const privateKey = env['GOOGLE_PRIVATE_KEY'];
const sheetId = env['GOOGLE_SHEET_ID'];

let sanitizedKey = privateKey;
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

const sheets = google.sheets({
  version: 'v4',
  auth,
});

async function main() {
  try {
    const res = await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
      ranges: [
        "'Dashboard W10 All info'!C2:C3",
        "'Dashboard W10 All'!C3:C4"
      ],
      includeGridData: true
    });
    
    res.data.sheets.forEach(sheet => {
      console.log(`Sheet Name: ${sheet.properties.title}`);
      const data = sheet.data[0];
      if (data && data.rowData) {
        data.rowData.forEach((row, r) => {
          if (row.values) {
            row.values.forEach((val, c) => {
              console.log(`  Cell: Row ${r + 1}, Col ${c + 1}`);
              console.log(`    Formatted Value: ${val.formattedValue}`);
              console.log(`    Formula/User Entered: ${val.userEnteredValue ? JSON.stringify(val.userEnteredValue) : 'none'}`);
            });
          }
        });
      }
    });
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
