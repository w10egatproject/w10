import nextEnv from '@next/env';
import { google } from 'googleapis';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const auth = new google.auth.JWT({
  email: process.env.GOOGLE_CLIENT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY?.replaceAll('\\n', '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });
const spreadsheetId = process.env.SHOP_ORDER_SHEET_ID;
const sheetName = process.env.SHOP_ORDER_SHEET_NAME;
const sequence = 90;

const rowsResponse = await sheets.spreadsheets.values.get({
  spreadsheetId,
  range: `'${sheetName.replaceAll("'", "''")}'!A2:A`,
  valueRenderOption: 'UNFORMATTED_VALUE',
});
const rows = rowsResponse.data.values ?? [];
const index = rows.findIndex((row) => Number(row[0]) === sequence);
const rowNumber = index < 0 ? null : index + 2;

let rowSummary = null;
if (rowNumber !== null) {
  const rowResponse = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${sheetName.replaceAll("'", "''")}'!A${rowNumber}:K${rowNumber}`,
    valueRenderOption: 'UNFORMATTED_VALUE',
    dateTimeRenderOption: 'SERIAL_NUMBER',
  });
  const row = rowResponse.data.values?.[0] ?? [];
  rowSummary = {
    sequenceMatches: Number(row[0]) === sequence,
    populatedCells: row.filter(
      (cell) => cell !== '' && cell !== null && cell !== undefined,
    ).length,
    hasAttachmentUrl: typeof row[10] === 'string' && row[10].length > 0,
  };
}

const spreadsheet = await sheets.spreadsheets.get({
  spreadsheetId,
  fields: 'sheets(properties(sheetId,title),protectedRanges(range,warningOnly,editors))',
});
const targetSheet = spreadsheet.data.sheets?.find(
  (sheet) => sheet.properties?.title === sheetName,
);
const zeroBasedRow = rowNumber === null ? null : rowNumber - 1;
const protections = (targetSheet?.protectedRanges ?? []).filter((entry) => {
  const range = entry.range;
  if (
    zeroBasedRow === null ||
    range?.sheetId !== targetSheet?.properties?.sheetId
  ) {
    return false;
  }
  const start = range.startRowIndex ?? 0;
  const end = range.endRowIndex ?? Number.POSITIVE_INFINITY;
  return start <= zeroBasedRow && zeroBasedRow < end;
});
const serviceEmail = process.env.GOOGLE_CLIENT_EMAIL;

console.log(JSON.stringify({
  rowNumber,
  rowSummary,
  matchingProtectionCount: protections.length,
  protections: protections.map((entry) => ({
    warningOnly: entry.warningOnly === true,
    serviceAccountCanEdit:
      entry.warningOnly === true ||
      entry.editors?.users?.includes(serviceEmail) === true ||
      entry.editors?.domain === serviceEmail?.split('@')[1],
  })),
}, null, 2));
