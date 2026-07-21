import { NextResponse } from 'next/server';
import { getShopOrderSheetData } from '@/lib/googleSheet';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const noStoreHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
};

// Deterministic Demo Data Generator
function getDemoData() {
  const systems = ['Hydraulic', 'Brake', 'Transmission', 'Air pump'];
  const data = [];
  for (let i = 1; i <= 76; i++) {
    // Deterministic min: between 5 and 14
    const min = ((i * 3) % 10) + 5;
    // Deterministic pseudo-random roll between 0 and 1
    const roll = ((i * 7) % 100) / 100;
    
    let balance = 0;
    if (roll < 0.14) {
      balance = 0;
    } else if (roll < 0.42) {
      balance = (i * 2) % min;
    } else {
      balance = min + ((i * 5) % 20);
    }
    
    let status = 'Normal';
    if (balance <= 0) {
      status = 'Out';
    } else if (balance < min) {
      status = 'Low';
    }

    data.push({
      code: 's' + i + '.',
      pn: 'PN-' + (10000 + i),
      name: 'อะไหล่ตัวอย่างหมายเลข ' + i,
      system: systems[i % systems.length],
      balance,
      min,
      max: min * 3,
      action: balance < min ? 'สั่งซื้อ' : '-',
      status
    });
  }
  return {
    status: 'success',
    data,
    systems: Array.from(new Set(data.map(item => item.system))).sort()
  };
}

export async function GET() {
  try {
    const sheetId = process.env.GOOGLE_SHOP_ORDER_SHEET_ID;
    
    // Fallback to demo data if GOOGLE_SHOP_ORDER_SHEET_ID is not configured
    if (!sheetId) {
      const demo = getDemoData();
      return NextResponse.json({
        ...demo,
        isDemo: true,
        warning: 'กำลังใช้ข้อมูลจำลอง (Demo Data) เนื่องจากเซิร์ฟเวอร์ยังไม่ได้รับค่า GOOGLE_SHOP_ORDER_SHEET_ID — กรุณาปิดแล้วเปิดเซิร์ฟเวอร์ Next.js (npm run dev) ใหม่เพื่อให้ระบบโหลดไฟล์ .env.local',
        timestamp: new Date().toISOString()
      }, { headers: noStoreHeaders });
    }

    const rawData = await getShopOrderSheetData();
    if (!rawData || rawData.length === 0) {
      // If fetching fails but sheetId was provided, return error or fallback to demo with a warning
      console.warn('Failed to fetch Google Sheet data. Falling back to Demo data.');
      const demo = getDemoData();
      return NextResponse.json({
        ...demo,
        isDemo: true,
        warning: 'ไม่สามารถดึงข้อมูลจาก Google Sheet ได้ จึงแสดงข้อมูลจำลองแทน',
        timestamp: new Date().toISOString()
      }, { headers: noStoreHeaders });
    }

    const headers = rawData[0];
    const rows = rawData.slice(1);

    const idxCode = headers.indexOf('รหัส/Code');
    const idxPN = headers.indexOf('P/N');
    const idxName = headers.indexOf('รายการอะไหล่');
    const idxSystem = headers.indexOf('ระบบ');
    const idxBal = headers.indexOf('จำนวนคงเหลือ');
    const idxMin = headers.indexOf('MIN');
    const idxMax = headers.indexOf('MAX');
    const idxAction = headers.indexOf('การดำเนินการ');

    const formattedData: any[] = [];
    const systems = new Set<string>();

    rows.forEach(row => {
      const code = idxCode !== -1 ? row[idxCode]?.toString().trim() : '';
      const name = idxName !== -1 ? row[idxName]?.toString().trim() : '';

      // Skip empty rows
      if (code || name) {
        const rawBal = idxBal !== -1 ? row[idxBal]?.toString() || '0' : '0';
        const rawMin = idxMin !== -1 ? row[idxMin]?.toString() || '0' : '0';
        const rawMax = idxMax !== -1 ? row[idxMax]?.toString() || '0' : '0';
        const pn = idxPN !== -1 ? row[idxPN]?.toString() || '-' : '-';
        const system = idxSystem !== -1 ? row[idxSystem]?.toString().trim() || '-' : '-';
        const action = idxAction !== -1 ? row[idxAction]?.toString() || '-' : '-';

        const balance = parseFloat(rawBal.replace(/,/g, '')) || 0;
        const min = parseFloat(rawMin.replace(/,/g, '')) || 0;
        const max = parseFloat(rawMax.replace(/,/g, '')) || 0;

        let status = 'Normal';
        if (balance <= 0) {
          status = 'Out';
        } else if (balance < min) {
          status = 'Low';
        }

        formattedData.push({
          code: code || '-',
          pn: pn || '-',
          name: name || '-',
          system: system || '-',
          balance,
          min,
          max,
          action: action || '-',
          status
        });

        if (system && system !== '-' && system !== '') {
          systems.add(system);
        }
      }
    });

    return NextResponse.json({
      status: 'success',
      data: formattedData,
      systems: Array.from(systems).sort(),
      isDemo: false,
      timestamp: new Date().toISOString()
    }, { headers: noStoreHeaders });

  } catch (error: any) {
    console.error('Shop Order API error:', error);
    return NextResponse.json({
      status: 'error',
      message: error.message || 'Internal Server Error'
    }, { status: 500, headers: noStoreHeaders });
  }
}
