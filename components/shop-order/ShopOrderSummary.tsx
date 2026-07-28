'use client';
import { useEffect, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import type { ShopOrderFilters, ShopOrderSummary as Summary } from '@/lib/shop-order/types';

interface ShopOrderSummaryProps {
  summary: Summary;
  activeStatus?: ShopOrderFilters['status'];
  onStatusSelect?: (status: ShopOrderFilters['status']) => void;
}

export function ShopOrderSummary({
  summary,
  activeStatus = 'all',
  onStatusSelect,
}: ShopOrderSummaryProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const chart = [
    { name: 'รอดำเนินการ', value: summary.wait },
    { name: 'เสร็จสิ้น', value: summary.done },
  ];
  const donePercent = summary.total
    ? Math.round((summary.done * 100) / summary.total)
    : 0;

  const kpis: Array<{
    label: string;
    value: number;
    color: string;
    testId: string;
    status: ShopOrderFilters['status'];
  }> = [
    {
      label: 'ทั้งหมด',
      value: summary.total,
      color: 'text-indigo-700',
      testId: 'kpi-total',
      status: 'all',
    },
    {
      label: 'รอดำเนินการ',
      value: summary.wait,
      color: 'text-amber-700',
      testId: 'kpi-wait',
      status: 'wait',
    },
    {
      label: 'เสร็จสิ้น',
      value: summary.done,
      color: 'text-emerald-700',
      testId: 'kpi-done',
      status: 'done',
    },
  ];

  const maxUnitCount = summary.popularUnits[0]?.count || 1;

  return (
    <aside className="space-y-4" aria-label="สรุปรายการ">
      <div className="grid grid-cols-3 gap-2 lg:grid-cols-1 xl:grid-cols-3">
        {kpis.map(({ label, value, color, testId, status }) => {
          const isActive = activeStatus === status;
          return (
            <button
              type="button"
              key={label}
              data-testid={testId}
              onClick={() => onStatusSelect?.(status)}
              className={`rounded-2xl p-3 text-left transition-all shadow-sm ${
                isActive
                  ? 'border-2 border-indigo-600 bg-indigo-50/70 shadow-md ring-2 ring-indigo-500/20'
                  : 'border border-transparent bg-white hover:border-slate-300 hover:shadow-md'
              }`}
            >
              <strong className={`block text-2xl ${color}`}>{value}</strong>
              <span className="text-xs font-bold text-slate-700">{label}</span>
            </button>
          );
        })}
      </div>
      <section
        data-testid="status-summary"
        className="rounded-2xl bg-slate-950 p-4 text-white shadow-sm"
      >
        <h2 className="text-sm font-bold text-white">สรุปสถานะ</h2>
        <div className="relative mx-auto h-44 max-w-56">
          {isMounted && (
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <PieChart>
                <Pie
                  data={chart}
                  dataKey="value"
                  innerRadius={48}
                  outerRadius={67}
                  strokeWidth={0}
                >
                  <Cell fill="#f59e0b" />
                  <Cell fill="#10b981" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <strong className="text-xl">{donePercent}%</strong>
            <span className="text-[10px] text-slate-300">เสร็จสิ้น</span>
          </div>
        </div>
        <div className="space-y-2 text-xs">
          <p className="flex justify-between">
            <span>
              <i className="mr-2 inline-block h-2 w-2 rounded-full bg-amber-500" />
              รอดำเนินการ
            </span>
            <b>{summary.wait} รายการ</b>
          </p>
          <p className="flex justify-between">
            <span>
              <i className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-500" />
              เสร็จสิ้น
            </span>
            <b>{summary.done} รายการ</b>
          </p>
        </div>
      </section>
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-bold text-slate-800">
          หน่วยงานยอดนิยม
        </h2>
        {summary.popularUnits.length ? (
          <ol className="space-y-3 text-sm">
            {summary.popularUnits.map((unit, index) => {
              const percent = Math.min(
                100,
                Math.max(4, Math.round((unit.count / maxUnitCount) * 100)),
              );
              return (
                <li key={unit.name} className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-700">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium text-slate-700">
                      {unit.name}
                    </span>
                    <b className="text-slate-900">{unit.count}</b>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="text-sm text-slate-500">ยังไม่มีข้อมูลหน่วยงาน</p>
        )}
      </section>
    </aside>
  );
}
