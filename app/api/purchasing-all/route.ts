import { NextResponse } from 'next/server';
import { getPurchasingAllSheetData } from '@/lib/googleSheet';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const noStoreHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
};

export async function GET(request: Request) {
  try {
    const data = await getPurchasingAllSheetData();

    if (!data) {
      throw new Error('No data retrieved from sheet');
    }

    const rawData = data.dashboard;
    const infoData = data.info;

    const getNum = (r: number, c: number) => {
      const val = infoData[r]?.[c];
      return parseFloat(val?.toString().replace(/[^0-9.-]/g, '')) || 0;
    };

    const currentYear = 'all';
    const currentMonth = 'all';

    const gauges = {
      empNorm: 0,
      empOT: 0,
      w11_1: 0,
    };

    const chartData = [];
    const summaryTableData = [];
    for (let r = 4; r <= 8; r++) {
      const pieName = infoData[r]?.[24] || '';
      const pieValue = infoData[r]?.[25] || '';
      chartData.push({
        name: pieName,
        value: getNum(r, 25),
      });
      summaryTableData.push({
        col1: pieName,
        col2: pieValue,
      });
    }

    const secondChartData = [];
    for (let r = 0; r <= 8; r++) {
      const statusName = infoData[r]?.[7] || '';
      const statusValue = infoData[r]?.[8] || '';
      secondChartData.push({
        name: statusName,
        value: getNum(r, 8),
      });
    }

    const secondTableData = [];
    for (let r = 0; r <= 8; r++) {
      secondTableData.push({
        col1: infoData[r]?.[7] || '',
        col2: infoData[r]?.[8] || '',
      });
    }

    const purchaseList = [];
    for (let r = 9; r < rawData.length; r++) {
      const row = rawData[r] || [];

      if (row.some((cell) => cell?.toString().trim())) {
        purchaseList.push({
          ecm_buy: row[0] || '',
          ecm: row[1] || '',
          wo: row[2] || '',
          item: row[3] || '',
          equip: row[4] || '',
          date_in: row[5] || '',
          date_start: row[6] || '',
          date_out: row[7] || '',
          status: row[8] || '',
          action: '',
        });
      }
    }

    return NextResponse.json({
      gauges,
      chartData,
      summaryTableData,
      secondChartData,
      secondTableData,
      purchaseList,
      currentYear,
      currentMonth,
    }, { headers: noStoreHeaders });
  } catch (error: any) {
    console.error('Purchasing All API Error:', error);

    return NextResponse.json(
      {
        error: error.message,
      },
      {
        status: 500,
        headers: noStoreHeaders,
      },
    );
  }
}
