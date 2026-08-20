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
  selectedReceiver?: string;
  onSelectReceiver?: (receiver: string) => void;
  loading?: boolean;
}

const DONUT_COLORS = [
  '#22c55e',
  '#6366f1',
  '#f59e0b',
  '#0d9488',
  '#e64545',
  '#94a3b8',
];

export function ConsumableSummaryComponent({
  summary,
  selectedReceiver,
  onSelectReceiver,
  loading = false,
}: Props) {
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
      height: 140,
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
        innerSize: '52%',
        depth: 26,
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

  if (loading && summary.totalItems === 0) {
    return (
      <aside
        className="flex w-full flex-col gap-4 lg:w-80 lg:shrink-0 h-full"
        aria-label="สรุปรายการ Consumables"
      >
        <div className="grid grid-cols-2 gap-2.5">
          <Card className="shadow-sm p-4 text-center">
            <div className="h-8 w-16 bg-slate-200 animate-pulse rounded-lg mx-auto mb-2" />
            <div className="h-3 w-20 bg-slate-100 animate-pulse rounded mx-auto" />
          </Card>
          <Card className="shadow-sm p-4 text-center border-emerald-200 bg-emerald-50/50">
            <div className="h-8 w-16 bg-emerald-200/60 animate-pulse rounded-lg mx-auto mb-2" />
            <div className="h-3 w-20 bg-emerald-100 animate-pulse rounded mx-auto" />
          </Card>
        </div>
        <Card className="shadow-sm flex-1 p-4 flex flex-col gap-3">
          <div className="h-4 w-32 bg-slate-200 animate-pulse rounded" />
          <div className="space-y-2.5 mt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-8 w-full bg-slate-100 animate-pulse rounded-lg" />
            ))}
          </div>
        </Card>
        <Card className="bg-slate-900 text-white p-4 flex flex-col gap-3">
          <div className="h-4 w-28 bg-slate-800 animate-pulse rounded" />
          <div className="h-28 w-28 rounded-full border-4 border-slate-800 border-t-emerald-500 animate-spin mx-auto my-2" />
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="h-3 bg-slate-800 animate-pulse rounded" />
            <div className="h-3 bg-slate-800 animate-pulse rounded" />
          </div>
        </Card>
      </aside>
    );
  }

  return (
    <aside
      className="flex w-full flex-col gap-4 lg:w-80 lg:shrink-0 h-full"
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

      {/* Receiver Ranking Panel (Expanded to show 7-8 names) */}
      <Card className="shadow-sm flex flex-col transition-all">
        <CardHeader className="p-4 pb-0 mb-2 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900">
              ผู้เบิกของมากที่สุด
            </CardTitle>
            <p className="text-[11px] font-medium text-slate-400 mt-0.5">
              {selectedReceiver ? `กำลังกรอง: ${selectedReceiver}` : 'คลิกชื่อเพื่อกรองรายการ'}
            </p>
          </div>
          {selectedReceiver && onSelectReceiver && (
            <button
              type="button"
              onClick={() => onSelectReceiver('')}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
            >
              ล้าง
            </button>
          )}
        </CardHeader>
        <CardContent className="p-4 pt-0 flex flex-col">
        {summary.topReceivers.length === 0 ? (
          <div className="text-xs text-slate-400 py-2">ไม่มีข้อมูล</div>
        ) : (
          <ol className="max-h-[360px] overflow-y-auto pr-1 space-y-1.5 scrollbar-thin">
            {summary.topReceivers.map((rec, idx) => {
              const isSelected =
                selectedReceiver?.trim().toLowerCase() === rec.name.trim().toLowerCase();
              const pct = Math.min(
                100,
                Math.max(4, Math.round((rec.quantity / maxReceiverQty) * 100)),
              );
              return (
                <li
                  key={rec.name}
                  onClick={() => onSelectReceiver?.(rec.name)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectReceiver?.(rec.name);
                    }
                  }}
                  className={`group relative rounded-xl p-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50 border border-emerald-500 shadow-sm'
                      : 'hover:bg-slate-50 border border-transparent'
                  }`}
                  title={
                    isSelected
                      ? `คลิกเพื่อยกเลิกการกรอง ${rec.name}`
                      : `คลิกเพื่อกรองเฉพาะ ${rec.name}`
                  }
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold transition-colors ${
                        isSelected
                          ? 'bg-emerald-600 text-white'
                          : 'bg-emerald-100/80 text-emerald-800 group-hover:bg-emerald-200'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span
                      className={`min-w-0 flex-1 truncate text-xs font-bold ${
                        isSelected
                          ? 'text-emerald-900 font-extrabold'
                          : 'text-slate-800 group-hover:text-emerald-700'
                      }`}
                      title={rec.name}
                    >
                      {rec.name}
                    </span>
                    {isSelected && (
                      <span className="text-[9px] font-bold bg-emerald-200/80 text-emerald-800 px-1.5 py-0.5 rounded">
                        เลือกอยู่
                      </span>
                    )}
                    <b
                      className={`text-xs font-black ${
                        isSelected ? 'text-emerald-700' : 'text-slate-900'
                      }`}
                    >
                      {rec.quantity}
                    </b>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isSelected
                          ? 'bg-emerald-600'
                          : 'bg-emerald-500 group-hover:bg-emerald-600'
                      }`}
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

      {/* 3D Highcharts Donut Panel (Compact with 2-column Legend) */}
      <Card className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white border-0 shadow-xl">
        <CardContent className="p-4">
          <h3 className="mb-2 text-xs font-bold text-slate-200">
            สรุปการเบิก (3D Chart)
          </h3>

          <div className="relative mb-2 h-36 w-full">
            {summary.topItems.length > 0 ? (
              <HighchartsClient options={chartOptions} />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                ไม่มีข้อมูล
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <NumberTicker value={summary.totalQuantity} className="text-lg font-black text-white tracking-tight" />
              <span className="text-[9px] font-bold text-slate-400">
                ชิ้นรวม
              </span>
            </div>
          </div>

          {/* 2-Column Legend */}
          <div className="grid grid-cols-2 gap-x-2.5 gap-y-1.5 border-t border-slate-800 pt-2.5">
            {summary.topItems.length === 0 ? (
              <div className="col-span-2 text-center text-xs text-slate-400">ไม่มีข้อมูล</div>
            ) : (
              summary.topItems.map((item, idx) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between gap-1 text-[11px] min-w-0"
                >
                  <div className="flex items-center gap-1.5 min-w-0 truncate">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{
                        backgroundColor: DONUT_COLORS[idx % DONUT_COLORS.length],
                      }}
                    />
                    <span className="font-semibold text-slate-300 truncate" title={item.name}>
                      {item.name}
                    </span>
                  </div>
                  <span className="font-bold text-white shrink-0">
                    {item.quantity}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}
