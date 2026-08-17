import type {
  ConsumableFilters,
  ConsumableItem,
  ConsumableSummary,
} from './types';

const MONTH_NAMES_TH = [
  'ม.ค.',
  'ก.พ.',
  'มี.ค.',
  'เม.ย.',
  'พ.ค.',
  'มิ.ย.',
  'ก.ค.',
  'ส.ค.',
  'ก.ย.',
  'ต.ค.',
  'พ.ย.',
  'ธ.ค.',
];

export function normalizeDate(value: unknown): Date | null {
  if (!value) return null;

  if (Object.prototype.toString.call(value) === '[object Date]') {
    const d = value as Date;
    if (isNaN(d.getTime())) return null;
    let year = d.getFullYear();
    if (year > 2400) year -= 543;
    if (year < 1900 || year > 2200) return null;
    return new Date(year, d.getMonth(), d.getDate());
  }

  // Handle Google Sheet serial numbers (days since 1899-12-30)
  if (typeof value === 'number') {
    if (isNaN(value) || value < 1) return null;
    const epoch = new Date(1899, 11, 30);
    const date = new Date(epoch.getTime() + value * 86400000);
    if (isNaN(date.getTime())) return null;
    let year = date.getFullYear();
    if (year > 2400) year -= 543;
    if (year < 1900 || year > 2200) return null;
    return date;
  }

  const str = String(value).trim();
  if (!str || str === '-') return null;

  const parts = str.split(/[\/\-\.]/);
  if (parts.length !== 3) return null;

  let day: number;
  let month: number;
  let year: number;

  if (parts[0].length === 4) {
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
    day = parseInt(parts[2], 10);
  } else {
    day = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
    year = parseInt(parts[2], 10);
  }

  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;

  if (year < 100) year += 2500;
  if (year > 2400) year -= 543;

  if (year < 1900 || year > 2200) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;

  const d = new Date(year, month - 1, day);
  if (isNaN(d.getTime())) return null;
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
    return null;
  }

  return d;
}

export function formatThaiDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear() + 543;
  return `${day}/${month}/${year}`;
}

export function isoFromDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseSheetRow(row: unknown[]): ConsumableItem | null {
  const no = Number(row[0]);
  const dateRaw = row[1];
  const item = row[2] ? String(row[2]).trim() : '';
  const quantity = row[3] !== undefined && row[3] !== null && row[3] !== '' ? Number(row[3]) : 0;
  const receiver = row[4] ? String(row[4]).trim() : '';
  const note = row[5] ? String(row[5]).trim() : '';
  const picUrl = row[6] ? String(row[6]).trim() : '';

  const isEmptyRow =
    !no && !dateRaw && !item && !quantity && !receiver && !note && !picUrl;
  if (isEmptyRow) return null;

  const parsedDate = normalizeDate(dateRaw);
  const dateIso = parsedDate ? isoFromDate(parsedDate) : null;
  const dateDisplay = parsedDate ? formatThaiDate(parsedDate) : '';
  const year = parsedDate ? parsedDate.getFullYear() + 543 : null;
  const month = parsedDate ? parsedDate.getMonth() + 1 : null;

  return {
    no: isNaN(no) ? 0 : no,
    date: dateIso,
    dateDisplay,
    year,
    month,
    item,
    quantity: isNaN(quantity) ? 0 : quantity,
    receiver,
    note,
    picUrl,
  };
}

export function filterAndSortConsumables(
  items: ConsumableItem[],
  filters: ConsumableFilters,
): ConsumableItem[] {
  const query = filters.query.trim().toLowerCase();

  return items
    .filter((d) => {
      if (filters.year !== 'all' && String(d.year) !== filters.year) {
        return false;
      }
      if (filters.month !== 'all' && String(d.month) !== filters.month) {
        return false;
      }
      if (query) {
        const haystack = [
          d.no,
          d.dateDisplay,
          d.item,
          d.receiver,
          d.note,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    })
    .sort((a, b) => b.no - a.no);
}

export function summarizeConsumables(items: ConsumableItem[]): ConsumableSummary {
  const totalItems = items.length;
  const totalQuantity = items.reduce((sum, d) => sum + (Number(d.quantity) || 0), 0);

  const qtyByItem: Record<string, number> = {};
  items.forEach((d) => {
    const name = d.item && d.item.trim() ? d.item.trim() : 'ไม่ระบุ';
    qtyByItem[name] = (qtyByItem[name] || 0) + (Number(d.quantity) || 0);
  });

  const itemEntries = Object.entries(qtyByItem).sort((a, b) => b[1] - a[1]);
  const topItems = itemEntries.slice(0, 5).map(([name, quantity]) => ({ name, quantity }));
  const restQty = itemEntries.slice(5).reduce((sum, [, q]) => sum + q, 0);
  if (restQty > 0) {
    topItems.push({ name: 'อื่นๆ', quantity: restQty });
  }

  const qtyByReceiver: Record<string, number> = {};
  items.forEach((d) => {
    const name = d.receiver && d.receiver.trim() ? d.receiver.trim() : 'ไม่ระบุ';
    qtyByReceiver[name] = (qtyByReceiver[name] || 0) + (Number(d.quantity) || 0);
  });

  const topReceivers = Object.entries(qtyByReceiver)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, quantity]) => ({ name, quantity }));

  return {
    totalItems,
    totalQuantity,
    topItems,
    topReceivers,
  };
}

export function paginateConsumables(
  items: ConsumableItem[],
  page: number,
  pageSize: number = 25,
) {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const pageItems = items.slice(startIdx, startIdx + pageSize);

  return {
    items: pageItems,
    page: currentPage,
    totalPages,
    totalItems,
    pageSize,
  };
}

export function getMonthThaiLabel(month: number): string {
  if (month < 1 || month > 12) return '';
  return MONTH_NAMES_TH[month - 1];
}
