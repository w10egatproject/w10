import { NextResponse } from 'next/server';
import { getDashboardData } from '@/lib/googleSheet';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const selectedYear = searchParams.get('year');
  const selectedMonth = searchParams.get('month');

  const data = await getDashboardData();
  if (!data) {
    return NextResponse.json({
      error: 'ไม่สามารถดึงข้อมูล'
    });
  } 
  
  const rawData = data.dashboard;
  if (rawData.length < 5) {
    return NextResponse.json({
      error: 'ข้อมูลไม่พอ'
    });
  }

  const getNum = (r: number, c: number) => parseFloat(rawData[r]?.[c]?.toString().replace(/[^0-9.-]/g, '')) || 0;

  const groupStats: any = {
    W11: { entrance: getNum(0, 23), left: getNum(1, 23), finish: getNum(2, 23), otherFinish: getNum(3, 23), out: getNum(4, 23) },
    W12: { entrance: getNum(0, 27), left: getNum(1, 27), finish: getNum(2, 27), otherFinish: getNum(3, 27), out: getNum(4, 27) },
    W13: { entrance: getNum(0, 31), left: getNum(1, 31), finish: getNum(2, 31), otherFinish: getNum(3, 31), out: getNum(4, 31) },
    W14: { entrance: getNum(7, 15), left: getNum(8, 15), finish: getNum(9, 15), otherFinish: getNum(10, 15), out: getNum(11, 15) },
  };

  const wGauges: any = {
    W11: { empNorm: getNum(1, 81), conNorm: getNum(1, 82), empOT: getNum(2, 81), conOT: getNum(2, 82) },
    W12: { empNorm: getNum(5, 81), conNorm: getNum(5, 82), empOT: getNum(6, 81), conOT: getNum(6, 82) },
    W13: { empNorm: getNum(7, 81), conNorm: getNum(7, 82), empOT: getNum(8, 81), conOT: getNum(8, 82) },
    W14: { empNorm: getNum(9, 81), conNorm: getNum(9, 82), empOT: getNum(10, 81), conOT: getNum(10, 82) },
  };

  const w_all = {
    entrance: getNum(0, 37),
  };

  const statusData = {
    sap: getNum(5, 11),
    pending: getNum(6, 11),
    finish: getNum(7, 11),
    total: 52,
  };

  const currentYear = selectedYear || rawData[1]?.[2]?.toString() || '2026';
  const currentMonth = selectedMonth || rawData[2]?.[2]?.toString() || '5';

  const equipmentData = [];
  for (let r = 1; r <= 6; r++) {
    equipmentData.push({
      name: rawData[r]?.[5] || '',
      values: [getNum(r, 12), getNum(r, 13), getNum(r, 14), getNum(r, 15)],
      total: getNum(r, 16),
    });
  }

  return NextResponse.json({
    statusSummary: { total: w_all },
    wGauges,
    groupStats,
    w_all,
    statusData,
    equipmentData,
    currentYear,
    currentMonth,
  });
}
