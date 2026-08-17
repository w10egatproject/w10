import { describe, expect, it } from 'vitest';
import {
  filterAndSortConsumables,
  formatThaiDate,
  getMonthThaiLabel,
  normalizeDate,
  paginateConsumables,
  parseSheetRow,
  summarizeConsumables,
} from './domain';
import type { ConsumableItem } from './types';

describe('Consumables domain helpers', () => {
  describe('normalizeDate', () => {
    it('parses yyyy-MM-dd correctly', () => {
      const d = normalizeDate('2026-08-17');
      expect(d).not.toBeNull();
      expect(d?.getFullYear()).toBe(2026);
      expect(d?.getMonth()).toBe(7); // August = 7
      expect(d?.getDate()).toBe(17);
    });

    it('parses dd/MM/yyyy (BE year) correctly', () => {
      const d = normalizeDate('17/08/2569');
      expect(d).not.toBeNull();
      expect(d?.getFullYear()).toBe(2026);
      expect(d?.getMonth()).toBe(7);
      expect(d?.getDate()).toBe(17);
    });

    it('returns null for invalid date formats', () => {
      expect(normalizeDate('')).toBeNull();
      expect(normalizeDate('-')).toBeNull();
      expect(normalizeDate('invalid')).toBeNull();
    });
  });

  describe('formatThaiDate', () => {
    it('formats Date to dd/MM/yyyy in BE', () => {
      const date = new Date(2026, 7, 17);
      expect(formatThaiDate(date)).toBe('17/08/2569');
    });
  });

  describe('parseSheetRow', () => {
    it('parses a valid sheet row into ConsumableItem', () => {
      const row = [1, '17/08/2569', 'ปากกาเคมี', 10, 'วิริญดา', 'หมายเหตุทดสอบ', 'https://drive.google.com/pic.jpg'];
      const parsed = parseSheetRow(row);
      expect(parsed).toEqual({
        no: 1,
        date: '2026-08-17',
        dateDisplay: '17/08/2569',
        year: 2569,
        month: 8,
        item: 'ปากกาเคมี',
        quantity: 10,
        receiver: 'วิริญดา',
        note: 'หมายเหตุทดสอบ',
        picUrl: 'https://drive.google.com/pic.jpg',
      });
    });

    it('returns null for completely empty rows', () => {
      expect(parseSheetRow(['', '', '', '', '', '', ''])).toBeNull();
    });
  });

  describe('filterAndSortConsumables', () => {
    const mockItems: ConsumableItem[] = [
      {
        no: 1,
        date: '2026-01-10',
        dateDisplay: '10/01/2569',
        year: 2569,
        month: 1,
        item: 'ปากกา',
        quantity: 5,
        receiver: 'วิริญดา',
        note: '',
        picUrl: '',
      },
      {
        no: 2,
        date: '2026-02-15',
        dateDisplay: '15/02/2569',
        year: 2569,
        month: 2,
        item: 'กระดาษ A4',
        quantity: 20,
        receiver: 'พรชนะ',
        note: 'ด่วน',
        picUrl: '',
      },
      {
        no: 3,
        date: '2025-12-20',
        dateDisplay: '20/12/2568',
        year: 2568,
        month: 12,
        item: 'เทปกาว',
        quantity: 3,
        receiver: 'วิริญดา',
        note: '',
        picUrl: '',
      },
    ];

    it('filters by query search term', () => {
      const result = filterAndSortConsumables(mockItems, { query: 'กระดาษ', year: 'all', month: 'all' });
      expect(result).toHaveLength(1);
      expect(result[0].item).toBe('กระดาษ A4');
    });

    it('filters by year', () => {
      const result = filterAndSortConsumables(mockItems, { query: '', year: '2569', month: 'all' });
      expect(result).toHaveLength(2);
    });

    it('sorts by no descending by default', () => {
      const result = filterAndSortConsumables(mockItems, { query: '', year: 'all', month: 'all' });
      expect(result.map((r) => r.no)).toEqual([3, 2, 1]);
    });
  });

  describe('summarizeConsumables', () => {
    const mockItems: ConsumableItem[] = [
      { no: 1, date: '2026-01-10', dateDisplay: '10/01/2569', year: 2569, month: 1, item: 'ปากกา', quantity: 5, receiver: 'วิริญดา', note: '', picUrl: '' },
      { no: 2, date: '2026-02-15', dateDisplay: '15/02/2569', year: 2569, month: 2, item: 'ปากกา', quantity: 15, receiver: 'พรชนะ', note: '', picUrl: '' },
      { no: 3, date: '2026-03-01', dateDisplay: '01/03/2569', year: 2569, month: 3, item: 'กระดาษ', quantity: 10, receiver: 'วิริญดา', note: '', picUrl: '' },
    ];

    it('calculates total items and quantity sum', () => {
      const summary = summarizeConsumables(mockItems);
      expect(summary.totalItems).toBe(3);
      expect(summary.totalQuantity).toBe(30);
      expect(summary.topItems[0]).toEqual({ name: 'ปากกา', quantity: 20 });
      expect(summary.topReceivers[0]).toEqual({ name: 'วิริญดา', quantity: 15 });
    });
  });

  describe('paginateConsumables', () => {
    const mockItems: ConsumableItem[] = Array.from({ length: 50 }, (_, i) => ({
      no: i + 1,
      date: '2026-01-01',
      dateDisplay: '01/01/2569',
      year: 2569,
      month: 1,
      item: `Item ${i + 1}`,
      quantity: 1,
      receiver: 'Test',
      note: '',
      picUrl: '',
    }));

    it('paginates items into pages of specified size', () => {
      const page1 = paginateConsumables(mockItems, 1, 20);
      expect(page1.items).toHaveLength(20);
      expect(page1.totalPages).toBe(3);
      expect(page1.page).toBe(1);

      const page3 = paginateConsumables(mockItems, 3, 20);
      expect(page3.items).toHaveLength(10);
    });
  });

  describe('getMonthThaiLabel', () => {
    it('returns correct Thai month short label', () => {
      expect(getMonthThaiLabel(1)).toBe('ม.ค.');
      expect(getMonthThaiLabel(8)).toBe('ส.ค.');
      expect(getMonthThaiLabel(12)).toBe('ธ.ค.');
    });
  });
});
