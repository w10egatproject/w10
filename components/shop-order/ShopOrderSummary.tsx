'use client';

import dynamic from 'next/dynamic';
import type { ShopOrderFilters, ShopOrderSummary as Summary } from '@/lib/shop-order/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NumberTicker } from "@/components/magicui/number-ticker";

const HighchartsClient = dynamic(
  () => import('@/components/charts/HighchartsClient'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-44 items-center justify-center rounded-2xl bg-slate-900 text-xs font-bold text-slate-400">
        Loading 3D Chart...
      </div>
    ),
  },
);

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
      backgroundColor: '#0f172a',
      borderColor: '#334155',
      style: {
        color: '#ffffff',
        fontFamily: 'Inter, Noto Sans Thai, sans-serif',
        fontSize: '12px',
      },
      pointFormat: '<b>{point.y} รายการ</b> ({point.percentage:.1f}%)',
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
        name: 'สถานะ',
        data: [
          { name: 'รอดำเนินการ', y: summary.wait, color: '#f59e0b' },
          { name: 'เสร็จสิ้น', y: summary.done, color: '#10b981' },
        ],
      },
    ],
  };

  return (
    <aside className="space-y-4 h-full flex flex-col" aria-label="สรุปรายการ">
      {/* KPI Mini Cards */}
      <div className="grid grid-cols-3 gap-2 lg:grid-cols-1 xl:grid-cols-3">
        {kpis.map(({ label, value, color, testId, status }) => {
          const isActive = activeStatus === status;
          return (
            <Card
              key={label}
              data-testid={testId}
              onClick={() => onStatusSelect?.(status)}
              className={`cursor-pointer transition-all border-none ${
                isActive
                  ? 'bg-indigo-50/70 shadow-md ring-2 ring-indigo-500/20'
                  : 'bg-white hover:shadow-md'
              }`}
            >
              <CardContent className="p-3 text-left">
                <strong className={`block text-2xl ${color}`}>
                  <NumberTicker value={value} />
                </strong>
                <span className="text-xs font-bold text-slate-700">{label}</span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 3D Highcharts Status Chart (Dark Container) */}
      <section
        data-testid="status-summary"
        className="rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-5 text-white shadow-xl"
      >
        <h2 className="text-sm font-bold text-white">สรุปสถานะ (3D Chart)</h2>
        <div className="relative mx-auto h-44 w-full">
          <HighchartsClient options={chartOptions} />
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <strong className="text-xl font-black text-white">{donePercent}%</strong>
            <span className="text-[10px] font-bold text-slate-400">เสร็จสิ้น</span>
          </div>
        </div>
        <div className="mt-2 space-y-2 border-t border-slate-800 pt-3 text-xs">
          <p className="flex justify-between text-slate-300">
            <span>
              <i className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-amber-500" />
              รอดำเนินการ
            </span>
            <b className="text-white">{summary.wait} รายการ</b>
          </p>
          <p className="flex justify-between text-slate-300">
            <span>
              <i className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
              เสร็จสิ้น
            </span>
            <b className="text-white">{summary.done} รายการ</b>
          </p>
        </div>
      </section>

      {/* Popular Units Ranking (Image 2 style layout) */}
      <Card className="shadow-sm border-none flex-1 flex flex-col">
        <CardHeader className="p-5 pb-0">
          <CardTitle className="text-sm font-bold text-slate-900">
            หน่วยงานยอดนิยม
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-4 flex-1 flex flex-col">
        {summary.popularUnits.length ? (
          <ol className="space-y-3.5 text-sm">
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
                    <span className="min-w-0 flex-1 truncate font-semibold text-slate-800">
                      {unit.name}
                    </span>
                    <b className="text-slate-900 font-black">{unit.count}</b>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
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
          <p className="text-xs text-slate-500">ยังไม่มีข้อมูลหน่วยงาน</p>
        )}
        </CardContent>
      </Card>
    </aside>
  );
}
