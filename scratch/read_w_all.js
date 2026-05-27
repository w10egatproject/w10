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
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "'Dashboard W10 All info'!A1:AN6",
    });
    
    const values = res.data.values || [];
    console.log("Columns from A to AN (first 6 rows):");
    values.forEach((row, i) => {
      // Print row number and key columns, as well as cols 23 (X), 27 (AB), 31 (AF), 37 (AL)
      console.log(`Row ${i + 1}:`);
      console.log(`  Col A-C:`, row.slice(0, 3));
      console.log(`  Col X (W11):`, row[23]);
      console.log(`  Col AB (W12):`, row[27]);
      console.log(`  Col AF (W13):`, row[31]);
      console.log(`  Col AL (W_all):`, row[37]);
    });
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
