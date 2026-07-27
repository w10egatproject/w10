'use client';

import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { formatThaiDate } from '@/lib/shop-order/domain';

interface CustomDatePickerProps {
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

const THAI_MONTHS = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];

const DAYS_HEADER = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

function parseIsoDate(iso: string | null): Date {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return new Date();
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function toIsoString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function CustomDatePicker({
  value,
  onChange,
  placeholder = 'เลือกวันที่',
  disabled,
}: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedDate = value ? parseIsoDate(value) : null;
  const [viewDate, setViewDate] = useState<Date>(selectedDate || new Date());

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  // First day of current month
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const startingDayOfWeek = firstDayOfMonth.getDay();

  // Days in current month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const prevMonth = () => {
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const selectDay = (day: number) => {
    const newDate = new Date(currentYear, currentMonth, day);
    onChange(toIsoString(newDate));
    setIsOpen(false);
  };

  const selectToday = () => {
    const today = new Date();
    setViewDate(today);
    onChange(toIsoString(today));
    setIsOpen(false);
  };

  const todayIso = toIsoString(new Date());

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Native date input for accessibility, testing-library, and form serialization */}
      <input
        type="date"
        tabIndex={-1}
        disabled={disabled}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        className="sr-only absolute h-0 w-0 opacity-0 pointer-events-none"
      />

      {/* Styled custom trigger button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!isOpen && selectedDate) {
            setViewDate(selectedDate);
          }
          setIsOpen((prev) => !prev);
        }}
        className={`mt-1 flex h-10 w-full items-center justify-between rounded-xl border bg-white px-3 font-normal text-slate-800 transition-all ${
          isOpen
            ? 'border-indigo-600 ring-2 ring-indigo-500/20'
            : 'border-slate-300 hover:border-slate-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span className="flex items-center gap-2">
          <CalendarIcon
            className={`h-4 w-4 ${
              isOpen ? 'text-indigo-600' : 'text-slate-400'
            }`}
          />
          <span
            className={value ? 'text-slate-900 font-medium' : 'text-slate-400'}
          >
            {value ? `${formatThaiDate(value)}` : placeholder}
          </span>
        </span>
        {value && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.stopPropagation();
                onChange(null);
              }
            }}
            aria-label="ล้างวันที่"
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-3.5 w-3.5" />
          </span>
        )}
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="ปฏิทินเลือกวันที่"
          className="absolute z-50 mt-1.5 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl ring-1 ring-black/5 animate-in fade-in-50 zoom-in-95 duration-150"
        >
          {/* Header Month / Year Navigation */}
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={prevMonth}
              className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="เดือนก่อนหน้า"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-bold text-slate-800">
              {THAI_MONTHS[currentMonth]} {currentYear + 543}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="เดือนถัดไป"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Days Header */}
          <div className="mb-2 grid grid-cols-7 text-center text-xs font-bold text-slate-400">
            {DAYS_HEADER.map((day) => (
              <div key={day} className="py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-sm">
            {/* Blank leading days */}
            {Array.from({ length: startingDayOfWeek }).map((_, index) => (
              <div key={`blank-${index}`} className="h-8 w-8" />
            ))}

            {/* Days of month */}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const dateObj = new Date(currentYear, currentMonth, day);
              const dateIso = toIsoString(dateObj);
              const isSelected = value === dateIso;
              const isToday = dateIso === todayIso;

              return (
                <button
                  type="button"
                  key={day}
                  onClick={() => selectDay(day)}
                  className={`grid h-8 w-8 place-items-center rounded-xl text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : isToday
                      ? 'border border-indigo-500 font-bold text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Footer Quick Action */}
          <div className="mt-3 border-t border-slate-100 pt-2 flex justify-between items-center text-xs">
            <button
              type="button"
              onClick={selectToday}
              className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              เลือกวันนี้
            </button>
            <span className="text-[10px] text-slate-400">
              พ.ศ. {formatThaiDate(value || todayIso)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
