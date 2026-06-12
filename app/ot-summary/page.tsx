'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, ChevronDown, Clock, Filter, RefreshCw, ShoppingCart, UserRound } from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';

type EmployeeOtRow = {
  sequence: number;
  employeeId: string;
  name: string;
  position: string;
  group: string;
  days: number[];
  holidayHours?: number;
  total: number;
  oneTime?: number;
  oneHalfTime?: number;
  total2: number;
  threeTime?: number;
};

type OtErrorRow = {
  sequence: number;
  employeeId: string;
  name: string;
  position: string;
  group: string;
  days: boolean[];
  total: number;
};

type EtasRow = {
  sequence: number;
  employeeId: string;
  name: string;
  position?: string;
  group: string;
  days: number[];
  total: number;
};

type OtSummaryData = {
  employeeTitle?: string;
  contractorTitle?: string;
  employeeEtasTitle?: string;
  contractorEtasTitle?: string;
  employees?: EmployeeOtRow[];
  contractors?: EmployeeOtRow[];
  employeeEtas?: EtasRow[];
  contractorEtas?: EtasRow[];
  employeeErrors?: OtErrorRow[];
  contractorErrors?: OtErrorRow[];
  officialContractorTotals?: {
    holidayHours: number;
    total: number;
    oneTime: number;
    oneHalfTime: number;
    total2: number;
    threeTime: number;
  };
  error?: string;
};

const formatNumber = (value: number) => Number(value.toFixed(2)).toLocaleString('th-TH', { maximumFractionDigits: 2 });

const contractorTailHeaderClasses = [
  'bg-[#ffd6d6] text-[#dc2626]',
  'bg-[#fff3c4] text-[#d7c900]',
  'bg-white text-[#dc2626]',
  'bg-[#fff3c4] text-[#d7c900]',
  'bg-[#31f4ff] text-[#00a6c8]',
  'bg-white text-[#dc2626]',
];

const otGroups = ['W11', 'W12', 'W13', 'W14'];

const emptyEmployeeTotals = {
  total: 0,
  total2: 0,
};

const emptyContractorTotals = {
  holidayHours: 0,
  total: 0,
  oneTime: 0,
  oneHalfTime: 0,
  total2: 0,
  threeTime: 0,
};

const getEmployeeTotals = (rows: EmployeeOtRow[]) => rows.reduce(
  (sum, employee) => ({
    total: sum.total + employee.total,
    total2: sum.total2 + employee.total2,
  }),
  { ...emptyEmployeeTotals },
);

const getContractorTotals = (rows: EmployeeOtRow[]) => rows.reduce(
  (sum, contractor) => ({
    holidayHours: sum.holidayHours + (contractor.holidayHours || 0),
    total: sum.total + contractor.total,
    oneTime: sum.oneTime + (contractor.oneTime || 0),
    oneHalfTime: sum.oneHalfTime + (contractor.oneHalfTime || 0),
    total2: sum.total2 + contractor.total2,
    threeTime: sum.threeTime + (contractor.threeTime || 0),
  }),
  { ...emptyContractorTotals },
);

const getEtasTotals = (rows: EtasRow[]) => rows.reduce(
  (sum, row) => ({
    total: sum.total + row.total,
  }),
  { total: 0 },
);

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' }
  }
};

/**
 * renderEmployeeTable: แสดงตารางสรุป OT สำหรับพนักงาน (Staff)
 */
const renderEmployeeTable = (rows: EmployeeOtRow[], group: string) => {
  const isAll = group === 'ALL-EMPLOYEES';
  return (
    <div className="overflow-x-auto">
      <table className={`w-full ${isAll ? 'min-w-[1400px]' : 'min-w-[800px] xl:min-w-0'} table-fixed border-collapse border border-[#21324a] text-center text-[10px] md:text-[11px]`}>
        <colgroup>
          <col className="w-[30px]" />
          <col className="w-[55px]" />
          <col className="w-[125px]" />
          <col className="w-[38px]" />
          {Array.from({ length: 31 }, (_, index) => (
            <col key={`${group}-employee-day-col-${index}`} className="w-[17px] md:w-[18px]" />
          ))}
          <col className="w-[34px]" />
          <col className="w-[42px]" />
        </colgroup>
        <thead className="text-[9px] md:text-[10px] font-black text-slate-900">
          <tr>
            <th colSpan={4} className="border border-slate-700 bg-white px-1 py-1 font-black">
              <div className="text-[11px] md:text-[12px]">มิถุนายน 2569</div>
              <div className="text-[9px] md:text-[10px]">กบย-ช., หสบ-ช. (ล่วงเวลา 30 , 45 ชั่วโมง)</div>
            </th>
            <th colSpan={31} className="border border-slate-700 bg-white px-1 py-1 font-black text-[11px] md:text-[12px]">วันที่</th>
            <th colSpan={2} className="border border-slate-700 bg-white px-1 py-1 font-black"></th>
          </tr>
          <tr>
            {['ลำดับ', 'เลขประจำตัว', 'ชื่อ', 'ตำแหน่ง', ...Array.from({ length: 31 }, (_, index) => `${index + 1}`), 'รวม', 'รวมx3'].map((header, index) => (
              <th key={`${group}-${header}`} className={`border border-slate-700 bg-[#d9d9d9] px-0.5 py-1 font-black whitespace-nowrap ${index >= 35 ? 'bg-[#ffd119] text-[#061b3d]' : ''}`}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((employee, index) => (
            <motion.tr 
              key={`${group}-${employee.employeeId}-${employee.sequence}-${index}`} 
              className={index % 2 === 0 ? 'bg-white' : 'bg-[#e4f5ed]'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.01 }}
            >
              <td className="border border-slate-700 px-0.5 py-1 font-bold">{employee.sequence}</td>
              <td className="border border-slate-700 px-0.5 py-1 font-bold">{employee.employeeId}</td>
              <td className="truncate border border-slate-700 px-1 py-1 text-left font-bold whitespace-nowrap" title={employee.name}>{employee.name}</td>
              <td className="border border-slate-700 px-0.5 py-1 font-bold">{employee.position}</td>
              {employee.days.map((value, dayIndex) => (
                <td key={`${group}-${employee.employeeId}-${dayIndex}`} className="border border-slate-700 px-0.5 py-1 font-bold">
                  {value ? formatNumber(value) : '-'}
                </td>
              ))}
              <td className="border border-slate-700 bg-[#ffd119] px-0.5 py-1 font-black text-[#4A4A49]">{formatNumber(employee.total)}</td>
              <td className="border border-slate-700 bg-[#ffd119] px-0.5 py-1 font-black text-[#4A4A49]">{formatNumber(employee.total2)}</td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * renderContractorTable: แสดงตารางสรุป OT สำหรับลูกจ้าง (Contractor)
 */
const renderContractorTable = (rows: EmployeeOtRow[], totals: typeof emptyContractorTotals, group: string) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[1400px] table-fixed border-collapse border border-[#21324a] text-center text-[11px]">
      <colgroup>
        <col className="w-[42px]" />
        <col className="w-[48px]" />
        <col className="w-[160px]" />
        {Array.from({ length: 31 }, (_, index) => (
          <col key={`${group}-contractor-day-col-${index}`} className="w-[24px]" />
        ))}
        {Array.from({ length: 6 }, (_, index) => (
          <col key={`${group}-contractor-total-col-${index}`} className={index === 4 ? 'w-[70px]' : 'w-[54px]'} />
        ))}
      </colgroup>
      <thead className="text-[10px] font-black text-slate-900">
        <tr>
          <th colSpan={3} className="border border-slate-700 bg-white px-1 py-1 font-black text-[11px] md:text-[12px]">ล่วงเวลาลูกจ้าง มิถุนายน 2569</th>
          <th colSpan={31} className="border border-slate-700 bg-white px-1 py-1 font-black text-[11px] md:text-[12px]">วันที่</th>
          <th colSpan={2} className="border border-slate-700 bg-white px-1 py-1 font-black"></th>
          <th className="border border-slate-700 bg-white px-1 py-1 font-black text-[#dc2626]">1เท่า</th>
          <th className="border border-slate-700 bg-[#fff3c4] px-1 py-1 font-black text-[#d7c900]">1.5เท่า</th>
          <th className="border border-slate-700 bg-white px-1 py-1 font-black text-[#00a6c8]">ยอดจ่าย</th>
          <th className="border border-slate-700 bg-white px-1 py-1 font-black text-[#dc2626]">3เท่า</th>
        </tr>
        <tr>
          {['ลำดับ', 'หมวด', 'ชื่อ', ...Array.from({ length: 31 }, (_, index) => `${index + 1}`), 'ชม.วันหยุด', 'รวมชม1.5', '61.63', '92.44', 'รวมเงิน', '184.89'].map((header, index) => (
            <th key={`${group}-${header}`} className={`border border-slate-700 bg-[#d9d9d9] px-0.5 py-1 font-black leading-tight ${index === 2 ? 'text-left' : ''} ${index >= 34 ? contractorTailHeaderClasses[index - 34] : ''}`}>{header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((contractor, index) => (
          <motion.tr 
            key={`${group}-${contractor.sequence}-${contractor.name}-${index}`} 
            className={index % 2 === 0 ? 'bg-white' : 'bg-[#fce7f3]'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.01 }}
          >
            <td className="border border-slate-700 px-0.5 py-1 font-bold">{contractor.sequence}</td>
            <td className="border border-slate-700 px-0.5 py-1 font-black text-[#4A4A49]">{contractor.employeeId}</td>
            <td className="truncate border border-slate-700 px-1 py-1 text-left font-bold" title={contractor.name}>{contractor.name}</td>
            {contractor.days.map((value, dayIndex) => (
              <td key={`${group}-${contractor.sequence}-${dayIndex}`} className="border border-slate-700 px-0.5 py-1 font-bold">
                {value ? formatNumber(value) : '-'}
              </td>
            ))}
            <td className="border border-slate-700 bg-[#ffd6d6] px-0.5 py-1 font-black text-[#4A4A49]">{formatNumber(contractor.holidayHours || 0)}</td>
            <td className="border border-slate-700 bg-[#fff3c4] px-0.5 py-1 font-black text-[#4A4A49]">{formatNumber(contractor.total)}</td>
            <td className="border border-slate-700 bg-[#ffd6d6] px-0.5 py-1 font-black text-[#4A4A49]">{formatNumber(contractor.oneTime || 0)}</td>
            <td className="border border-slate-700 bg-[#fff3c4] px-0.5 py-1 font-black text-[#4A4A49]">{formatNumber(contractor.oneHalfTime || 0)}</td>
            <td className="border border-slate-700 bg-[#31f4ff] px-0.5 py-1 font-black text-[#004851]">{formatNumber(contractor.total2)}</td>
            <td className="border border-slate-700 bg-[#f1ddc9] px-0.5 py-1 font-black text-[#4A4A49]">{formatNumber(contractor.threeTime || 0)}</td>
          </motion.tr>
        ))}
        <tr className="bg-[#e4f5ed]">
          <td colSpan={34} className="border border-slate-700 px-2 py-2 text-right font-black text-[#061b3d]">ยอดรวมสุทธิ</td>
          <td className="border border-slate-700 bg-[#ffd6d6] px-0.5 py-2 font-black text-[#4A4A49]">{formatNumber(totals.holidayHours)}</td>
          <td className="border border-slate-700 bg-[#fff3c4] px-0.5 py-2 font-black text-[#4A4A49]">{formatNumber(totals.total)}</td>
          <td className="border border-slate-700 bg-[#ffd6d6] px-0.5 py-2 font-black text-[#4A4A49]">{formatNumber(totals.oneTime)}</td>
          <td className="border border-slate-700 bg-[#fff3c4] px-0.5 py-2 font-black text-[#4A4A49]">{formatNumber(totals.oneHalfTime)}</td>
          <td className="border border-slate-700 bg-[#31f4ff] px-0.5 py-2 font-black text-[#004851]">{formatNumber(totals.total2)}</td>
          <td className="border border-slate-700 bg-[#f1ddc9] px-0.5 py-2 font-black text-[#4A4A49]">{formatNumber(totals.threeTime)}</td>
        </tr>
      </tbody>
    </table>
  </div>
);

const renderEtasTable = (
  rows: EtasRow[],
  totals: { total: number },
  group: string,
  options: { title: string; showPosition?: boolean },
) => {
  const fixedColumnCount = options.showPosition ? 3 : 2;
  const totalColumnIndex = options.showPosition ? 34 : 33;

  return (
    <div className="overflow-x-auto">
      <table className={`${options.showPosition ? 'min-w-[1240px]' : 'min-w-[1180px]'} w-full table-fixed border-collapse border border-[#21324a] text-center text-[10px] md:text-[11px]`}>
        <colgroup>
          <col className="w-[42px]" />
          <col className="w-[170px]" />
          {options.showPosition && <col className="w-[70px]" />}
          {Array.from({ length: 31 }, (_, index) => (
            <col key={`${group}-etas-day-col-${index}`} className="w-[24px]" />
          ))}
          <col className="w-[60px]" />
        </colgroup>
        <thead className="text-[9px] md:text-[10px] font-black text-slate-900">
          <tr>
            <th colSpan={fixedColumnCount} className="border border-slate-700 bg-white px-1 py-1 font-black text-[11px] md:text-[12px]">{options.title}</th>
            <th colSpan={31} className="border border-slate-700 bg-white px-1 py-1 font-black text-[11px] md:text-[12px]">วันที่</th>
            <th className="border border-slate-700 bg-white px-1 py-1 font-black">รวม</th>
          </tr>
          <tr>
            {['ลำดับ', 'ชื่อ', ...(options.showPosition ? ['ตำแหน่ง'] : []), ...Array.from({ length: 31 }, (_, index) => `${index + 1}`), 'รวม'].map((header, index) => (
              <th key={`${group}-etas-${header}-${index}`} className={`border border-slate-700 bg-[#d9d9d9] px-0.5 py-1 font-black leading-tight ${index === 1 ? 'text-left' : ''} ${index === totalColumnIndex ? 'bg-[#bae6fd] text-[#075985]' : ''}`}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <motion.tr
              key={`${group}-etas-${row.sequence}-${row.name}-${index}`}
              className={index % 2 === 0 ? 'bg-white' : 'bg-[#e0f2fe]'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.01 }}
            >
              <td className="border border-slate-700 px-0.5 py-1 font-bold">{row.sequence}</td>
              <td className="truncate border border-slate-700 px-1 py-1 text-left font-bold" title={row.name}>{row.name}</td>
              {options.showPosition && <td className="border border-slate-700 px-0.5 py-1 font-bold">{row.position}</td>}
              {row.days.map((value, dayIndex) => (
                <td key={`${group}-etas-${row.sequence}-${dayIndex}`} className="border border-slate-700 px-0.5 py-1 font-bold">
                  {value ? formatNumber(value) : '-'}
                </td>
              ))}
              <td className="border border-slate-700 bg-[#bae6fd] px-0.5 py-1 font-black text-[#075985]">{formatNumber(row.total)}</td>
            </motion.tr>
          ))}
          <tr className="bg-[#e0f2fe]">
            <td colSpan={totalColumnIndex} className="border border-slate-700 px-2 py-2 text-right font-black text-[#075985]">ยอดรวมข้อมูลสแกน</td>
            <td className="border border-slate-700 bg-[#bae6fd] px-0.5 py-2 font-black text-[#075985]">{formatNumber(totals.total)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

/**
 * renderOtErrorTable: แสดงตารางตรวจสอบข้อผิดพลาด (Check OT Error)
 */
const renderOtErrorTable = (rows: OtErrorRow[], type: 'employee' | 'contractor') => {
  const isEmployee = type === 'employee';
  return (
    <div className="overflow-x-auto mt-4">
      <table className="w-full min-w-[800px] table-fixed border-collapse border border-[#21324a] text-center text-[10px] md:text-[11px]">
        <colgroup>
          <col className="w-[30px]" />
          <col className="w-[125px]" />
          {isEmployee && <col className="w-[80px]" />}
          {Array.from({ length: 31 }, (_, index) => (
            <col key={`error-day-col-${index}`} className="w-[17px] md:w-[18px]" />
          ))}
          <col className="w-[34px]" />
        </colgroup>
        <thead className="text-[9px] md:text-[10px] font-black text-slate-900">
          <tr className="bg-red-500 text-white">
            <th colSpan={isEmployee ? 35 : 34} className="border border-slate-700 px-1 py-1 font-black text-sm uppercase tracking-wider">
              Check OT Error {isEmployee ? 'พนักงาน' : 'ลูกจ้าง'}
            </th>
          </tr>
          <tr>
            {['ลำดับ', 'ชื่อ', ...(isEmployee ? ['ตำแหน่ง'] : []), ...Array.from({ length: 31 }, (_, index) => `${index + 1}`), 'รวม'].map((header, index) => (
              <th key={`error-header-${header}-${index}`} className="border border-slate-700 bg-[#d9d9d9] px-0.5 py-1 font-black whitespace-nowrap">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <motion.tr 
              key={`error-row-${row.sequence}-${index}`} 
              className={index % 2 === 0 ? 'bg-white' : 'bg-[#fff5f5]'}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.015 }}
            >
              <td className="border border-slate-700 px-0.5 py-1 font-bold">{row.sequence}</td>
              <td className="truncate border border-slate-700 px-1 py-1 text-left font-bold whitespace-nowrap" title={row.name}>{row.name}</td>
              {isEmployee && <td className="border border-slate-700 px-0.5 py-1 font-bold">{row.position}</td>}
              {row.days.map((isError, dayIndex) => (
                <td 
                  key={`error-day-${row.sequence}-${dayIndex}`} 
                  className={`border border-slate-700 px-0.5 py-1 font-bold ${isError ? 'bg-[#dcfce7]' : 'bg-[#ff0000]'}`}
                >
                  {isError ? (
                    <div className="flex items-center justify-center">
                      <Check size={14} className="text-[#16a34a]" strokeWidth={5} />
                    </div>
                  ) : (
                    <div className="h-3.5" />
                  )}
                </td>
              ))}
              <td className="border border-slate-700 bg-[#ff0000] px-0.5 py-1 font-black text-white">{row.total}</td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};


type OtWorkerType = 'contractor' | 'employee';

export function OtSummaryContent({ workerType = 'contractor' }: { workerType?: OtWorkerType }) {
  const [data, setData] = useState<OtSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const isEmployeePage = workerType === 'employee';
  const pageTitle = isEmployeePage ? 'สรุป OT พนักงาน' : 'สรุป OT ลูกจ้าง';
  const pageSubtitle = isEmployeePage ? 'EGAT Employee OT Summary' : 'EGAT Contractor OT Summary';
  const rangeLabel = isEmployeePage ? 'พนง B2:AL20' : 'ลจ B2:AO34';
  const HeaderIcon = isEmployeePage ? UserRound : Clock;

  const loadData = useCallback(() => {
    setIsLoading(true);
    setError('');
    fetch('/api/ot-summary', { cache: 'no-store' })
      .then(async (res) => {
        const payload = await res.json();
        if (!res.ok || payload.error) throw new Error(payload.error || 'โหลดข้อมูลโอทีไม่สำเร็จ');
        setData(payload);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadData);
  }, [loadData]);

  const handleRefresh = () => {
    loadData();
  };

  const employees = data?.employees || [];
  const contractors = data?.contractors || [];
  const employeeEtas = data?.employeeEtas || [];
  const contractorEtas = data?.contractorEtas || [];
  const employeeErrors = data?.employeeErrors || [];
  const contractorErrors = data?.contractorErrors || [];
  const allContractorTotals = getContractorTotals(contractors);
  const allEmployeeEtasTotals = getEtasTotals(employeeEtas);
  const allContractorEtasTotals = getEtasTotals(contractorEtas);
  
  const employeeSections = otGroups.map((group) => {
    const rows = employees.filter((employee) => employee.group === group);
    const errors = employeeErrors.filter((err) => err.group === group);
    const totals = getEmployeeTotals(rows);
    const employeeEtasRows = employeeEtas.filter((row) => row.group === group);
    const employeeEtasTotals = getEtasTotals(employeeEtasRows);
    return { group, rows, errors, totals, employeeEtasRows, employeeEtasTotals };
  });

  const contractorSections = otGroups.map((group) => {
    const rows = contractors.filter((contractor) => contractor.group === group);
    const errors = contractorErrors.filter((err) => err.group === group);
    const totals = getContractorTotals(rows);
    const etasRows = contractorEtas.filter((row) => row.group === group);
    const etasTotals = getEtasTotals(etasRows);
    return { group, rows, errors, totals, etasRows, etasTotals };
  });

  return (
    <div className="min-h-screen bg-[#dedede] p-4 text-slate-900 md:p-8 font-sans">
      <motion.header 
        className="sticky top-0 z-50 mb-6 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between bg-white/90 backdrop-blur-sm p-4 md:p-6 rounded-2xl md:rounded-3xl border-b-4 border-[#ffd56d] shadow-md shadow-slate-200/70"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="flex items-center gap-4">
          <motion.div 
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#5c607f] text-[#ffef9a] shadow-lg"
            whileHover={{ rotate: 10, scale: 1.1 }}
          >
            <HeaderIcon size={28} strokeWidth={2.5} />
          </motion.div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-[#4A4A49]">{pageTitle}</h1>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-0.5">{pageSubtitle}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <AnimatePresence>
            {isLoading && (
              <motion.span 
                className="flex items-center text-xs font-black text-[#d4a300] mr-2 bg-yellow-50 px-2 py-1 rounded-lg uppercase"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                Updating...
              </motion.span>
            )}
          </AnimatePresence>
          <div className="flex h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-100 px-4 text-sm font-black text-[#4A4A49] shadow-inner">
            <Filter size={16} className="text-slate-400" />
            {rangeLabel}
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            className="px-3 md:px-4 py-2 md:py-3 bg-white text-[#4A4A49] rounded-xl md:rounded-2xl text-xs md:text-sm font-black border border-slate-200 shadow-sm flex items-center gap-2 disabled:opacity-60"
          >
            <RefreshCw size={16} strokeWidth={3} className={isLoading ? 'animate-spin text-[#d4a300]' : 'text-slate-500'} />
            รีเฟรชข้อมูล
          </motion.button>
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="px-4 md:px-6 py-2 md:py-3 bg-[#ffe08a] text-[#4A4A49] rounded-xl md:rounded-2xl text-xs md:text-sm font-black hover:bg-[#ffd56a] shadow-lg transition-all flex items-center gap-2"
            >
              เมนูหน้า
              <ChevronDown size={16} strokeWidth={3} className={menuOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />
            </motion.button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div 
                  className="absolute right-0 top-full z-20 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                >
                  <Link href="/" className="flex items-center gap-3 px-4 py-3 text-sm font-black text-[#4A4A49] hover:bg-slate-50">
                    <ArrowLeft size={18} className="text-slate-500" /> หน้าหลัก
                  </Link>
                  <Link href="/purchasing" className="flex items-center gap-3 border-t border-slate-100 px-4 py-3 text-sm font-black text-[#4A4A49] hover:bg-yellow-50">
                    <ShoppingCart size={18} className="text-[#d4a300]" /> จัดซื้อจัดจ้าง
                  </Link>
                  <Link href="/ot-summary" className="flex items-center gap-3 border-t border-slate-100 px-4 py-3 text-sm font-black text-[#4A4A49] hover:bg-sky-50">
                    <Clock size={18} className="text-sky-500" /> สรุป OT ลูกจ้าง
                  </Link>
                  <Link href="/ot-employee" className="flex items-center gap-3 border-t border-slate-100 px-4 py-3 text-sm font-black text-[#4A4A49] hover:bg-amber-50">
                    <UserRound size={18} className="text-amber-500" /> สรุป OT พนักงาน
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.header>

      <AnimatePresence mode="wait">
        {error ? (
          <motion.div 
            key="error"
            className="rounded-2xl border-2 border-red-100 bg-red-50 p-6 text-base font-black text-red-700 shadow-sm"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            {error}
          </motion.div>
        ) : isLoading || !data ? (
          <motion.div 
            key="loading"
            className="flex items-center justify-center gap-3 rounded-[2rem] border-2 border-[#dbeafe] bg-[#e8f5ff]/95 p-20 text-base font-black text-slate-400 shadow-sm uppercase tracking-widest"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <RefreshCw size={24} className="animate-spin text-[#d4a300]" /> กำลังโหลดข้อมูล...
          </motion.div>
        ) : (
          <motion.div 
            key="content"
            className="flex flex-col gap-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {!isEmployeePage && contractorSections.map(({ group, rows, errors, totals, etasRows, etasTotals }) => (
              <motion.section 
                key={group} 
                variants={itemVariants}
                className="overflow-hidden rounded-3xl border border-[#f4bfd2] border-b-[5px] border-b-[#f1a9c4] bg-[#fff0f6] shadow-[0_8px_18px_rgba(244,114,182,0.12)]"
              >
                <div className="border-b border-[#f4bfd2] bg-[#fff8fb] p-4 md:p-8">
                  <h2 className="flex items-center gap-3 text-2xl font-black text-[#061b3d] md:text-4xl">
                    <div className="h-8 w-3 rounded-full bg-[#f9a8d4] md:h-11"></div>
                    รายละเอียด OT ลูกจ้าง {group}
                  </h2>
                  <p className="mt-2 text-sm font-extrabold text-slate-600">{data.contractorTitle || 'สรุป OT ลูกจ้าง'} · B2:AO34</p>
                </div>

                <div className="grid gap-5 p-4 md:grid-cols-[20%_80%] md:p-6 xl:grid-cols-[20%_80%]">
                  <aside className="rounded-2xl border border-[#f4bfd2] bg-white p-5 shadow-sm md:p-6">
                    <p className="text-sm font-black text-[#f472b6]">หมวด</p>
                    <h3 className="mt-1 text-4xl font-black text-[#061b3d]">{group}</h3>
                    <dl className="mt-6 grid gap-3 text-base font-extrabold text-[#334155]">
                      <div className="flex items-center justify-between gap-4 rounded-xl bg-[#fff0f6] px-4 py-3">
                        <dt>จำนวนคน</dt>
                        <dd className="text-xl font-black text-[#061b3d]">{formatNumber(rows.length)} คน</dd>
                      </div>
                      <div className="flex items-center justify-between gap-4 rounded-xl bg-[#fff8da] px-4 py-3">
                        <dt>ชม.วันหยุด</dt>
                        <dd className="text-xl font-black text-[#061b3d]">{formatNumber(totals.holidayHours)} ชั่วโมง</dd>
                      </div>
                      <div className="flex items-center justify-between gap-4 rounded-xl bg-[#e8f5ff] px-4 py-3">
                        <dt>ชม.วันปกติ</dt>
                        <dd className="text-xl font-black text-[#061b3d]">{formatNumber(totals.total)} ชั่วโมง</dd>
                      </div>
                    </dl>
                  </aside>
                  <div className="min-w-0">
                    {renderContractorTable(rows, totals, group)}
                    <motion.div className="mt-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <h3 className="text-lg font-black text-[#0284c7] mb-3 flex items-center gap-2">
                        <div className="w-2 h-5 bg-[#38bdf8] rounded-full"></div>
                        ข้อมูลสแกนลายนิ้วมือลูกจ้าง {group}
                      </h3>
                      {renderEtasTable(etasRows, etasTotals, group, { title: `ข้อมูลสแกนลายนิ้วมือลูกจ้าง ${group}` })}
                    </motion.div>
                    {errors.length > 0 && (
                      <motion.div className="mt-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <h3 className="text-lg font-black text-red-600 mb-3 flex items-center gap-2">
                          <div className="w-2 h-5 bg-red-500 rounded-full"></div>
                          ตรวจสอบข้อผิดพลาด OT ลูกจ้าง {group}
                        </h3>
                        {renderOtErrorTable(errors, 'contractor')}
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.section>
            ))}

            {!isEmployeePage && (
            <motion.section 
              variants={itemVariants}
              className="overflow-hidden rounded-3xl border border-[#f4bfd2] border-b-[5px] border-b-[#f1a9c4] bg-[#fff0f6] shadow-[0_8px_18px_rgba(244,114,182,0.12)]"
            >
              <div className="border-b border-[#f4bfd2] bg-[#fff8fb] p-4 md:p-8">
                <h2 className="flex items-center gap-3 text-2xl font-black text-[#061b3d] md:text-4xl">
                  <div className="h-8 w-3 rounded-full bg-[#f9a8d4] md:h-11"></div>
                  รายละเอียด OT ลูกจ้าง รวมทั้งหมด
                </h2>
                <p className="mt-2 text-sm font-extrabold text-slate-600">{data.contractorTitle || 'สรุป OT ลูกจ้าง'} · ตารางรวมหลัง W14</p>
              </div>
              <div className="p-4 md:p-8">
                {renderContractorTable(contractors, data.officialContractorTotals || allContractorTotals, 'ALL-CONTRACTORS')}
                <motion.div className="mt-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h3 className="text-xl font-black text-[#0284c7] mb-4 flex items-center gap-2">
                    <div className="w-2 h-6 bg-[#38bdf8] rounded-full"></div>
                    ข้อมูลสแกนลายนิ้วมือลูกจ้าง (ทั้งหมด)
                  </h3>
                  {renderEtasTable(contractorEtas, allContractorEtasTotals, 'ALL-CONTRACTOR-ETAS', { title: 'ข้อมูลสแกนลายนิ้วมือลูกจ้าง (ทั้งหมด)' })}
                </motion.div>
                {contractorErrors.length > 0 && (
                  <motion.div className="mt-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <h3 className="text-xl font-black text-red-600 mb-4 flex items-center gap-2">
                      <div className="w-2 h-6 bg-red-500 rounded-full"></div>
                      ตรวจสอบข้อผิดพลาด OT ลูกจ้าง (ทั้งหมด)
                    </h3>
                    {renderOtErrorTable(contractorErrors, 'contractor')}
                  </motion.div>
                )}
              </div>
            </motion.section>
            )}

            {isEmployeePage && employeeSections.map(({ group, rows, errors, totals, employeeEtasRows, employeeEtasTotals }) => (
              <motion.section 
                key={group} 
                variants={itemVariants}
                className="overflow-hidden rounded-3xl border border-[#efd58d] border-b-[5px] border-b-[#eecb70] bg-[#fff8da] shadow-[0_8px_18px_rgba(234,179,8,0.12)]"
              >
                <div className="border-b border-[#efd58d] bg-[#fffdf1] p-4 md:p-8">
                  <h2 className="flex items-center gap-3 text-2xl font-black text-[#061b3d] md:text-4xl">
                    <div className="h-8 w-3 rounded-full bg-[#f9a66c] md:h-11"></div>
                    รายละเอียด OT พนักงาน {group}
                  </h2>
                  <p className="mt-2 text-sm font-extrabold text-slate-600">{data.employeeTitle || 'สรุป OT พนักงาน'} · B2:AL20</p>
                </div>
                <div className="grid gap-5 p-4 md:grid-cols-[20%_80%] md:p-6 xl:grid-cols-[20%_80%]">
                  <aside className="rounded-2xl border border-[#efd58d] bg-white p-5 shadow-sm md:p-6">
                    <p className="text-sm font-black text-[#d4a300]">หมวด</p>
                    <h3 className="mt-1 text-4xl font-black text-[#061b3d]">{group}</h3>
                    <dl className="mt-6 grid gap-3 text-base font-extrabold text-[#334155]">
                      <div className="flex items-center justify-between gap-4 rounded-xl bg-[#fff8da] px-4 py-3">
                        <dt>จำนวนคน</dt>
                        <dd className="text-xl font-black text-[#061b3d]">{formatNumber(rows.length)} คน</dd>
                      </div>
                      <div className="flex items-center justify-between gap-4 rounded-xl bg-[#fff0f6] px-4 py-3">
                        <dt>OT รวม</dt>
                        <dd className="text-xl font-black text-[#061b3d]">{formatNumber(totals.total)} ชั่วโมง</dd>
                      </div>
                    </dl>
                  </aside>
                  <div className="min-w-0">
                    {renderEmployeeTable(rows, group)}
                    <motion.div className="mt-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <h3 className="text-lg font-black text-[#0284c7] mb-3 flex items-center gap-2">
                        <div className="w-2 h-5 bg-[#38bdf8] rounded-full"></div>
                        ข้อมูลสแกนลายนิ้วมือพนักงาน {group}
                      </h3>
                      {renderEtasTable(employeeEtasRows, employeeEtasTotals, group, { title: `ข้อมูลสแกนลายนิ้วมือพนักงาน ${group}`, showPosition: true })}
                    </motion.div>
                    {errors.length > 0 && (
                      <motion.div className="mt-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <h3 className="text-lg font-black text-red-600 mb-3 flex items-center gap-2">
                          <div className="w-2 h-5 bg-red-500 rounded-full"></div>
                          ตรวจสอบข้อผิดพลาด OT พนักงาน {group}
                        </h3>
                        {renderOtErrorTable(errors, 'employee')}
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.section>
            ))}

            {isEmployeePage && (
            <motion.section 
              variants={itemVariants}
              className="overflow-hidden rounded-3xl border border-[#efd58d] border-b-[5px] border-b-[#eecb70] bg-[#fff8da] shadow-[0_8px_18px_rgba(234,179,8,0.12)]"
            >
              <div className="border-b border-[#efd58d] bg-[#fffdf1] p-4 md:p-8">
                <h2 className="flex items-center gap-3 text-2xl font-black text-[#061b3d] md:text-4xl">
                  <div className="h-8 w-3 rounded-full bg-[#f9a66c] md:h-11"></div>
                  รายละเอียด OT พนักงาน รวมทั้งหมด
                </h2>
                <p className="mt-2 text-sm font-extrabold text-slate-600">{data.employeeTitle || 'สรุป OT พนักงาน'} · ตารางรวมหลัง W14</p>
              </div>
              <div className="p-4 md:p-8">
                {renderEmployeeTable(employees, 'ALL-EMPLOYEES')}
                <motion.div className="mt-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h3 className="text-xl font-black text-[#0284c7] mb-4 flex items-center gap-2">
                    <div className="w-2 h-6 bg-[#38bdf8] rounded-full"></div>
                    ข้อมูลสแกนลายนิ้วมือพนักงาน (ทั้งหมด)
                  </h3>
                  {renderEtasTable(employeeEtas, allEmployeeEtasTotals, 'ALL-EMPLOYEE-ETAS', { title: 'ข้อมูลสแกนลายนิ้วมือพนักงาน (ทั้งหมด)', showPosition: true })}
                </motion.div>
                {employeeErrors.length > 0 && (
                  <motion.div className="mt-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <h3 className="text-xl font-black text-red-600 mb-4 flex items-center gap-2">
                      <div className="w-2 h-6 bg-red-500 rounded-full"></div>
                      ตรวจสอบข้อผิดพลาด OT พนักงาน (ทั้งหมด)
                    </h3>
                    {renderOtErrorTable(employeeErrors, 'employee')}
                  </motion.div>
                )}
              </div>
            </motion.section>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function OtSummaryPage() {
  return <OtSummaryContent />;
}
