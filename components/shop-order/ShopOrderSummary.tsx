'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import type { ShopOrderFilters, ShopOrderSummary as Summary } from '@/lib/shop-order/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NumberTicker } from '@/components/magicui/number-ticker';

const HighchartsClient = dynamic(
  () => import('@/components/charts/HighchartsClient'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-36 items-center justify-center rounded-2xl bg-slate-800/80 text-xs font-bold uppercase tracking-wider text-slate-400">
        Loading 3D Chart...
      </div>
    ),
  },
);

interface ShopOrderSummaryProps {
  summary: Summary;
  activeStatus?: ShopOrderFilters['status'];
  onStatusSelect?: (status: ShopOrderFilters['status']) => void;
  selectedQuery?: string;
  onQuerySelect?: (query: string) => void;
  loading?: boolean;
}

export function ShopOrderSummary({
  summary,
  activeStatus = 'all',
  onStatusSelect,
  selectedQuery,
  onQuerySelect,
  loading = false,
}: ShopOrderSummaryProps) {
  const [rankingTab, setRankingTab] = useState<'unit' | 'receiver'>('unit');

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

  const rankingList =
    rankingTab === 'unit'
      ? summary.popularUnits || []
      : summary.popularReceivers || [];

  const maxRankCount = rankingList.length > 0 ? rankingList[0].count : 1;

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
        innerSize: '52%',
        depth: 26,
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

  if (loading && !summary.total) {
    return (
      <aside
        className="flex w-full flex-col gap-4 lg:w-80 lg:shrink-0 h-full"
        aria-label="สรุปรายการ"
      >
        <div className="grid grid-cols-3 gap-2.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-3 text-center border-slate-200">
              <div className="h-7 w-12 bg-slate-200 animate-pulse rounded-lg mx-auto mb-1.5" />
              <div className="h-3 w-14 bg-slate-100 animate-pulse rounded mx-auto" />
            </Card>
          ))}
        </div>
        <Card className="shadow-sm flex-1 p-4 flex flex-col gap-3 border-slate-200">
          <div className="h-4 w-36 bg-slate-200 animate-pulse rounded" />
          <div className="space-y-2 mt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-8 w-full bg-slate-100 animate-pulse rounded-lg" />
            ))}
          </div>
        </Card>
        <Card className="bg-slate-900 text-white p-4 flex flex-col gap-3 border-0">
          <div className="h-4 w-28 bg-slate-800 animate-pulse rounded" />
          <div className="h-24 w-24 rounded-full border-4 border-slate-800 border-t-indigo-500 animate-spin mx-auto my-2" />
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
      className="flex w-full flex-col gap-4 lg:w-80 lg:shrink-0 h-full justify-between"
      aria-label="สรุปรายการ"
    >
      {/* KPI Mini Cards */}
      <div className="grid grid-cols-3 gap-2.5">
        {kpis.map(({ label, value, color, testId, status }) => {
          const isActive = activeStatus === status;
          return (
            <Card
              key={label}
              data-testid={testId}
              onClick={() => onStatusSelect?.(status)}
              className={`cursor-pointer transition-all border shadow-sm ${
                isActive
                  ? 'bg-indigo-50/80 border-indigo-400 ring-2 ring-indigo-500/20'
                  : 'bg-white hover:border-slate-300'
              }`}
            >
              <CardContent className="p-3 text-center">
                <strong className={`block text-2xl font-black ${color} tracking-tight`}>
                  <NumberTicker value={value} />
                </strong>
                <span className="mt-0.5 block text-xs font-bold text-slate-600">
                  {label}
                </span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Popular Ranking Panel (Units / Receivers toggle with Click-to-filter) */}
      <Card className="shadow-sm h-[295px] flex flex-col transition-all border border-slate-200">
        <CardHeader className="p-3 pb-0 mb-1 flex flex-col gap-1.5 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-bold text-slate-900">
                {rankingTab === 'unit' ? 'หน่วยงาน' : 'ผู้รับ'}
              </CardTitle>
            </div>
            {selectedQuery && onQuerySelect && (
              <button
                type="button"
                onClick={() => onQuerySelect('')}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
              >
                ล้าง
              </button>
            )}
          </div>

          {/* Toggle Tabs */}
          <div className="flex items-center justify-between">
            <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setRankingTab('unit')}
                className={`rounded-md px-2 py-0.5 text-xs font-bold transition-all ${
                  rankingTab === 'unit'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                หน่วยงาน
              </button>
              <button
                type="button"
                onClick={() => setRankingTab('receiver')}
                className={`rounded-md px-2 py-0.5 text-xs font-bold transition-all ${
                  rankingTab === 'receiver'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ผู้รับ
              </button>
            </div>
            <p className="text-[11px] font-medium text-slate-400">
              {selectedQuery ? `กรอง: ${selectedQuery}` : 'คลิกเพื่อกรอง'}
            </p>
          </div>
        </CardHeader>

        <CardContent className="p-3 pt-0.5 flex-1 min-h-0 flex flex-col overflow-hidden">
          {rankingList.length === 0 ? (
            <div className="text-xs text-slate-400 py-3 text-center">
              ไม่มีข้อมูล
            </div>
          ) : (
            <ol className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-1 scrollbar-thin">
              {rankingList.map((item, idx) => {
                const isSelected =
                  selectedQuery?.trim().toLowerCase() === item.name.trim().toLowerCase();
                const pct = Math.min(
                  100,
                  Math.max(4, Math.round((item.count / maxRankCount) * 100)),
                );
                return (
                  <li
                    key={item.name}
                    onClick={() => onQuerySelect?.(item.name)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onQuerySelect?.(item.name);
                      }
                    }}
                    className={`group relative rounded-xl p-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 border border-indigo-500 shadow-sm'
                        : 'hover:bg-slate-50 border border-transparent'
                    }`}
                    title={
                      isSelected
                        ? `คลิกเพื่อยกเลิกการกรอง ${item.name}`
                        : `คลิกเพื่อกรองเฉพาะ ${item.name}`
                    }
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold transition-colors ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-indigo-100/80 text-indigo-800 group-hover:bg-indigo-200'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span
                        className={`min-w-0 flex-1 truncate text-xs font-bold ${
                          isSelected
                            ? 'text-indigo-900 font-extrabold'
                            : 'text-slate-800 group-hover:text-indigo-700'
                        }`}
                        title={item.name}
                      >
                        {item.name}
                      </span>
                      {isSelected && (
                        <span className="text-[9px] font-bold bg-indigo-200/80 text-indigo-800 px-1.5 py-0.5 rounded">
                          เลือกอยู่
                        </span>
                      )}
                      <b
                        className={`text-xs font-black ${
                          isSelected ? 'text-indigo-700' : 'text-slate-900'
                        }`}
                      >
                        {item.count}
                      </b>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isSelected
                            ? 'bg-indigo-600'
                            : 'bg-indigo-500 group-hover:bg-indigo-600'
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

      {/* 3D Highcharts Status Chart (Bottom Panel) */}
      <Card
        data-testid="status-summary"
        className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white border-0 shadow-xl shrink-0 mt-auto"
      >
        <CardContent className="p-4">
          <h3 className="mb-2 text-xs font-bold text-slate-200">
            สรุปสถานะ (3D Chart)
          </h3>

          <div className="relative mb-2 h-36 w-full">
            <HighchartsClient options={chartOptions} />
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <strong className="text-lg font-black text-white tracking-tight">
                {donePercent}%
              </strong>
              <span className="text-[9px] font-bold text-slate-400">
                เสร็จสิ้น
              </span>
            </div>
          </div>

          {/* 2-Column Legend */}
          <div className="grid grid-cols-2 gap-x-2.5 gap-y-1.5 border-t border-slate-800 pt-2.5 text-[11px]">
            <div className="flex items-center justify-between gap-1 min-w-0">
              <div className="flex items-center gap-1.5 min-w-0 truncate">
                <span className="h-2 w-2 rounded-full shrink-0 bg-amber-500" />
                <span className="font-semibold text-slate-300 truncate">
                  รอดำเนินการ
                </span>
              </div>
              <span className="font-bold text-white shrink-0">
                {summary.wait}
              </span>
            </div>
            <div className="flex items-center justify-between gap-1 min-w-0">
              <div className="flex items-center gap-1.5 min-w-0 truncate">
                <span className="h-2 w-2 rounded-full shrink-0 bg-emerald-500" />
                <span className="font-semibold text-slate-300 truncate">
                  เสร็จสิ้น
                </span>
              </div>
              <span className="font-bold text-white shrink-0">
                {summary.done}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}
