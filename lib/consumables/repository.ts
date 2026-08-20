import { google } from 'googleapis';
import { isoFromDate, normalizeDate, parseSheetRow } from './domain';
import type {
  ConsumableBootstrap,
  ConsumableInput,
  ConsumableItem,
} from './types';

const SPREADSHEET_ID =
  process.env.SHOP_ORDER_SHEET_ID || '1ZtFnQhPortoyUgKzQuruq5kU7q5V9l1GYbsSgL-9oco';
const CONSUMABLES_TAB_NAME = 'Consumables';
const RECEIVER_TAB_NAME = 'ReceiverList';

function normalizePrivateKey(key: string): string {
  let normalized = key.trim();
  if (
    normalized.length >= 2 &&
    normalized.startsWith('"') &&
    normalized.endsWith('"')
  ) {
    normalized = normalized.slice(1, -1);
  }
  normalized = normalized.replace(/\\n/g, '\n');
  const beginMarker = '-----BEGIN PRIVATE KEY-----';
  const endMarker = '-----END PRIVATE KEY-----';
  const begin = normalized.indexOf(beginMarker);
  const end = normalized.indexOf(endMarker, Math.max(0, begin));
  if (begin >= 0 && end >= begin) {
    normalized = normalized.slice(begin, end + endMarker.length);
  }
  return normalized;
}

let cachedSheetsClient: ReturnType<typeof google.sheets> | null = null;

function getSheetsClient() {
  if (cachedSheetsClient) {
    return cachedSheetsClient;
  }
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!clientEmail || !rawKey) {
    return null;
  }

  const privateKey = normalizePrivateKey(rawKey);
  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  cachedSheetsClient = google.sheets({ version: 'v4', auth });
  return cachedSheetsClient;
}

export class ConsumableRepository {
  async load(): Promise<ConsumableBootstrap> {
    const sheets = getSheetsClient();
    if (!sheets) {
      return { items: [], receivers: [], generatedAt: new Date().toISOString() };
    }

    try {
      const [consumableRes, receiverRes] = await Promise.all([
        sheets.spreadsheets.values.get(
          {
            spreadsheetId: SPREADSHEET_ID,
            range: `'${CONSUMABLES_TAB_NAME}'!A2:G2000`,
          },
          { timeout: 10000 },
        ),
        sheets.spreadsheets.values.get(
          {
            spreadsheetId: SPREADSHEET_ID,
            range: `'${RECEIVER_TAB_NAME}'!A2:A500`,
          },
          { timeout: 10000 },
        ).catch(() => ({ data: { values: [] } })),
      ]);

      const rawRows = consumableRes.data.values || [];
      const items: ConsumableItem[] = [];
      const seenMap = new Map<string, ConsumableItem>();

      rawRows.forEach((row) => {
        const item = parseSheetRow(row);
        if (!item || !item.no) return;

        const dedupKey = `${item.no}-${item.item.trim().toLowerCase()}-${item.receiver.trim().toLowerCase()}-${item.quantity}`;
        const existing = seenMap.get(dedupKey);

        if (!existing) {
          seenMap.set(dedupKey, item);
          items.push(item);
        } else if (!existing.picUrl && item.picUrl) {
          const index = items.indexOf(existing);
          if (index !== -1) {
            items[index] = item;
            seenMap.set(dedupKey, item);
          }
        }
      });

      const receiverSet = new Set<string>();
      const rawReceivers = receiverRes.data?.values || [];
      rawReceivers.forEach((r) => {
        const name = String(r[0] || '').trim();
        if (name) receiverSet.add(name);
      });
      items.forEach((item) => {
        if (item.receiver) receiverSet.add(item.receiver);
      });

      return {
        items,
        receivers: Array.from(receiverSet).sort((a, b) => a.localeCompare(b, 'th')),
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error loading consumables from Google Sheets:', error);
      throw new Error('ไม่สามารถโหลดข้อมูล Consumables จาก Google Sheets ได้');
    }
  }

  async create(input: ConsumableInput, uploadedFileId?: string): Promise<ConsumableItem> {
    const sheets = getSheetsClient();
    if (!sheets) {
      throw new Error('Google Sheets client is not initialized');
    }

    const bootstrap = await this.load();
    const maxNo = bootstrap.items.reduce((max, item) => Math.max(max, item.no), 0);
    const nextNo = maxNo + 1;

    let formattedDate = '';
    let dateIso: string | null = null;
    let year: number | null = null;
    let month: number | null = null;

    if (input.date) {
      const parsedDate = normalizeDate(input.date);
      if (parsedDate) {
        dateIso = isoFromDate(parsedDate);
        const dayStr = String(parsedDate.getDate()).padStart(2, '0');
        const monthStr = String(parsedDate.getMonth() + 1).padStart(2, '0');
        const yearBE = parsedDate.getFullYear() + 543;
        formattedDate = `${dayStr}/${monthStr}/${yearBE}`;
        year = yearBE;
        month = parsedDate.getMonth() + 1;
      }
    }

    const picUrl = uploadedFileId
      ? `https://drive.google.com/file/d/${uploadedFileId}/view`
      : '';

    const rowData = [
      nextNo,
      formattedDate,
      input.item || '',
      input.quantity || 0,
      input.receiver || '',
      input.note || '',
      picUrl,
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${CONSUMABLES_TAB_NAME}'!A:G`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [rowData],
      },
    });

    return {
      no: nextNo,
      date: dateIso,
      dateDisplay: formattedDate,
      year,
      month,
      item: input.item || '',
      quantity: input.quantity || 0,
      receiver: input.receiver || '',
      note: input.note || '',
      picUrl,
    };
  }

  async update(
    no: number,
    input: ConsumableInput,
    uploadedFileId?: string,
    existingPicUrl?: string,
  ): Promise<ConsumableItem> {
    const sheets = getSheetsClient();
    if (!sheets) {
      throw new Error('Google Sheets client is not initialized');
    }

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${CONSUMABLES_TAB_NAME}'!A2:A2000`,
    });

    const rows = res.data.values || [];
    const rowIndex = rows.findIndex((row) => String(row[0]).trim() === String(no).trim());

    if (rowIndex === -1) {
      throw new Error(`ไม่พบรายการลำดับที่ ${no}`);
    }

    const targetRowIndex = rowIndex + 2; // 1-indexed, skipping header row 1

    let formattedDate = '';
    let dateIso: string | null = null;
    let year: number | null = null;
    let month: number | null = null;

    if (input.date) {
      const parsedDate = normalizeDate(input.date);
      if (parsedDate) {
        dateIso = isoFromDate(parsedDate);
        const dayStr = String(parsedDate.getDate()).padStart(2, '0');
        const monthStr = String(parsedDate.getMonth() + 1).padStart(2, '0');
        const yearBE = parsedDate.getFullYear() + 543;
        formattedDate = `${dayStr}/${monthStr}/${yearBE}`;
        year = yearBE;
        month = parsedDate.getMonth() + 1;
      }
    }

    const picUrl = uploadedFileId
      ? `https://drive.google.com/file/d/${uploadedFileId}/view`
      : existingPicUrl || '';

    const rowData = [
      formattedDate,
      input.item || '',
      input.quantity || 0,
      input.receiver || '',
      input.note || '',
      picUrl,
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${CONSUMABLES_TAB_NAME}'!B${targetRowIndex}:G${targetRowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [rowData],
      },
    });

    return {
      no,
      date: dateIso,
      dateDisplay: formattedDate,
      year,
      month,
      item: input.item || '',
      quantity: input.quantity || 0,
      receiver: input.receiver || '',
      note: input.note || '',
      picUrl,
    };
  }

  async remove(no: number): Promise<void> {
    const sheets = getSheetsClient();
    if (!sheets) {
      throw new Error('Google Sheets client is not initialized');
    }

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${CONSUMABLES_TAB_NAME}'!A2:A2000`,
    });

    const rows = res.data.values || [];
    const rowIndex = rows.findIndex((row) => String(row[0]).trim() === String(no).trim());

    if (rowIndex === -1) {
      throw new Error(`ไม่พบรายการลำดับที่ ${no}`);
    }

    const targetRowIndex = rowIndex + 2;

    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${CONSUMABLES_TAB_NAME}'!A${targetRowIndex}:G${targetRowIndex}`,
    });
  }
}

let instancePromise: Promise<ConsumableRepository> | undefined;

export function getConsumableRepository(): Promise<ConsumableRepository> {
  if (!instancePromise) {
    instancePromise = Promise.resolve(new ConsumableRepository());
  }
  return instancePromise;
}
