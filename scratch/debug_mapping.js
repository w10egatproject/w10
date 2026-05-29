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
      range: "'Dashboard W10 All info'!A1:CZ20",
    });
    
    const values = res.data.values || [];
    console.log("--- Dashboard W10 All info DUMP ---");
    
    // Check W11-W14 Entrance (Row 1, Cols X, AB, AF, AJ)
    console.log("W11 Entrance (Col 23):", values[0]?.[23]);
    console.log("W12 Entrance (Col 27):", values[0]?.[27]);
    console.log("W13 Entrance (Col 31):", values[0]?.[31]);
    console.log("W14 Entrance (Col 35):", values[0]?.[35]);
    console.log("W_all Entrance (Col 37):", values[0]?.[37]);

    // Check Status Data (Col L, Rows 6, 7, 8)
    console.log("SAP (Row 6, Col 11):", values[5]?.[11]);
    console.log("Pending (Row 7, Col 11):", values[6]?.[11]);
    console.log("Finish (Row 8, Col 11):", values[7]?.[11]);
    console.log("Total W/O (Row 8, Col 4):", values[7]?.[4]);

    // Check Equipment Data labels (Rows 2-8, Col F)
    console.log("Equipment Labels (Rows 2-8, Col 5):");
    for (let i = 1; i <= 7; i++) {
      console.log(`  Row ${i+1}: ${values[i]?.[5]}`);
    }

    // Check Gauges (Rows 2, 6, 8, 10 for Norm/OT, Cols CD, CE)
    //CD is 81, CE is 82
    console.log("Gauges W11 (Row 2, 3, Col 81, 82):", values[1]?.[81], values[1]?.[82], values[2]?.[81], values[2]?.[82]);
    
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
