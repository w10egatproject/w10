import { NextResponse } from 'next/server';
import { 
  getContractorOtSheetData, 
  getEmployeeOtSheetData,
  getEmployeeOtErrorSheetData,
  getContractorOtErrorSheetData
} from '@/lib/googleSheet';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const GROUP_BY_SEQUENCE = [
  { group: 'W11', start: 1, end: 6 },
  { group: 'W12', start: 7, end: 9 },
  { group: 'W13', start: 10, end: 12 },
  { group: 'W14', start: 13, end: 16 },
];

const CONTRACTOR_GROUP_BY_SEQUENCE = [
  { group: 'W11', start: 1, end: 1 },
  { group: 'W12', start: 2, end: 7 },
  { group: 'W13', start: 8, end: 20 },
  { group: 'W14', start: 21, end: 29 },
];

const otGroups = ['W11', 'W12', 'W13', 'W14'];

const toNumber = (value: unknown) => {
  const normalized = value?.toString().replace(/[^0-9.-]/g, '') || '';
  return parseFloat(normalized) || 0;
};

const getGroup = (sequence: number, isEmployee: boolean) => {
  const config = isEmployee ? GROUP_BY_SEQUENCE : CONTRACTOR_GROUP_BY_SEQUENCE;
  return config.find((item) => sequence >= item.start && sequence <= item.end)?.group || 'อื่น';
};

const mapGroupValue = (val: string) => {
  if (val === '1') return 'W11';
  if (val === '2') return 'W12';
  if (val === '3') return 'W13';
  if (val === '4') return 'W14';
  return val;
};

const parseOtRows = (rows: (string | number | boolean | null | undefined)[][], type: 'employee' | 'contractor') => {
  // หาชื่อหัวข้อจากแถวแรกๆ (มักจะเป็นหัวตารางรวม)
  const title = rows.flat().find((cell) => cell?.toString().trim())?.toString() || (type === 'employee' ? 'สรุป OT พนักงาน' : 'สรุป OT ลูกจ้าง');

  const people = rows
    .map((row) => {
      // เมื่อ range เริ่มที่ B2: index 0 = Column B (ลำดับ)
      const sequence = toNumber(row[0]);
      if (!sequence) return null;

      const isEmployee = type === 'employee';
      // สำหรับพนักงาน: วันที่ 1 เริ่มที่ Column F (index 4)
      // สำหรับลูกจ้าง: วันที่ 1 เริ่มที่ Column E (index 3)
      const dayStartIndex = isEmployee ? 4 : 3;
      const days = Array.from({ length: 31 }, (_, index) => toNumber(row[index + dayStartIndex]));
      const dayTotal = days.reduce((sum, value) => sum + value, 0);

      // พนักงาน: Column AJ (index 34) คือรวมชม.
      // ลูกจ้าง: Column AK (index 35) คือรวมชม1.5
      const total = isEmployee
        ? (toNumber(row[34]) || dayTotal)
        : (toNumber(row[35]) || dayTotal);

      // พนักงาน: Column AK (index 35) คือรวมx3 (เงิน)
      // ลูกจ้าง: Column AN (index 38) คือรวมเงิน
      const total2 = isEmployee
        ? (toNumber(row[35]) || total)
        : (toNumber(row[38]) || total);

      const groupVal = row[1]?.toString()?.trim() || '';
      const mappedGroup = mapGroupValue(groupVal);
      const groupFromSeq = getGroup(sequence, isEmployee);
      
      const group = isEmployee 
        ? groupFromSeq 
        : (otGroups.includes(mappedGroup) ? mappedGroup : groupFromSeq);

      return {
        sequence,
        // พนักงาน: row[1] คือเลขประจำตัว (Column C)
        // ลูกจ้าง: row[1] คือหมวด (Column C)
        employeeId: row[1]?.toString() || '',
        // row[2] คือ Column D (ชื่อ)
        name: row[2]?.toString() || '',
        // พนักงาน: row[3] คือ Column E (ตำแหน่ง), ลูกจ้าง: ไม่มีตำแหน่ง
        position: isEmployee ? row[3]?.toString() || '' : '',
        group,
        type,
        days,
        // สำหรับลูกจ้าง: ชม.วันหยุด อยู่ที่ Column AJ (index 34)
        holidayHours: isEmployee ? 0 : toNumber(row[34]),
        total,
        // สำหรับลูกจ้าง: 1เท่า Column AL (index 36), 1.5เท่า Column AM (index 37), 3เท่า Column AO (index 39)
        oneTime: isEmployee ? 0 : toNumber(row[36]),
        oneHalfTime: isEmployee ? 0 : toNumber(row[37]),
        total2,
        threeTime: isEmployee ? 0 : toNumber(row[39]),
      };
    })
    .filter((p): p is NonNullable<typeof p> => !!p);

  return { title, people };
};

const parseOtErrorRows = (rows: (string | number | boolean | null | undefined)[][], type: 'employee' | 'contractor', nameGroupMap?: Map<string, string>) => {
  const people = rows
    .map((row) => {
      // index 0 = Column B (ลำดับ)
      const sequence = toNumber(row[0]);
      if (!sequence) return null;

      const isEmployee = type === 'employee';
      // หน้า Check OT Error: 
      // พนักงาน: คอลัมน์ F (index 4) คือวันที่ 1, ID=C(1), ชื่อ=D(2), ตำแหน่ง=E(3)
      // ลูกจ้าง: คอลัมน์ E (index 3) คือวันที่ 1, ID=C(1), ชื่อ=D(2)
      const dayStartIndex = isEmployee ? 4 : 3;
      const days = Array.from({ length: 31 }, (_, index) => {
        const cell = row[index + dayStartIndex]?.toString()?.trim() || '';
        return cell === 'TRUE';
      });
      const total = toNumber(row[row.length - 1]);

      const name = row[2]?.toString()?.trim() || '';
      const groupFromSeq = getGroup(sequence, isEmployee);
      
      // ใช้ชื่อที่ Trim แล้วค้นหาใน Map เพื่อความแม่นยำ
      const group = nameGroupMap?.get(name) || groupFromSeq;

      return {
        sequence,
        employeeId: row[1]?.toString() || '',
        name,
        position: isEmployee ? row[3]?.toString() || '' : '',
        group,
        days,
        total,
      };
    })
    .filter((p): p is NonNullable<typeof p> => !!p);

  return people;
};

const summarizeGroup = (group: string, people: { group: string; total: number; total2: number }[]) => {
  const groupRows = people.filter((person) => person.group === group);
  const total = groupRows.reduce((sum, person) => sum + person.total, 0);
  const total2 = groupRows.reduce((sum, person) => sum + person.total2, 0);

  return {
    count: groupRows.length,
    total,
    total2,
  };
};

export async function GET() {
  try {
    const [employeeRows, contractorRows, employeeErrorRows, contractorErrorRows] = await Promise.all([
      getEmployeeOtSheetData(),
      getContractorOtSheetData(),
      getEmployeeOtErrorSheetData(),
      getContractorOtErrorSheetData(),
    ]);

    if (!employeeRows) {
      throw new Error('อ่านข้อมูล OT พนักงานไม่สำเร็จ กรุณาแชร์ชีทให้ service account ของระบบก่อน');
    }

    if (!contractorRows) {
      throw new Error('อ่านข้อมูล OT ลูกจ้างไม่สำเร็จ กรุณาแชร์ชีทให้ service account ของระบบก่อน');
    }

    const employeeData = parseOtRows(employeeRows, 'employee');
    const contractorData = parseOtRows(contractorRows, 'contractor');
    const employees = employeeData.people;
    const contractors = contractorData.people;

    // สร้าง Map ชื่อ -> กลุ่ม เพื่อให้หน้า Error แสดงกลุ่มตรงกับหน้าสรุป (ใช้ trim() เพื่อความแม่นยำ)
    const employeeNameMap = new Map<string, string>();
    employees.forEach(p => {
      if (p && p.name) employeeNameMap.set(p.name.trim(), p.group);
    });
    
    const contractorNameMap = new Map<string, string>();
    contractors.forEach(p => {
      if (p && p.name) contractorNameMap.set(p.name.trim(), p.group);
    });

    // หาแถว "ยอดรวมสุทธิ" ของลูกจ้างจากข้อมูลดิบ
    const contractorSummaryRow = contractorRows.find(row => 
      row.some(cell => cell?.toString().includes('ยอดรวมสุทธิ'))
    );

    let officialContractorTotals = null;
    if (contractorSummaryRow) {
      // เมื่อ range เริ่มที่ B: [33] ยอดรวมสุทธิ(AI), [34] ชม.วันหยุด(AJ), [35] รวมชม1.5(AK), [36] 1เท่า(AL), [37] 1.5เท่า(AM), [38] รวมเงิน(AN), [39] 3เท่า(AO)
      officialContractorTotals = {
        holidayHours: toNumber(contractorSummaryRow[34]),
        total: toNumber(contractorSummaryRow[35]),
        oneTime: toNumber(contractorSummaryRow[36]),
        oneHalfTime: toNumber(contractorSummaryRow[37]),
        total2: toNumber(contractorSummaryRow[38]),
        threeTime: toNumber(contractorSummaryRow[39]),
      };
    }

    const employeeErrors = employeeErrorRows ? parseOtErrorRows(employeeErrorRows, 'employee', employeeNameMap) : [];
    const contractorErrors = contractorErrorRows ? parseOtErrorRows(contractorErrorRows, 'contractor', contractorNameMap) : [];

    const groupSummary = GROUP_BY_SEQUENCE.map(({ group }) => {
      const employee = summarizeGroup(group, employees);
      const contractor = summarizeGroup(group, contractors);

      return {
        group,
        employeeCount: employee.count,
        contractorCount: contractor.count,
        employeeTotal: employee.total,
        contractorTotal: contractor.total,
        employeeTotal2: employee.total2,
        contractorTotal2: contractor.total2,
        total: employee.total + contractor.total,
        total2: employee.total2 + contractor.total2,
      };
    });

    const employeeDailyTotals = Array.from({ length: 31 }, (_, index) => (
      employees.reduce((sum: number, employee: { days: number[] }) => sum + employee.days[index], 0)
    ));

    const contractorDailyTotals = Array.from({ length: 31 }, (_, index) => (
      contractors.reduce((sum: number, contractor: { days: number[] }) => sum + contractor.days[index], 0)
    ));

    return NextResponse.json({
      employeeTitle: employeeData.title,
      contractorTitle: contractorData.title,
      employees,
      contractors,
      employeeErrors,
      contractorErrors,
      groupSummary,
      employeeDailyTotals,
      contractorDailyTotals,
      officialContractorTotals,
      employeeTotal: groupSummary.reduce((sum, item) => sum + item.employeeTotal, 0),
      contractorTotal: groupSummary.reduce((sum, item) => sum + item.contractorTotal, 0),
      total: groupSummary.reduce((sum, item) => sum + item.total, 0),
      employeeTotal2: groupSummary.reduce((sum, item) => sum + item.employeeTotal2, 0),
      contractorTotal2: groupSummary.reduce((sum, item) => sum + item.contractorTotal2, 0),
      total2: groupSummary.reduce((sum, item) => sum + item.total2, 0),
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('OT Summary API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
