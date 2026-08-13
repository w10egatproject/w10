import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OrderFormDialog } from './OrderFormDialog';

afterEach(cleanup);

describe('Shop Order create form validation', () => {
  it('requires every create field except the note and attachment', () => {
    render(
      <OrderFormDialog
        mode="create"
        departments={['กอง ก']}
        receivers={['สมชาย']}
        pending={false}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('ถึง')).toHaveProperty('required', true);
    expect(screen.getByLabelText('เลขที่')).toHaveProperty('required', true);
    expect(screen.getByLabelText(/วันที่รับ/)).toHaveProperty('required', true);
    expect(screen.getByLabelText(/วันที่ออก/)).toHaveProperty('required', true);
    expect(screen.getByLabelText('เรื่อง')).toHaveProperty('required', true);
    expect(screen.getByLabelText(/หน่วยงานรับ/)).toHaveProperty('required', true);
    expect(screen.getByLabelText(/ผู้รับ/)).toHaveProperty('required', true);
    expect(screen.getByLabelText(/หมายเหตุ/)).toHaveProperty('required', false);
    expect(screen.getByLabelText(/ไฟล์แนบ/)).toHaveProperty('required', false);
  });

  it('does not make pending-order fields required while editing', () => {
    render(
      <OrderFormDialog
        mode="edit"
        order={{
          no: 1,
          from: 'ส่วนกลาง',
          to: 'กอง ก',
          number: '123456',
          dateIn: '2026-08-03',
          subject: 'งานเดิม',
          receivingUnit: '',
          receiverName: '',
          dateOut: null,
          note: '',
          fileUrl: '',
          repairFileUrl: '',
        }}
        departments={['กอง ก']}
        receivers={['สมชาย']}
        pending={false}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByLabelText(/วันที่ออก/)).toHaveProperty('required', false);
    expect(screen.getByLabelText(/หน่วยงานรับ/)).toHaveProperty('required', false);
    expect(screen.getByLabelText(/ผู้รับ/)).toHaveProperty('required', false);
  });
});
