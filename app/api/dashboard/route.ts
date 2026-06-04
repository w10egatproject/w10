import { NextResponse } from 'next/server';
import { getDashboardData, updateDashboardFilters } from '@/lib/googleSheet';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const selectedYear = searchParams.get('year');
    const selectedMonth = searchParams.get('month');

    // แก้ไข: จะอัปเดตชีทเฉพาะเมื่อมีการ "กดเลือกใหม่" จากหน้าเว็บเท่านั้น (ส่งพารามิเตอร์มา)
    // ถ้าเปิดหน้าจอปกติหรือ Refresh (ไม่มีพารามิเตอร์) จะให้อ่านตามที่ชีทเป็นอยู่
    if (selectedYear || selectedMonth) {
      const dataForInit = await getDashboardData();
      const currentSheetYear = dataForInit?.info[1]?.[2]?.toString();
      const currentSheetMonthRaw = dataForInit?.info[2]?.[2]?.toString();
      const currentSheetMonth = currentSheetMonthRaw === 'รวมทุกเดือน' ? 'all' : currentSheetMonthRaw;

      // Only update if values are different to save API quota and time
      if (selectedYear !== currentSheetYear || selectedMonth !== currentSheetMonth) {
        const yearToUpdate = selectedYear || currentSheetYear || '2025';
        const monthToUpdate = selectedMonth || currentSheetMonth || 'all';
        
        const success = await updateDashboardFilters(yearToUpdate, monthToUpdate);
        if (!success) {
          return NextResponse.json({ error: 'ไม่สามารถอัปเดตตัวกรองใน Google Sheet' }, { status: 500 });
        }
        
        // เพิ่มเวลารอให้ชีทคำนวณสูตรทั้งหมดให้เสร็จ (4 วินาที)
        await new Promise(resolve => setTimeout(resolve, 4000));
      }
    }

    // ดึงข้อมูลหลัก
    const data = await getDashboardData();
    if (!data) {
      return NextResponse.json({ error: 'ไม่สามารถดึงข้อมูลจาก Google Sheet' }, { status: 500 });
    } 
    
    const rawData = data.info;
    
    // Use User selection if provided, otherwise use sheet values
    const sheetYearRaw = rawData[1]?.[2]?.toString() || '2025';
    const currentYear = selectedYear || (sheetYearRaw === 'All' ? 'all' : sheetYearRaw);
    const sheetMonthRaw = rawData[2]?.[2]?.toString() || 'all';
    const currentMonth = selectedMonth || (sheetMonthRaw === 'รวมทุกเดือน' ? 'all' : sheetMonthRaw);

    const getNum = (r: number, c: number) => {
      const val = rawData[r]?.[c];
      if (!val) return 0;
      return parseFloat(val.toString().replace(/[^0-9.-]/g, '')) || 0;
    };

    const equipmentData = [];
    for (let r = 1; r <= 7; r++) {
      equipmentData.push({
        name: rawData[r]?.[5] || '',
        values: [getNum(r, 12), getNum(r, 13), getNum(r, 14), getNum(r, 15)],
        total: getNum(r, 16),
      });
    }

    const allEquipmentRow = equipmentData.find((e) => e.name === 'All');
    const groupEntrances = allEquipmentRow?.values || [
      getNum(0, 23),
      getNum(0, 27),
      getNum(0, 31),
      getNum(0, 35),
    ];

    const groupStats: any = {
      W11: { entrance: groupEntrances[0], left: getNum(1, 23), finish: getNum(2, 23), otherFinish: getNum(3, 23), out: getNum(4, 23) },
      W12: { entrance: groupEntrances[1], left: getNum(1, 27), finish: getNum(2, 27), otherFinish: getNum(3, 27), out: getNum(4, 27) },
      W13: { entrance: groupEntrances[2], left: getNum(1, 31), finish: getNum(2, 31), otherFinish: getNum(3, 31), out: getNum(4, 31) },
      W14: { entrance: groupEntrances[3], left: getNum(1, 35), finish: getNum(2, 35), otherFinish: getNum(3, 35), out: getNum(4, 35) },
    };

    groupStats.W_all = {
      entrance: groupStats.W11.entrance + groupStats.W12.entrance + groupStats.W13.entrance + groupStats.W14.entrance,
      left: groupStats.W11.left + groupStats.W12.left + groupStats.W13.left + groupStats.W14.left,
      finish: groupStats.W11.finish + groupStats.W12.finish + groupStats.W13.finish + groupStats.W14.finish,
      otherFinish: groupStats.W11.otherFinish + groupStats.W12.otherFinish + groupStats.W13.otherFinish + groupStats.W14.otherFinish,
      out: groupStats.W11.out + groupStats.W12.out + groupStats.W13.out + groupStats.W14.out,
    };

    const wGauges: any = {
      W11: { empNorm: getNum(1, 81), conNorm: getNum(1, 82), empOT: getNum(2, 81), conOT: getNum(2, 82) },
      W12: { empNorm: getNum(5, 81), conNorm: getNum(5, 82), empOT: getNum(6, 81), conOT: getNum(6, 82) },
      W13: { empNorm: getNum(7, 81), conNorm: getNum(7, 82), empOT: getNum(8, 81), conOT: getNum(8, 82) },
      W14: { empNorm: getNum(9, 81), conNorm: getNum(9, 82), empOT: getNum(10, 81), conOT: getNum(10, 82) },
    };

    const w_all = {
      entrance: groupStats.W_all.entrance,
    };

    // Pull status data from 'Dashboard W10 All info'!I6:L8 (Rows 5-7, Cols 8-11)
    // Labels are in Col 8 (Index 8), Values are in Col 11 (Index 11)
    const statusData = {
      sap: getNum(5, 11),
      pending: getNum(6, 11),
      finish: getNum(7, 11),
      total: getNum(5, 11) + getNum(6, 11) + getNum(7, 11),
    };

    return NextResponse.json({
      statusSummary: { total: w_all },
      wGauges,
      groupStats,
      w_all,
      statusData,
      equipmentData,
      currentYear,
      currentMonth,
      debugInfo: rawData.slice(0, 10), // Expose first 10 rows
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Dashboard API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
