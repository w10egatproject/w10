import { NextResponse } from 'next/server';
import { getDashboardData, updateDashboardFilters } from '@/lib/googleSheet';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const selectedYear = searchParams.get('year');
  const selectedMonth = searchParams.get('month');

  // แก้ไข: จะอัปเดตชีทเฉพาะเมื่อมีการ "กดเลือกใหม่" จากหน้าเว็บเท่านั้น (ส่งพารามิเตอร์มา)
  // ถ้าเปิดหน้าจอปกติหรือ Refresh (ไม่มีพารามิเตอร์) จะให้อ่านตามที่ชีทเป็นอยู่
  if (selectedYear || selectedMonth) {
    const dataForInit = await getDashboardData();
    const yearToUpdate = selectedYear || dataForInit?.info[1]?.[2]?.toString() || '2025';
    const monthToUpdate = selectedMonth || dataForInit?.info[2]?.[2]?.toString() || 'all';
    
    const success = await updateDashboardFilters(yearToUpdate, monthToUpdate);
    if (!success) {
      return NextResponse.json({ error: 'ไม่สามารถอัปเดตตัวกรองใน Google Sheet' }, { status: 500 });
    }
    
    // เพิ่มเวลารอให้ชีทคำนวณสูตรทั้งหมดให้เสร็จ (เพิ่มเป็น 4 วินาที)
    await new Promise(resolve => setTimeout(resolve, 4000));
  }

  // ดึงข้อมูลหลัก (เพิ่ม timestamp หรือพารามิเตอร์หลอกเพื่อเลี่ยง cache ในทุกระดับ)
  const data = await getDashboardData();
  if (!data) {
    return NextResponse.json({ error: 'ไม่สามารถดึงข้อมูลจาก Google Sheet' }, { status: 500 });
  } 
  
  const rawData = data.info;
  
  // LOGGING FOR DEBUGGING
  console.log('--- DATA DEBUG ---');
  console.log(`Requested: ${selectedYear}/${selectedMonth}`);
  console.log(`Sheet Status - Year: ${rawData[1]?.[2]}, Month: ${rawData[2]?.[2]}`);
  console.log(`W/O (E8): ${rawData[7]?.[4]}`);
  console.log(`W_ALL (AL1): ${rawData[0]?.[37]}`);
  console.log(`W11 Entrance (X1): ${rawData[0]?.[23]}`);
  console.log('------------------');
  
  // ใช้ค่าที่ User เลือกเป็นหลักในการส่งกลับ UI เพื่อป้องกัน Dropdown ดีดกลับ
  const currentYear = selectedYear || rawData[1]?.[2]?.toString() || '2025';
  const currentMonthRaw = rawData[2]?.[2]?.toString() || 'all';
  const currentMonth = selectedMonth || (currentMonthRaw === 'รวมทุกเดือน' ? 'all' : currentMonthRaw);

  const getNum = (r: number, c: number) => {
    const val = rawData[r]?.[c];
    if (!val) return 0;
    return parseFloat(val.toString().replace(/[^0-9.-]/g, '')) || 0;
  };

  const groupStats: any = {
    W11: { entrance: getNum(0, 23), left: getNum(1, 23), finish: getNum(2, 23), otherFinish: getNum(3, 23), out: getNum(4, 23) },
    W12: { entrance: getNum(0, 27), left: getNum(1, 27), finish: getNum(2, 27), otherFinish: getNum(3, 27), out: getNum(4, 27) },
    W13: { entrance: getNum(0, 31), left: getNum(1, 31), finish: getNum(2, 31), otherFinish: getNum(3, 31), out: getNum(4, 31) },
    W14: { entrance: getNum(0, 35), left: getNum(1, 35), finish: getNum(2, 35), otherFinish: getNum(3, 35), out: getNum(4, 35) },
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
    entrance: getNum(0, 37), // AL1
  };

  const statusData = {
    sap: getNum(5, 11),
    pending: getNum(6, 11),
    finish: getNum(7, 11),
    total: getNum(7, 4), // E8
  };

  const equipmentData = [];
  for (let r = 1; r <= 7; r++) {
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
