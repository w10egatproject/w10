'use client';

import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NumberTicker } from '@/components/magicui/number-ticker';
import type { ConsumableSummary } from '@/lib/consumables/types';

const HighchartsClient = dynamic(
  () => import('@/components/charts/HighchartsClient'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-44 items-center justify-center rounded-2xl bg-slate-800/80 text-xs font-bold uppercase tracking-wider text-slate-400">
        Loading 3D Chart...
      </div>
    ),
  },
);

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
  const maxReceiverQty =
    summary.topReceivers.length > 0 ? summary.topReceivers[0].quantity : 1;

  const chartOptions = {
    chart: {
      type: 'pie',
      options3d: {
        enabled: true,
        alpha: 45,
        beta: 0,
      },
      backgroundColor: 'transparent',
      height: 180,
      margin: [0, 0, 0, 0],
      spacing: [0, 0, 0, 0],
    },
    title: { text: '' },
    credits: { enabled: false },
    tooltip: {
      backgroundColor: '#1e293b',
      borderColor: '#334155',
      style: {
        color: '#ffffff',
        fontFamily: 'Inter, Noto Sans Thai, sans-serif',
        fontSize: '12px',
      },
      pointFormat: '<b>{point.y} ชิ้น</b> ({point.percentage:.1f}%)',
    },
    plotOptions: {
      pie: {
        innerSize: '55%',
        depth: 35,
        dataLabels: { enabled: false },
        showInLegend: false,
        borderWidth: 0,
      },
    },
    series: [
      {
        name: 'จำนวนเบิก',
        data: summary.topItems.map((item, idx) => ({
          name: item.name,
          y: item.quantity,
          color: DONUT_COLORS[idx % DONUT_COLORS.length],
        })),
      },
    ],
  };

  return (
    <aside
      className="flex w-full flex-col gap-4 lg:w-80 lg:shrink-0"
      aria-label="สรุปรายการ Consumables"
    >
      {/* KPI Mini Cards */}
      <div className="grid grid-cols-2 gap-2.5">
        <Card className="shadow-sm transition-all hover:border-slate-300">
          <CardContent className="p-4 text-center">
            <NumberTicker value={summary.totalItems} className="text-3xl font-black text-slate-800 tracking-tight" />
            <div className="mt-1 text-xs font-bold text-slate-500">
              ทั้งหมด (รายการ)
            </div>
          </CardContent>
        </Card>
        <Card className="border-emerald-300 bg-emerald-50/70 shadow-sm transition-all hover:border-emerald-400">
          <CardContent className="p-4 text-center">
            <NumberTicker value={summary.totalQuantity} className="text-3xl font-black text-emerald-700 tracking-tight" />
            <div className="mt-1 text-xs font-bold text-emerald-800">
              จำนวนรวม (ชิ้น)
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3D Highcharts Donut Panel (Dark Theme) */}
      <Card className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white border-0 shadow-xl">
        <CardContent className="p-5">
          <h3 className="mb-3 text-sm font-bold text-slate-200">
            สรุปการเบิก (3D Chart)
          </h3>

        <div className="relative mb-3 h-44 w-full">
          {summary.topItems.length > 0 ? (
            <HighchartsClient options={chartOptions} />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-slate-400">
              ไม่มีข้อมูล
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <NumberTicker value={summary.totalQuantity} className="text-xl font-black text-white tracking-tight" />
            <span className="text-[10px] font-bold text-slate-400">
              ชิ้นรวม
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-2 border-t border-slate-800 pt-3">
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
        </CardContent>
      </Card>

      {/* Receiver Ranking Panel (Image 2 style layout) */}
      <Card className="shadow-sm flex-1 flex flex-col">
        <CardHeader className="p-5 pb-0 mb-4">
          <CardTitle className="text-sm font-bold text-slate-900">
            ผู้เบิกของมากที่สุด
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0 flex-1 flex flex-col">
        {summary.topReceivers.length === 0 ? (
          <div className="text-xs text-slate-400">ไม่มีข้อมูล</div>
        ) : (
          <ol className="space-y-3.5 text-sm">
            {summary.topReceivers.map((rec, idx) => {
              const pct = Math.min(
                100,
                Math.max(4, Math.round((rec.quantity / maxReceiverQty) * 100)),
              );
              return (
                <li key={rec.name} className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-700">
                      {idx + 1}
                    </span>
                    <span
                      className="min-w-0 flex-1 truncate font-semibold text-slate-800"
                      title={rec.name}
                    >
                      {rec.name}
                    </span>
                    <b className="text-slate-900 font-black">{rec.quantity}</b>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ol>
        )}
        </CardContent>
      </Card>
    </aside>
  );
}
