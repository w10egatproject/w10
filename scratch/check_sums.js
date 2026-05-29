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
      range: "'Dashboard W10 All info'!A1:Q10",
    });
    
    const values = res.data.values || [];
    console.log("--- Summing Equipment Rows ---");
    for (let c = 12; c <= 16; c++) {
      let sum = 0;
      for (let r = 1; r <= 6; r++) { // Row 2-7
        const val = parseFloat(values[r]?.[c]?.toString().replace(/[^0-9.-]/g, '')) || 0;
        sum += val;
      }
      console.log(`Col ${c} Sum (Rows 2-7): ${sum}`);
      console.log(`Col ${c} Value in Row 8 (All): ${values[7]?.[c]}`);
      console.log(`Col ${c} Value in Row 10: ${values[9]?.[c]}`);
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
