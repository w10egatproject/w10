import { describe, expect, it, vi } from 'vitest';
import { DELETE, GET, PATCH, POST } from './route';

vi.mock('@/lib/consumables/repository', () => ({
  getConsumableRepository: vi.fn().mockResolvedValue({
    load: vi.fn().mockResolvedValue({
      items: [
        {
          no: 1,
          date: '2026-08-17',
          dateDisplay: '17/08/2569',
          year: 2569,
          month: 8,
          item: 'ปากกาเคมี',
          quantity: 10,
          receiver: 'วิริญดา',
          note: '',
          picUrl: '',
        },
      ],
      receivers: ['วิริญดา'],
      generatedAt: '2026-08-17T14:00:00Z',
    }),
    create: vi.fn().mockImplementation((input: any) =>
      Promise.resolve({
        no: 2,
        date: input.date,
        dateDisplay: '17/08/2569',
        year: 2569,
        month: 8,
        item: input.item,
        quantity: input.quantity,
        receiver: input.receiver,
        note: input.note,
        picUrl: '',
      }),
    ),
    update: vi.fn().mockImplementation((no: number, input: any) =>
      Promise.resolve({
        no,
        date: input.date,
        dateDisplay: '17/08/2569',
        year: 2569,
        month: 8,
        item: input.item,
        quantity: input.quantity,
        receiver: input.receiver,
        note: input.note,
        picUrl: '',
      }),
    ),
    remove: vi.fn().mockResolvedValue(undefined),
  }),
}));

describe('/api/consumables route handlers', () => {
  it('GET returns bootstrap data', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.items).toHaveLength(1);
    expect(json.data.items[0].item).toBe('ปากกาเคมี');
  });

  it('POST validates input and creates consumable item', async () => {
    const req = new Request('http://localhost/api/consumables', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        item: {
          date: '2026-08-17',
          item: 'สมุดบันทึก',
          quantity: 5,
          receiver: 'พรชนะ',
          note: 'ใช้ในงานประชุม',
        },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.item).toBe('สมุดบันทึก');
  });

  it('PATCH updates consumable item', async () => {
    const req = new Request('http://localhost/api/consumables', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        no: 1,
        item: {
          date: '2026-08-17',
          item: 'สมุดบันทึก (แก้ไข)',
          quantity: 10,
          receiver: 'พรชนะ',
          note: '',
        },
      }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.item).toBe('สมุดบันทึก (แก้ไข)');
  });

  it('DELETE removes consumable item', async () => {
    const req = new Request('http://localhost/api/consumables', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ no: 1 }),
    });

    const res = await DELETE(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.no).toBe(1);
  });
});
