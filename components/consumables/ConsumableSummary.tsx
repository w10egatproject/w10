'use client';

import type { ConsumableSummary } from '@/lib/consumables/types';

interface Props {
  summary: ConsumableSummary;
}

const DONUT_COLORS = [
  '#22c55e',
  '#6366f1',
  '#f59e0b',
  '#0d9488',
  '#e64545',
  '#94a3b8',
];

export function ConsumableSummaryComponent({ summary }: Props) {
  const maxReceiverQty = summary.topReceivers.length > 0 ? summary.topReceivers[0].quantity : 1;

  return (
    <aside className="sticky top-20 flex w-full flex-col gap-4 lg:w-80 lg:shrink-0">
      {/* KPI Mini Cards */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-2xl border-2 border-slate-200 bg-white p-4 text-center shadow-sm transition-all hover:border-slate-300">
          <div className="text-3xl font-black text-slate-800">
            {summary.totalItems.toLocaleString()}
          </div>
          <div className="mt-1 text-xs font-semibold text-slate-500">
            ทั้งหมด (รายการ)
          </div>
        </div>
        <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50/50 p-4 text-center shadow-sm transition-all hover:border-emerald-400">
          <div className="text-3xl font-black text-emerald-700">
            {summary.totalQuantity.toLocaleString()}
          </div>
          <div className="mt-1 text-xs font-semibold text-emerald-800">
            จำนวนรวม (ชิ้น)
          </div>
        </div>
      </div>

      {/* Donut Panel (Dark Gradient) */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 text-white shadow-xl">
        <h3 className="mb-4 text-sm font-bold text-slate-200">สรุปการเบิก</h3>
        
        <div className="relative mb-4 flex h-44 items-center justify-center">
          {/* Custom SVG Donut Chart */}
          <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 36 36">
            <path
              className="text-slate-800"
              strokeWidth="4"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            {summary.topItems.length > 0 &&
              (() => {
                let accumulatedPercent = 0;
                return summary.topItems.map((item, idx) => {
                  const percent = summary.totalQuantity > 0
                    ? (item.quantity / summary.totalQuantity) * 100
                    : 0;
                  const strokeDasharray = `${percent} ${100 - percent}`;
                  const strokeDashoffset = 100 - accumulatedPercent;
                  accumulatedPercent += percent;
                  return (
                    <path
                      key={item.name}
                      stroke={DONUT_COLORS[idx % DONUT_COLORS.length]}
                      strokeWidth="4.2"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  );
                });
              })()}
          </svg>
          <div className="absolute text-center pointer-events-none">
            <div className="text-2xl font-black text-white">
              {summary.totalQuantity.toLocaleString()}
            </div>
            <div className="text-[11px] font-semibold text-slate-400">
              รวมทั้งหมด (ชิ้น)
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-2">
          {summary.topItems.length === 0 ? (
            <div className="text-center text-xs text-slate-400">ไม่มีข้อมูล</div>
          ) : (
            summary.topItems.map((item, idx) => (
              <div
                key={item.name}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: DONUT_COLORS[idx % DONUT_COLORS.length],
                    }}
                  />
                  <span className="font-semibold text-slate-300 truncate max-w-[140px]">
                    {item.name}
                  </span>
                </div>
                <span className="font-bold text-white">
                  {item.quantity.toLocaleString()} ชิ้น
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Receiver Ranking Panel */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-bold text-slate-900">
          ผู้เบิกของมากที่สุด
        </h3>
        {summary.topReceivers.length === 0 ? (
          <div className="text-xs text-slate-400">ไม่มีข้อมูล</div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {summary.topReceivers.map((rec, idx) => {
              const pct = Math.round((rec.quantity / maxReceiverQty) * 100);
              return (
                <div key={rec.name} className="flex items-center gap-2 text-xs">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-[11px] font-black text-emerald-700">
                    {idx + 1}
                  </div>
                  <div
                    className="w-24 shrink-0 truncate font-semibold text-slate-800"
                    title={rec.name}
                  >
                    {rec.name}
                  </div>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="w-8 shrink-0 text-right font-black text-slate-700">
                    {rec.quantity}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
