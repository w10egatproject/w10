import type {
  ShopOrder,
  ShopOrderFilters,
  ShopOrderStatus,
  ShopOrderSummary,
} from './types';

const MILLISECONDS_PER_DAY = 86_400_000;
const GOOGLE_SHEETS_UNIX_EPOCH_SERIAL = 25_569;
const INVALID_DATE_MESSAGE = 'วันที่ไม่ถูกต้อง';

interface DateParts {
  year: number;
  month: number;
  day: number;
}

export interface PaginatedOrders {
  items: ShopOrder[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

function assertValidDate(parts: DateParts): DateParts {
  const { year, month, day } = parts;
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    year < 1
  ) {
    throw new Error(INVALID_DATE_MESSAGE);
  }

  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error(INVALID_DATE_MESSAGE);
  }

  return parts;
}

function parseIsoDate(value: string): DateParts {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    throw new Error(INVALID_DATE_MESSAGE);
  }

  return assertValidDate({
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  });
}

function partsToIso({ year, month, day }: DateParts): string {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function serialToDateParts(serial: number): DateParts {
  if (!Number.isFinite(serial)) {
    throw new Error(INVALID_DATE_MESSAGE);
  }

  const timestamp =
    (Math.trunc(serial) - GOOGLE_SHEETS_UNIX_EPOCH_SERIAL) *
    MILLISECONDS_PER_DAY;
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    throw new Error(INVALID_DATE_MESSAGE);
  }

  return assertValidDate({
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  });
}

export function sheetDateToIso(value: unknown): string | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'number') {
    return partsToIso(serialToDateParts(value));
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new Error(INVALID_DATE_MESSAGE);
    }

    return partsToIso(
      assertValidDate({
        year: value.getUTCFullYear(),
        month: value.getUTCMonth() + 1,
        day: value.getUTCDate(),
      }),
    );
  }

  const normalized = String(value).trim();
  if (!normalized) {
    return null;
  }

  if (/^-?\d+(?:\.\d+)?$/.test(normalized)) {
    return partsToIso(serialToDateParts(Number(normalized)));
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return partsToIso(parseIsoDate(normalized));
  }

  const displayMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(normalized);
  if (!displayMatch) {
    throw new Error(INVALID_DATE_MESSAGE);
  }

  const displayedYear = Number(displayMatch[3]);
  return partsToIso(
    assertValidDate({
      year: displayedYear >= 2400 ? displayedYear - 543 : displayedYear,
      month: Number(displayMatch[2]),
      day: Number(displayMatch[1]),
    }),
  );
}

export function isoToSheetSerial(value: string | null): number | null {
  if (value === null || value === '') {
    return null;
  }

  const { year, month, day } = parseIsoDate(value);
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);

  return (
    Math.floor(date.getTime() / MILLISECONDS_PER_DAY) +
    GOOGLE_SHEETS_UNIX_EPOCH_SERIAL
  );
}

export function formatThaiDate(value: string | null | undefined): string {
  if (!value) {
    return '';
  }

  const { year, month, day } = parseIsoDate(value);
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year + 543}`;
}

function textCell(value: unknown): string {
  return value === null || value === undefined ? '' : String(value).trim();
}

export function parseSheetRow(row: readonly unknown[]): ShopOrder {
  const numericNo = Number(row[0]);

  return {
    no: Number.isFinite(numericNo) ? Math.trunc(numericNo) : 0,
    from: textCell(row[1]),
    to: textCell(row[2]),
    number: textCell(row[3]),
    dateIn: sheetDateToIso(row[4]),
    subject: textCell(row[5]),
    receivingUnit: textCell(row[6]),
    receiverName: textCell(row[7]),
    dateOut: sheetDateToIso(row[8]),
    note: textCell(row[9]),
    fileUrl: textCell(row[10]),
    repairFileUrl: textCell(row[11]),
  };
}

export function getOrderStatus(order: ShopOrder): ShopOrderStatus {
  return order.dateOut ? 'done' : 'wait';
}

function matchesQuery(order: ShopOrder, query: string): boolean {
  if (!query) {
    return true;
  }

  const searchableValues = [
    order.no,
    order.from,
    order.to,
    order.number,
    order.subject,
    order.receivingUnit,
    order.receiverName,
    order.note,
    order.fileUrl,
    order.repairFileUrl,
  ];

  return searchableValues.some((value) =>
    String(value).toLocaleLowerCase('th-TH').includes(query),
  );
}

function matchesDateFilters(
  dateIn: string | null,
  filters: ShopOrderFilters,
): boolean {
  if (filters.year === 'all' && filters.month === 'all') {
    return true;
  }

  if (!dateIn) {
    return false;
  }

  const { year, month } = parseIsoDate(dateIn);
  return (
    (filters.year === 'all' || String(year + 543) === filters.year) &&
    (filters.month === 'all' || String(month) === filters.month)
  );
}

export function filterAndSortOrders(
  orders: readonly ShopOrder[],
  filters: ShopOrderFilters,
): ShopOrder[] {
  const query = filters.query.trim().toLocaleLowerCase('th-TH');
  const filtered: ShopOrder[] = [];

  for (const order of orders) {
    if (
      matchesQuery(order, query) &&
      matchesDateFilters(order.dateIn, filters) &&
      (filters.status === 'all' ||
        getOrderStatus(order) === filters.status)
    ) {
      filtered.push(order);
    }
  }

  return filtered.sort((left, right) => right.no - left.no);
}

export function paginateOrders(
  orders: readonly ShopOrder[],
  requestedPage: number,
  requestedPageSize: number,
): PaginatedOrders {
  const pageSize = Number.isFinite(requestedPageSize)
    ? Math.max(1, Math.trunc(requestedPageSize))
    : 1;
  const total = orders.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const normalizedPage = Number.isFinite(requestedPage)
    ? Math.max(1, Math.trunc(requestedPage))
    : 1;
  const page = Math.min(normalizedPage, totalPages);
  const start = (page - 1) * pageSize;

  return {
    items: orders.slice(start, start + pageSize),
    page,
    pageSize,
    total,
    totalPages,
  };
}

export function summarizeOrders(
  orders: readonly ShopOrder[],
): ShopOrderSummary {
  let wait = 0;
  let done = 0;
  const unitCounts = new Map<string, number>();

  for (const order of orders) {
    if (getOrderStatus(order) === 'done') {
      done += 1;
    } else {
      wait += 1;
    }

    const unit = order.receivingUnit.trim();
    if (unit) {
      unitCounts.set(unit, (unitCounts.get(unit) ?? 0) + 1);
    }
  }

  const popularUnits = Array.from(unitCounts, ([name, count]) => ({
    name,
    count,
  }))
    .sort(
      (left, right) =>
        right.count - left.count || left.name.localeCompare(right.name, 'th'),
    )
    .slice(0, 6);

  return {
    total: orders.length,
    wait,
    done,
    popularUnits,
  };
}
