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

const parseOtRows = (rows: any[][], type: 'employee' | 'contractor') => {
  const title = rows.flat().find((cell) => cell?.toString().trim())?.toString() || (type === 'employee' ? 'สรุป OT พนักงาน' : 'สรุป OT ลูกจ้าง');

  const people = rows
    .map((row) => {
      const sequence = toNumber(row[0]);
      if (!sequence) return null;

      const isEmployee = type === 'employee';
      const dayStartIndex = isEmployee ? 4 : 3;
      const days = Array.from({ length: 31 }, (_, index) => toNumber(row[index + dayStartIndex]));
      const dayTotal = days.reduce((sum, value) => sum + value, 0);

      const total = isEmployee
        ? (toNumber(row[35]) || dayTotal)
        : (toNumber(row[35]) || dayTotal);

      const total2 = isEmployee
        ? (toNumber(row[36]) || total)
        : (toNumber(row[38]) || total);

      const groupVal = row[1]?.toString()?.trim() || '';
      const mappedGroup = mapGroupValue(groupVal);
      const groupFromSeq = getGroup(sequence, isEmployee);
      
      const group = isEmployee 
        ? groupFromSeq 
        : (otGroups.includes(mappedGroup) ? mappedGroup : groupFromSeq);

      return {
        sequence,
        employeeId: isEmployee ? row[1]?.toString() || '' : row[1]?.toString() || '',
        name: row[2]?.toString() || '',
        position: isEmployee ? row[3]?.toString() || '' : '',
        group,
        type,
        days,
        holidayHours: isEmployee ? 0 : toNumber(row[34]),
        total,
        oneTime: isEmployee ? 0 : toNumber(row[36]),
        oneHalfTime: isEmployee ? 0 : toNumber(row[37]),
        total2,
        threeTime: isEmployee ? 0 : toNumber(row[39]),
      };
    })
    .filter(Boolean);

  return { title, people };
};

const parseOtErrorRows = (rows: any[][], type: 'employee' | 'contractor') => {
  const people = rows
    .map((row) => {
      const sequence = toNumber(row[0]);
      if (!sequence) return null;

      const isEmployee = type === 'employee';
      const dayStartIndex = isEmployee ? 4 : 3;
      const days = Array.from({ length: 31 }, (_, index) => {
        const cell = row[index + dayStartIndex]?.toString()?.trim() || '';
        return cell === 'TRUE';
      });
      const total = toNumber(row[row.length - 1]);

      const groupVal = row[1]?.toString()?.trim() || '';
      const mappedGroup = mapGroupValue(groupVal);
      const groupFromSeq = getGroup(sequence, isEmployee);
      
      const group = isEmployee 
        ? groupFromSeq 
        : (otGroups.includes(mappedGroup) ? mappedGroup : groupFromSeq);

      return {
        sequence,
        employeeId: isEmployee ? row[1]?.toString() || '' : row[1]?.toString() || '',
        name: row[2]?.toString() || '',
        position: isEmployee ? row[3]?.toString() || '' : '',
        group,
        days,
        total,
      };
    })
    .filter(Boolean);

  return people;
};

const summarizeGroup = (group: string, people: any[]) => {
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

    const employeeErrors = employeeErrorRows ? parseOtErrorRows(employeeErrorRows, 'employee') : [];
    const contractorErrors = contractorErrorRows ? parseOtErrorRows(contractorErrorRows, 'contractor') : [];

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
      employees.reduce((sum: number, employee: any) => sum + employee.days[index], 0)
    ));

    const contractorDailyTotals = Array.from({ length: 31 }, (_, index) => (
      contractors.reduce((sum: number, contractor: any) => sum + contractor.days[index], 0)
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
