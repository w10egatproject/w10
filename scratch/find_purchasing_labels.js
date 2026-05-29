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
      range: "'Dashboard W10 All info'!BV1:BZ30",
    });
    
    const values = res.data.values || [];
    values.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell && (cell.includes('W11') || cell.includes('รวม'))) {
          console.log(`Found "${cell}" at Row ${r+1}, Col ${c+73} (Index [${r}][${c+73}])`);
        }
      });
    });
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
