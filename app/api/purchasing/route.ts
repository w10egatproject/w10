import { NextResponse } from 'next/server';
import { getDashboardData, updateDashboardFilters } from '@/lib/googleSheet';

export async function GET(request: Request) {
  try {
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
        throw new Error('ไม่สามารถอัปเดตตัวกรองใน Google Sheet');
      }
      
      // เพิ่มเวลารอให้ชีทคำนวณสูตรทั้งหมดให้เสร็จ (4 วินาที)
      await new Promise(resolve => setTimeout(resolve, 4000));
    }

    const data = await getDashboardData();

    if (!data) {
      throw new Error('No data retrieved from sheet');
    }

    // Dashboard W10 All
    const rawData = data.dashboard;

    // Dashboard W10 All info
    const infoData = data.info;

    // ใช้สำหรับกราฟ/summary
    const getNum = (r: number, c: number) => {
      const val = infoData[r]?.[c];
      return parseFloat(val?.toString().replace(/[^0-9.-]/g, '')) || 0;
    };

    // ใช้ค่าที่ User เลือกเป็นหลักในการส่งกลับ UI เพื่อป้องกัน Dropdown ดีดกลับ
    const currentYear = selectedYear || infoData[1]?.[2]?.toString() || '2025';
    const currentMonthRaw = infoData[2]?.[2]?.toString() || 'all';
    const currentMonth = selectedMonth || (currentMonthRaw === 'รวมทุกเดือน' ? 'all' : currentMonthRaw);

    // gauge - Mapping based on Dashboard W10 All info
    // Row 1: W11 (index 0 is Row 1?) No, infoData[0] is Row 1.
    // Row 2: index 1
    const gauges = {
      empNorm: getNum(1, 81),
      empOT: getNum(2, 81),
      w11_1: getNum(3, 81)
    };

    // =========================
    // PIE CHART
    // =========================
    const chartData = [];

    for (let r = 11; r <= 14; r++) {
      chartData.push({
        name: infoData[r]?.[73] || '',
        value: getNum(r, 74)
      });
    }

    // =========================
    // SUMMARY TABLE
    // =========================
    const summaryTableData = [];

    for (let r = 11; r <= 15; r++) {
      summaryTableData.push({
        col1: infoData[r]?.[73] || '',
        col2: infoData[r]?.[74] || ''
      });
    }

    // =========================
    // SECOND CHART
    // =========================
    const secondChartData = [];

    for (let r = 1; r <= 8; r++) {
      secondChartData.push({
        name: infoData[r]?.[73] || '',
        value: getNum(r, 74)
      });
    }

    // =========================
    // SECOND TABLE
    // =========================
    const secondTableData = [];

    for (let r = 1; r <= 9; r++) {
      secondTableData.push({
        col1: infoData[r]?.[73] || '',
        col2: infoData[r]?.[74] || ''
      });
    }

    // =========================
    // TABLE ใหญ่ด้านล่าง
    // ใช้ Dashboard W10 All
    // ข้อมูลเริ่มแถว 32 (index 31)
    // =========================
    const purchaseList = [];

    for (let r = 31; r < rawData.length; r++) {

      const row = rawData[r] || [];

      // เช็คว่ามีข้อมูล (เช็ค ECM, W/O หรือ รายการ)
      if (
        row[6] ||
        row[7] ||
        row[8]
      ) {

        purchaseList.push({

          ecm_buy: row[5] || '',
          ecm: row[6] || '',
          wo: row[7] || '',
          item: row[8] || '',
          equip: row[9] || '',
          date_in: row[10] || '',
          date_start: row[11] || '',
          date_out: row[12] || '',
          status: row[13] || '',
          action: row[14] || ''

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
      currentMonth

    });

  } catch (error: any) {

    console.error(
      'Purchasing API Error:',
      error
    );

    return NextResponse.json(
      {
        error: error.message
      },
      {
        status: 500
      }
    );
  }
}