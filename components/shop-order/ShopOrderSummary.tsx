'use client';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import type { ShopOrderSummary as Summary } from '@/lib/shop-order/types';

export function ShopOrderSummary({ summary }: { summary: Summary }) {
  const chart = [{ name: 'รอดำเนินการ', value: summary.wait }, { name: 'เสร็จสิ้น', value: summary.done }];
  const donePercent = summary.total ? Math.round(summary.done * 100 / summary.total) : 0;
  return (
    <aside className="space-y-4" aria-label="สรุปรายการ">
      <div className="grid grid-cols-3 gap-2 lg:grid-cols-1 xl:grid-cols-3">
        {[['ทั้งหมด', summary.total, 'text-indigo-700', 'kpi-total'], ['รอดำเนินการ', summary.wait, 'text-amber-700', 'kpi-wait'], ['เสร็จสิ้น', summary.done, 'text-emerald-700', 'kpi-done']].map(([label, value, color, testId]) =>
          <div key={String(label)} data-testid={String(testId)} className="rounded-2xl bg-white p-3 shadow-sm">
            <strong className={`block text-2xl ${color}`}>{value}</strong><span className="text-xs font-bold text-slate-700">{label}</span>
          </div>)}
      </div>
      <section data-testid="status-summary" className="rounded-2xl bg-slate-950 p-4 text-white shadow-sm">
        <h2 className="text-sm font-bold text-white">สรุปสถานะ</h2>
        <div className="relative mx-auto h-44 max-w-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart><Pie data={chart} dataKey="value" innerRadius={48} outerRadius={67} strokeWidth={0}>
              <Cell fill="#f59e0b" /><Cell fill="#10b981" />
            </Pie></PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <strong className="text-xl">{donePercent}%</strong><span className="text-[10px] text-slate-300">เสร็จสิ้น</span>
          </div>
        </div>
        <div className="space-y-2 text-xs">
          <p className="flex justify-between"><span><i className="mr-2 inline-block h-2 w-2 rounded-full bg-amber-500" />รอดำเนินการ</span><b>{summary.wait} รายการ</b></p>
          <p className="flex justify-between"><span><i className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-500" />เสร็จสิ้น</span><b>{summary.done} รายการ</b></p>
        </div>
      </section>
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-bold">หน่วยงานยอดนิยม</h2>
        {summary.popularUnits.length ? <ol className="space-y-2 text-sm">{summary.popularUnits.map((unit, index) =>
          <li key={unit.name} className="flex items-center gap-2"><span className="grid h-6 w-6 place-items-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-700">{index + 1}</span><span className="min-w-0 flex-1 truncate">{unit.name}</span><b>{unit.count}</b></li>)}</ol>
          : <p className="text-sm text-slate-500">ยังไม่มีข้อมูลหน่วยงาน</p>}
      </section>
    </aside>
  );
}
