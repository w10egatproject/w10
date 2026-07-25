import { describe, expect, it } from 'vitest';

import {
  filterAndSortOrders,
  formatThaiDate,
  getOrderStatus,
  isoToSheetSerial,
  paginateOrders,
  parseSheetRow,
  sheetDateToIso,
  summarizeOrders,
} from './domain';
import type { ShopOrder } from './types';

const makeOrder = (patch: Partial<ShopOrder> = {}): ShopOrder => ({
  no: 1,
  from: 'หสบ-ช.',
  to: 'หบพ-ช.',
  number: '123456',
  dateIn: '2026-07-01',
  subject: 'ทดสอบ',
  receivingUnit: 'W11',
  receiverName: '',
  dateOut: null,
  note: '',
  fileUrl: '',
  ...patch,
});

describe('Shop Order domain', () => {
  it('maps A-K, trims text, and derives status only from column I', () => {
    const order = parseSheetRow([
      '7',
      ' หสบ-ช. ',
      ' หบพ-ช. ',
      123456,
      '01/07/2569',
      ' เรื่อง ',
      ' W11 ',
      ' สมชาย ',
      '03/07/2569',
      ' หมายเหตุ ',
      ' https://drive.google.com/file/d/x/view ',
      'ignored',
    ]);

    expect(order).toEqual({
      no: 7,
      from: 'หสบ-ช.',
      to: 'หบพ-ช.',
      number: '123456',
      dateIn: '2026-07-01',
      subject: 'เรื่อง',
      receivingUnit: 'W11',
      receiverName: 'สมชาย',
      dateOut: '2026-07-03',
      note: 'หมายเหตุ',
      fileUrl: 'https://drive.google.com/file/d/x/view',
    });
    expect(getOrderStatus(makeOrder({ note: 'เสร็จแล้ว' }))).toBe('wait');
    expect(getOrderStatus(makeOrder({ dateOut: '2026-07-03' }))).toBe('done');
  });

  it('round-trips Google serial dates and displays Buddhist Era dates', () => {
    expect(sheetDateToIso('03/07/2569')).toBe('2026-07-03');
    expect(sheetDateToIso('03/07/2026')).toBe('2026-07-03');
    expect(sheetDateToIso(isoToSheetSerial('2026-07-03'))).toBe('2026-07-03');
    expect(formatThaiDate('2026-07-03')).toBe('03/07/2569');
    expect(sheetDateToIso('')).toBeNull();
    expect(isoToSheetSerial(null)).toBeNull();
  });

  it('rejects impossible dates instead of allowing JavaScript normalization', () => {
    expect(() => sheetDateToIso('31/02/2569')).toThrow(
      'วันที่ไม่ถูกต้อง',
    );
    expect(() => sheetDateToIso('2025-02-29')).toThrow(
      'วันที่ไม่ถูกต้อง',
    );
    expect(() => isoToSheetSerial('2026-13-01')).toThrow(
      'วันที่ไม่ถูกต้อง',
    );
  });

  it('searches all user-visible text and applies date and status filters', () => {
    const orders = [
      makeOrder({ no: 1, receivingUnit: 'W11' }),
      makeOrder({
        no: 3,
        dateIn: '2026-07-02',
        dateOut: '2026-07-03',
        receivingUnit: 'W12',
        note: 'ค้นเจอ',
      }),
      makeOrder({
        no: 2,
        dateIn: '2025-12-01',
        subject: 'ไม่ตรง',
        fileUrl: 'https://drive.example/ค้นเจอ',
      }),
    ];

    expect(
      filterAndSortOrders(orders, {
        query: 'ค้นเจอ',
        year: 'all',
        month: 'all',
        status: 'all',
      }).map(({ no }) => no),
    ).toEqual([3, 2]);

    expect(
      filterAndSortOrders(orders, {
        query: '',
        year: '2569',
        month: '7',
        status: 'done',
      }).map(({ no }) => no),
    ).toEqual([3]);
  });

  it('filters and summarizes the identical result with deterministic ties', () => {
    const filtered = filterAndSortOrders(
      [
        makeOrder({ no: 1, receivingUnit: 'W11' }),
        makeOrder({
          no: 3,
          dateOut: '2026-07-03',
          receivingUnit: 'W12',
        }),
        makeOrder({ no: 2, subject: 'ไม่ตรง' }),
      ],
      {
        query: 'ทดสอบ',
        year: '2569',
        month: '7',
        status: 'all',
      },
    );

    expect(filtered.map(({ no }) => no)).toEqual([3, 1]);
    expect(summarizeOrders(filtered)).toEqual({
      total: 2,
      wait: 1,
      done: 1,
      popularUnits: [
        { name: 'W11', count: 1 },
        { name: 'W12', count: 1 },
      ],
    });
  });

  it('keeps a 10,000-row result but returns a bounded page and six ranks', () => {
    const orders = Array.from({ length: 10_000 }, (_, index) =>
      makeOrder({
        no: index + 1,
        receivingUnit: `W${index % 20}`,
      }),
    );
    const filtered = filterAndSortOrders(orders, {
      query: '',
      year: 'all',
      month: 'all',
      status: 'all',
    });

    expect(filtered).toHaveLength(10_000);
    expect(filtered[0].no).toBe(10_000);
    expect(paginateOrders(filtered, 1, 20)).toMatchObject({
      page: 1,
      pageSize: 20,
      total: 10_000,
      totalPages: 500,
    });
    expect(paginateOrders(filtered, 1, 20).items).toHaveLength(20);
    expect(summarizeOrders(filtered).popularUnits).toHaveLength(6);
  });

  it('normalizes invalid pagination requests and handles empty results', () => {
    expect(paginateOrders([], 99, 0)).toEqual({
      items: [],
      page: 1,
      pageSize: 1,
      total: 0,
      totalPages: 1,
    });

    const orders = [makeOrder({ no: 1 }), makeOrder({ no: 2 })];
    expect(paginateOrders(orders, 99, 1)).toMatchObject({
      page: 2,
      items: [orders[1]],
    });
    expect(summarizeOrders([])).toEqual({
      total: 0,
      wait: 0,
      done: 0,
      popularUnits: [],
    });
  });
});
