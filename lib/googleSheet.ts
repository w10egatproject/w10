import { google } from 'googleapis';

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

let cachedAuth: InstanceType<typeof google.auth.JWT> | null = null;
let cachedAuthKey = '';
const cachedClientsBySheetId = new Map<string, { sheetId: string; sheets: ReturnType<typeof google.sheets> }>();

function getOrCreateAuth(clientEmail: string, privateKey: string) {
  const cacheKey = `${clientEmail}:::${privateKey.slice(0, 30)}`;
  if (cachedAuth && cachedAuthKey === cacheKey) {
    return cachedAuth;
  }

  let sanitizedKey = privateKey.replace(/^"(.*)"$/, '$1');
  const keyStart = sanitizedKey.indexOf('-----BEGIN PRIVATE KEY-----');
  if (keyStart !== -1) {
    sanitizedKey = sanitizedKey.substring(keyStart);
  }
  sanitizedKey = sanitizedKey.replace(/\\n/g, '\n');

  cachedAuth = new google.auth.JWT({
    email: clientEmail,
    key: sanitizedKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  cachedAuthKey = cacheKey;
  return cachedAuth;
}

function getSheetsClientForSheet(sheetId: string) {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!clientEmail || !privateKey || !sheetId) {
    console.error('Missing Google Sheets environment variables');
    return null;
  }

  const existing = cachedClientsBySheetId.get(sheetId);
  if (existing) {
    return existing;
  }

  const auth = getOrCreateAuth(clientEmail, privateKey);
  const client = {
    sheetId,
    sheets: google.sheets({
      version: 'v4',
      auth,
    }),
  };
  cachedClientsBySheetId.set(sheetId, client);
  return client;
}

function getSheetsClient() {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) return null;
  return getSheetsClientForSheet(sheetId);
}

export async function updateDashboardFilters(year: string, month: string) {
  const client = getSheetsClient();
  if (!client) return null;

  try {
    // แปลง month เป็นข้อความที่ชีทต้องการถ้าเป็น 'all'
    const monthValue = month === 'all' ? 'รวมทุกเดือน' : month;
    // แปลง year เป็นข้อความที่ชีทต้องการถ้าเป็น 'all'
    const yearValue = year === 'all' ? 'All' : year;

    await client.sheets.spreadsheets.values.update({
      spreadsheetId: client.sheetId,
      range: "'Dashboard W10 All info'!C2:C3",
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[yearValue], [monthValue]],
      },
    });
    return true;
  } catch (error: unknown) {
    console.error('Google Sheets Update error:', getErrorMessage(error));
    return false;
  } 
}

async function updateSheetFilters(sheetId: string, tabName: string, year: string, month: string) {
  const client = getSheetsClientForSheet(sheetId);
  if (!client) return null;

  try {
    const monthValue = month === 'all' ? 'รวมทุกเดือน' : month;
    const yearValue = year === 'all' ? 'All' : year;

    await client.sheets.spreadsheets.values.update({
      spreadsheetId: client.sheetId,
      range: `'${tabName}'!C2:C3`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[yearValue], [monthValue]],
      },
    });
    return true;
  } catch (error: unknown) {
    console.error('Google Sheets filter update error:', getErrorMessage(error));
    return false;
  }
}

async function getSheetTabData(sheetId: string, tabName: string) {
  const client = getSheetsClientForSheet(sheetId);
  if (!client) return null;

  try {
    const response = await client.sheets.spreadsheets.values.get({
      spreadsheetId: client.sheetId,
      range: `'${tabName}'!A1:CZ1000`,
    });

    return response.data.values || [];
  } catch (error: unknown) {
    console.error('Google Sheets tab read error:', getErrorMessage(error));
    return null;
  }
}

const PURCHASING_ALL_SHEET_ID = '1gAFNW67DyQjzPUBRLclT3fG-QvMVop-msOguZCEw-JY';
const PURCHASING_ALL_TAB_NAME = 'Dashboard W11 PRPO infoAll';

export async function updatePurchasingAllFilters(year: string, month: string) {
  return updateSheetFilters(PURCHASING_ALL_SHEET_ID, PURCHASING_ALL_TAB_NAME, year, month);
}

export async function getPurchasingAllSheetData() {
  const rows = await getSheetTabData(PURCHASING_ALL_SHEET_ID, PURCHASING_ALL_TAB_NAME);
  if (!rows) return null;

  return {
    dashboard: rows,
    info: rows,
  };
}

const PURCHASING_ECM_LINKS_SHEET_ID = '1gAFNW67DyQjzPUBRLclT3fG-QvMVop-msOguZCEw-JY';
const PURCHASING_ECM_LINKS_TAB = 'data';

export type EcmHyperlinkMaps = {
  buyLinks: Record<string, string>;
  ecmLinks: Record<string, string>;
};

export async function getEcmHyperlinkMaps(): Promise<EcmHyperlinkMaps | null> {
  const client = getSheetsClientForSheet(PURCHASING_ECM_LINKS_SHEET_ID);
  if (!client) return null;

  try {
    const response = await client.sheets.spreadsheets.get({
      spreadsheetId: client.sheetId,
      ranges: [`'${PURCHASING_ECM_LINKS_TAB}'!A1:B1000`],
      includeGridData: true,
      fields: 'sheets.data.rowData.values(hyperlink,userEnteredValue)',
    });

    const buyLinks: Record<string, string> = {};
    const ecmLinks: Record<string, string> = {};

    const rowData = response.data.sheets?.[0]?.data?.[0]?.rowData || [];

    const getText = (cell: { userEnteredValue?: { stringValue?: string | null; numberValue?: number | null } } | undefined) => {
      const u = cell?.userEnteredValue;
      if (u?.stringValue !== undefined && u?.stringValue !== null) return String(u.stringValue);
      if (u?.numberValue !== undefined && u?.numberValue !== null) return String(u.numberValue);
      return '';
    };

    rowData.forEach((row) => {
      const cells = row.values || [];
      const buyCell = cells[0] ?? {};
      const ecmCell = cells[1] ?? {};
      const buyText = getText(buyCell).trim();
      const ecmText = getText(ecmCell).trim();
      if (buyText && typeof buyCell.hyperlink === 'string') buyLinks[buyText] = buyCell.hyperlink;
      if (ecmText && typeof ecmCell.hyperlink === 'string') ecmLinks[ecmText] = ecmCell.hyperlink;
    });

    return { buyLinks, ecmLinks };
  } catch (error: unknown) {
    console.error('Google Sheets ECM links API error:', getErrorMessage(error));
    return null;
  }
}

export async function getDashboardData() {
  const client = getSheetsClient();

  if (!client) return null;

  try {

    // ดึง 3 ชีทพร้อมกัน
    const [dashboardRes, infoRes, dataTabRes] = await Promise.all([
      client.sheets.spreadsheets.values.get({
        spreadsheetId: client.sheetId,
        range: "'Dashboard W10 All'!A1:CZ1000",
      }),
      client.sheets.spreadsheets.values.get({
        spreadsheetId: client.sheetId,
        range: "'Dashboard W10 All info'!A:CZ",
      }),
      client.sheets.spreadsheets.values.get({
        spreadsheetId: client.sheetId,
        range: "'data'!A:V",
      }),
    ]);

    return {
      dashboard: dashboardRes.data.values || [],
      info: infoRes.data.values || [],
      allData: dataTabRes.data.values || [],
    };

  } catch (error: unknown) {

    console.error('Google Sheets API error:', getErrorMessage(error));

    return null;
  }
}

export async function getEmployeeOtSheetData() {
  const sheetId = process.env.GOOGLE_OT_EMPLOYEE_SHEET_ID;
  if (!sheetId) {
    console.error('Missing GOOGLE_OT_EMPLOYEE_SHEET_ID');
    return null;
  }

  const client = getSheetsClientForSheet(sheetId);
  if (!client) return null;

  try {
    const response = await client.sheets.spreadsheets.values.get({
      spreadsheetId: client.sheetId,
      range: "'สรุปOTประจำเดือนปี2569_กบย-ช._หสบ-ช.'!B2:AL20",
    });

    return response.data.values || [];
  } catch (error: unknown) {
    console.error('Google Sheets OT API error:', getErrorMessage(error));
    return null;
  }
}

export async function getContractorOtSheetData() {
  const sheetId = process.env.GOOGLE_OT_CONTRACTOR_SHEET_ID;
  if (!sheetId) {
    console.error('Missing GOOGLE_OT_CONTRACTOR_SHEET_ID');
    return null;
  }

  const tabName = 'สรุปOT';
  const client = getSheetsClientForSheet(sheetId);
  if (!client) return null;

  try {
    const response = await client.sheets.spreadsheets.values.get({
      spreadsheetId: client.sheetId,
      range: `'${tabName}'!B2:AO100`,
    });

    return response.data.values || [];
  } catch (error: unknown) {
    console.error('Google Sheets Contractor OT API error:', getErrorMessage(error));
    return null;
  }
}

export async function getContractorEtasSheetData() {
  const sheetId = '1ucCTBZBLF8tkTWyuIE46_aRx0vUwen382wWokuR55UQ';
  const tabName = 'ETAS_dataลจ';
  const client = getSheetsClientForSheet(sheetId);
  if (!client) return null;

  try {
    const response = await client.sheets.spreadsheets.values.get({
      spreadsheetId: client.sheetId,
      range: `'${tabName}'!A1:AJ100`,
    });

    return response.data.values || [];
  } catch (error: unknown) {
    console.error('Google Sheets Contractor ETAS API error:', getErrorMessage(error));
    return null;
  }
}

export async function getEmployeeEtasSheetData() {
  const sheetId = '1__JtmwYd3xmL6XL-VkEU1E53NyaySwcT7dQY3OQ4aCA';
  const tabName = 'ETAS_data';
  const client = getSheetsClientForSheet(sheetId);
  if (!client) return null;

  try {
    const response = await client.sheets.spreadsheets.values.get({
      spreadsheetId: client.sheetId,
      range: `'${tabName}'!AL1:BU19`,
    });

    return response.data.values || [];
  } catch (error: unknown) {
    console.error('Google Sheets Employee ETAS API error:', getErrorMessage(error));
    return null;
  }
}

export async function getEmployeeOtErrorSheetData() {
  const sheetId = process.env.GOOGLE_OT_EMPLOYEE_SHEET_ID;
  if (!sheetId) {
    console.error('Missing GOOGLE_OT_EMPLOYEE_SHEET_ID');
    return null;
  }

  const client = getSheetsClientForSheet(sheetId);
  if (!client) return null;

  try {
    const response = await client.sheets.spreadsheets.values.get({
      spreadsheetId: client.sheetId,
      range: "'Check OT Error'!B2:AK40",
    });

    return response.data.values || [];
  } catch (error: unknown) {
    console.error('Google Sheets Employee OT Error API error:', getErrorMessage(error));
    return null;
  }
}

export async function getContractorOtErrorSheetData() {
  const sheetId = process.env.GOOGLE_OT_CONTRACTOR_SHEET_ID;
  if (!sheetId) {
    console.error('Missing GOOGLE_OT_CONTRACTOR_SHEET_ID');
    return null;
  }

  const client = getSheetsClientForSheet(sheetId);
  if (!client) return null;

  try {
    const response = await client.sheets.spreadsheets.values.get({
      spreadsheetId: client.sheetId,
      range: "'Check OT Error'!B2:AJ100",
    });

    return response.data.values || [];
  } catch (error: unknown) {
    console.error('Google Sheets Contractor OT Error API error:', getErrorMessage(error));
    return null;
  }
}

export async function getShopOrderSheetData(): Promise<{ data: unknown[][] | null; error: string | null }> {
  const sheetId = process.env.GOOGLE_BEML_INVENTORY_SHEET_ID;
  if (!sheetId) {
    return { data: null, error: 'Missing GOOGLE_BEML_INVENTORY_SHEET_ID' };
  }

  const client = getSheetsClientForSheet(sheetId);
  if (!client) {
    return { data: null, error: 'Failed to initialize Google Sheets client (check GOOGLE_CLIENT_EMAIL/PRIVATE_KEY)' };
  }

  try {
    const response = await client.sheets.spreadsheets.values.get({
      spreadsheetId: client.sheetId,
      range: "'PrintCheck'!A1:CZ2000",
    });

    return { data: response.data.values || [], error: null };
  } catch (error: unknown) {
    const errMsg = getErrorMessage(error);
    console.error('Google Sheets Shop Order API error:', errMsg);
    return { data: null, error: errMsg };
  }
}

