'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  List,
  MapPin,
  Search,
  Sun,
} from 'lucide-react';
import { downloadIcsCalendar } from '../lib/calendarExport';
import type { AcademicCalendarCategory, AcademicCalendarItem } from '../types/pust';
import { EditTriggerButton } from './EditTriggerButton';

export type CalendarFilterCategory = 'all' | AcademicCalendarCategory;

interface NormalizedCalendarItem extends AcademicCalendarItem {
  id: string;
  resolvedCategory: AcademicCalendarCategory;
  effectiveEndDate: string;
}

const CATEGORY_META: Record<
  AcademicCalendarCategory,
  {
    label: string;
    shortLabel: string;
    textClass: string;
    bgSoftClass: string;
    borderClass: string;
    dotClass: string;
  }
> = {
  exam: {
    label: 'Exam',
    shortLabel: 'Exam',
    textClass: 'text-pust-900',
    bgSoftClass: 'bg-pust-50',
    borderClass: 'border-pust-200',
    dotClass: 'bg-pust-800',
  },
  holiday: {
    label: 'Holiday',
    shortLabel: 'Holiday',
    textClass: 'text-emerald-900',
    bgSoftClass: 'bg-emerald-50',
    borderClass: 'border-emerald-200',
    dotClass: 'bg-emerald-700',
  },
  deadline: {
    label: 'Semester Deadline',
    shortLabel: 'Deadline',
    textClass: 'text-amber-900',
    bgSoftClass: 'bg-amber-50',
    borderClass: 'border-amber-200',
    dotClass: 'bg-amber-600',
  },
  academic: {
    label: 'Academic Milestone',
    shortLabel: 'Academic',
    textClass: 'text-slate-800',
    bgSoftClass: 'bg-slate-100',
    borderClass: 'border-slate-300',
    dotClass: 'bg-slate-600',
  },
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function getLocalTodayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function inferCalendarCategory(item: AcademicCalendarItem): AcademicCalendarCategory {
  if (
    item.category === 'exam' ||
    item.category === 'holiday' ||
    item.category === 'deadline' ||
    item.category === 'academic'
  ) {
    return item.category;
  }
  const text = `${item.event} ${item.term} ${item.details || ''}`.toLowerCase();
  if (/\b(exam|examination|mid-term|midterm|assessment|viva|test)\b/.test(text)) {
    return 'exam';
  }
  if (
    /\b(holiday|vacation|recess|eid|puja|victory|independence|baishakh|shab|dibosh|christmas|closed)\b/.test(
      text
    )
  ) {
    return 'holiday';
  }
  if (
    /\b(deadline|fill-up|fill up|add\/drop|clearance|submission|registration|last day|fee|waiver)\b/.test(
      text
    )
  ) {
    return 'deadline';
  }
  return 'academic';
}

function isValidIsoDate(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function parseIsoParts(iso: string): { year: number; month: number; day: number } {
  const [y, m, d] = iso.split('-').map(Number);
  return { year: y, month: m - 1, day: d };
}

function formatReadableDate(iso: string): string {
  if (!isValidIsoDate(iso)) return iso;
  const { year, month, day } = parseIsoParts(iso);
  return `${String(day).padStart(2, '0')} ${MONTH_NAMES[month].slice(0, 3)} ${year}`;
}

function formatDateRange(start: string, end?: string): string {
  if (!end || end === start) return formatReadableDate(start);
  if (!isValidIsoDate(start) || !isValidIsoDate(end)) return `${start} – ${end}`;
  const s = parseIsoParts(start);
  const e = parseIsoParts(end);
  if (s.year === e.year && s.month === e.month) {
    return `${String(s.day).padStart(2, '0')}–${String(e.day).padStart(2, '0')} ${MONTH_NAMES[s.month].slice(0, 3)} ${s.year}`;
  }
  if (s.year === e.year) {
    return `${String(s.day).padStart(2, '0')} ${MONTH_NAMES[s.month].slice(0, 3)} – ${String(e.day).padStart(2, '0')} ${MONTH_NAMES[e.month].slice(0, 3)} ${s.year}`;
  }
  return `${formatReadableDate(start)} – ${formatReadableDate(end)}`;
}

function getRelativeDayLabel(start: string, end: string, todayIso: string): {
  label: string;
  tone: 'ongoing' | 'soon' | 'upcoming' | 'past';
} {
  if (!isValidIsoDate(start) || !isValidIsoDate(todayIso)) {
    return { label: start, tone: 'upcoming' };
  }
  if (start <= todayIso && end >= todayIso) {
    return { label: start === end ? 'Today' : 'Active Window', tone: 'ongoing' };
  }
  if (end < todayIso) {
    return { label: 'Completed', tone: 'past' };
  }
  const t0 = Date.parse(`${todayIso}T00:00:00Z`);
  const t1 = Date.parse(`${start}T00:00:00Z`);
  const diffDays = Math.round((t1 - t0) / 86_400_000);
  if (diffDays === 1) return { label: 'Tomorrow', tone: 'soon' };
  if (diffDays <= 14) return { label: `In ${diffDays} days`, tone: 'soon' };
  return { label: `In ${diffDays} days`, tone: 'upcoming' };
}

function getMonthKeyFromDate(iso: string): string {
  return iso.slice(0, 7);
}

function formatMonthHeading(monthKey: string): string {
  const [yStr, mStr] = monthKey.split('-');
  const mIdx = Number(mStr) - 1;
  return `${MONTH_NAMES[mIdx] || mStr} ${yStr}`;
}

function shiftMonth(year: number, monthIndex: number, delta: number): { year: number; month: number } {
  const dt = new Date(Date.UTC(year, monthIndex + delta, 1));
  return { year: dt.getUTCFullYear(), month: dt.getUTCMonth() };
}

function renderCategoryIcon(category: AcademicCalendarCategory, className = 'w-3.5 h-3.5') {
  if (category === 'exam') return <BookOpen className={className} />;
  if (category === 'holiday') return <Sun className={className} />;
  if (category === 'deadline') return <Clock className={className} />;
  return <Flag className={className} />;
}

interface AcademicCalendarViewProps {
  items: AcademicCalendarItem[];
}

export function AcademicCalendarView({ items }: AcademicCalendarViewProps) {
  const [todayIso, setTodayIso] = useState<string>('2026-11-24');
  const [categoryFilter, setCategoryFilter] = useState<CalendarFilterCategory>('all');
  const [timeframe, setTimeframe] = useState<'upcoming' | 'all'>('upcoming');
  const [termFilter, setTermFilter] = useState<string>('All Terms');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'month' | 'timeline'>('month');
  const [cursorMonth, setCursorMonth] = useState<{ year: number; month: number }>({
    year: 2026,
    month: 10, // November 2026
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    const localToday = getLocalTodayIso();
    setTodayIso(localToday);
    const { year, month } = parseIsoParts(localToday);
    setCursorMonth({ year, month });
  }, []);

  const normalizedItems = useMemo<NormalizedCalendarItem[]>(() => {
    return items
      .map((item, idx) => {
        const resolvedCategory = inferCalendarCategory(item);
        const effectiveEndDate =
          item.endDate && isValidIsoDate(item.endDate) && item.endDate >= item.date
            ? item.endDate
            : item.date;
        return {
          ...item,
          id: `cal-${idx}-${item.date}`,
          resolvedCategory,
          effectiveEndDate,
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [items]);

  const termOptions = useMemo(
    () => ['All Terms', ...Array.from(new Set(normalizedItems.map((i) => i.term)))],
    [normalizedItems]
  );

  // Items matching timeframe, term, and search (used to show accurate category counts)
  const scopedItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return normalizedItems.filter((item) => {
      if (timeframe === 'upcoming' && item.effectiveEndDate < todayIso) {
        return false;
      }
      if (termFilter !== 'All Terms' && item.term !== termFilter) {
        return false;
      }
      if (q) {
        const haystack = `${item.event} ${item.term} ${item.date} ${item.endDate || ''} ${item.venue || ''} ${item.details || ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [normalizedItems, timeframe, termFilter, searchQuery, todayIso]);

  const categoryCounts = useMemo(() => {
    const counts: Record<CalendarFilterCategory, number> = {
      all: scopedItems.length,
      exam: 0,
      holiday: 0,
      deadline: 0,
      academic: 0,
    };
    for (const item of scopedItems) {
      counts[item.resolvedCategory] += 1;
    }
    return counts;
  }, [scopedItems]);

  const visibleItems = useMemo(() => {
    if (categoryFilter === 'all') return scopedItems;
    return scopedItems.filter((item) => item.resolvedCategory === categoryFilter);
  }, [scopedItems, categoryFilter]);

  // Quick upcoming highlights for the top 3 KPI jump cards
  const nextHighlights = useMemo(() => {
    const upcoming = normalizedItems.filter((i) => i.effectiveEndDate >= todayIso);
    return {
      exam: upcoming.find((i) => i.resolvedCategory === 'exam') || null,
      holiday: upcoming.find((i) => i.resolvedCategory === 'holiday') || null,
      deadline: upcoming.find((i) => i.resolvedCategory === 'deadline') || null,
    };
  }, [normalizedItems, todayIso]);

  const activeMonthKey = `${cursorMonth.year}-${String(cursorMonth.month + 1).padStart(2, '0')}`;

  // Build calendar cells for current cursorMonth
  const monthCells = useMemo(() => {
    const firstDayWeekday = new Date(Date.UTC(cursorMonth.year, cursorMonth.month, 1)).getUTCDay();
    const daysInMonth = new Date(
      Date.UTC(cursorMonth.year, cursorMonth.month + 1, 0)
    ).getUTCDate();

    const cells: Array<{ iso: string | null; dayNum: number | null; weekday: number }> = [];
    for (let i = 0; i < firstDayWeekday; i += 1) {
      cells.push({ iso: null, dayNum: null, weekday: i % 7 });
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      const iso = `${cursorMonth.year}-${String(cursorMonth.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const weekday = (firstDayWeekday + day - 1) % 7;
      cells.push({ iso, dayNum: day, weekday });
    }
    while (cells.length % 7 !== 0) {
      cells.push({ iso: null, dayNum: null, weekday: cells.length % 7 });
    }
    return cells;
  }, [cursorMonth]);

  // Events covering each day in the active month
  const eventsByDay = useMemo(() => {
    const map = new Map<string, NormalizedCalendarItem[]>();
    for (const cell of monthCells) {
      if (!cell.iso) continue;
      const dayEvents = visibleItems.filter(
        (ev) => ev.date <= cell.iso! && ev.effectiveEndDate >= cell.iso!
      );
      if (dayEvents.length > 0) {
        map.set(cell.iso, dayEvents);
      }
    }
    return map;
  }, [monthCells, visibleItems]);

  // Events displayed in the Inspector beside the Month Grid
  const inspectorItems = useMemo(() => {
    if (selectedDate && selectedDate.startsWith(activeMonthKey)) {
      return visibleItems.filter(
        (ev) => ev.date <= selectedDate && ev.effectiveEndDate >= selectedDate
      );
    }
    return visibleItems.filter(
      (ev) =>
        ev.date.slice(0, 7) <= activeMonthKey && ev.effectiveEndDate.slice(0, 7) >= activeMonthKey
    );
  }, [visibleItems, selectedDate, activeMonthKey]);

  // Timeline groups by month
  const timelineGroups = useMemo(() => {
    const groups = new Map<string, NormalizedCalendarItem[]>();
    for (const item of visibleItems) {
      const mKey = getMonthKeyFromDate(item.date);
      const list = groups.get(mKey) || [];
      list.push(item);
      groups.set(mKey, list);
    }
    return Array.from(groups.entries());
  }, [visibleItems]);

  function focusEventOnCalendar(item: NormalizedCalendarItem | null) {
    if (!item || !isValidIsoDate(item.date)) return;
    setTimeframe('upcoming');
    setCategoryFilter(item.resolvedCategory);
    const targetMonth = parseIsoParts(
      item.date < todayIso && item.effectiveEndDate >= todayIso ? todayIso : item.date
    );
    setCursorMonth({ year: targetMonth.year, month: targetMonth.month });
    setSelectedDate(
      item.date < todayIso && item.effectiveEndDate >= todayIso ? todayIso : item.date
    );
    setViewMode('month');
  }

  function jumpToToday() {
    const { year, month } = parseIsoParts(todayIso);
    setCursorMonth({ year, month });
    setSelectedDate(null);
  }

  function jumpToNearestMatch() {
    const first = visibleItems[0];
    if (!first || !isValidIsoDate(first.date)) return;
    const { year, month } = parseIsoParts(first.date < todayIso ? todayIso : first.date);
    setCursorMonth({ year, month });
    setSelectedDate(null);
  }

  return (
    <div className="editable-region space-y-6">
      {/* Quick Upcoming Jump Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() =>
            nextHighlights.exam
              ? focusEventOnCalendar(nextHighlights.exam)
              : setCategoryFilter('exam')
          }
          className="text-left p-4 sm:p-5 rounded-2xl border border-slate-200 bg-[#F7F7F5] hover:border-pust-700/60 hover:bg-white transition-colors space-y-1.5 cursor-pointer group"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-pust-800 font-semibold">
              <BookOpen className="w-3.5 h-3.5" />
              Next Examination
            </span>
            {nextHighlights.exam && (
              <span className="font-mono text-[11px] text-pust-900 tabular-nums">
                {getRelativeDayLabel(
                  nextHighlights.exam.date,
                  nextHighlights.exam.effectiveEndDate,
                  todayIso
                ).label}
              </span>
            )}
          </div>
          <p className="font-serif text-base font-medium text-slate-900 group-hover:text-pust-900 line-clamp-1">
            {nextHighlights.exam ? nextHighlights.exam.event : 'No upcoming exams scheduled'}
          </p>
          <p className="font-mono text-xs text-slate-500 tabular-nums">
            {nextHighlights.exam
              ? formatDateRange(nextHighlights.exam.date, nextHighlights.exam.endDate)
              : 'Filter Exam schedule'}
          </p>
        </button>

        <button
          type="button"
          onClick={() =>
            nextHighlights.holiday
              ? focusEventOnCalendar(nextHighlights.holiday)
              : setCategoryFilter('holiday')
          }
          className="text-left p-4 sm:p-5 rounded-2xl border border-slate-200 bg-[#F7F7F5] hover:border-emerald-700/50 hover:bg-white transition-colors space-y-1.5 cursor-pointer group"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-emerald-800 font-semibold">
              <Sun className="w-3.5 h-3.5" />
              Next Holiday / Recess
            </span>
            {nextHighlights.holiday && (
              <span className="font-mono text-[11px] text-emerald-900 tabular-nums">
                {getRelativeDayLabel(
                  nextHighlights.holiday.date,
                  nextHighlights.holiday.effectiveEndDate,
                  todayIso
                ).label}
              </span>
            )}
          </div>
          <p className="font-serif text-base font-medium text-slate-900 group-hover:text-emerald-900 line-clamp-1">
            {nextHighlights.holiday ? nextHighlights.holiday.event : 'No upcoming holidays listed'}
          </p>
          <p className="font-mono text-xs text-slate-500 tabular-nums">
            {nextHighlights.holiday
              ? formatDateRange(nextHighlights.holiday.date, nextHighlights.holiday.endDate)
              : 'Filter Holiday list'}
          </p>
        </button>

        <button
          type="button"
          onClick={() =>
            nextHighlights.deadline
              ? focusEventOnCalendar(nextHighlights.deadline)
              : setCategoryFilter('deadline')
          }
          className="text-left p-4 sm:p-5 rounded-2xl border border-slate-200 bg-[#F7F7F5] hover:border-amber-700/50 hover:bg-white transition-colors space-y-1.5 cursor-pointer group"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-amber-800 font-semibold">
              <Clock className="w-3.5 h-3.5" />
              Next Semester Deadline
            </span>
            {nextHighlights.deadline && (
              <span className="font-mono text-[11px] text-amber-900 tabular-nums">
                {getRelativeDayLabel(
                  nextHighlights.deadline.date,
                  nextHighlights.deadline.effectiveEndDate,
                  todayIso
                ).label}
              </span>
            )}
          </div>
          <p className="font-serif text-base font-medium text-slate-900 group-hover:text-amber-900 line-clamp-1">
            {nextHighlights.deadline
              ? nextHighlights.deadline.event
              : 'No upcoming deadlines pending'}
          </p>
          <p className="font-mono text-xs text-slate-500 tabular-nums">
            {nextHighlights.deadline
              ? formatDateRange(nextHighlights.deadline.date, nextHighlights.deadline.endDate)
              : 'Filter Semester Deadlines'}
          </p>
        </button>
      </div>

      {/* Category Filters & Timeframe / View Switcher */}
      <div className="space-y-3 border-b border-slate-200 pb-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div
            role="group"
            aria-label="Filter calendar by event category"
            className="flex items-center gap-1.5 overflow-x-auto no-scrollbar sm:flex-wrap pb-1 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0"
          >
            {(
              [
                { id: 'all', label: 'All Events' },
                { id: 'exam', label: 'Exams' },
                { id: 'holiday', label: 'Holidays' },
                { id: 'deadline', label: 'Semester Deadlines' },
                { id: 'academic', label: 'Academic Milestones' },
              ] as Array<{ id: CalendarFilterCategory; label: string }>
            ).map((cat) => {
              const active = categoryFilter === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setCategoryFilter(cat.id);
                    setSelectedDate(null);
                  }}
                  className={`min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-pust-900 text-white'
                      : 'bg-[#F7F7F5] border border-slate-200 text-slate-700 hover:border-pust-700/50 hover:text-pust-900'
                  }`}
                >
                  {cat.id !== 'all' && renderCategoryIcon(cat.id, 'w-3.5 h-3.5 shrink-0')}
                  <span>{cat.label}</span>
                  <span
                    className={`font-mono text-[11px] tabular-nums ${
                      active ? 'text-pust-200' : 'text-slate-500'
                    }`}
                  >
                    ({categoryCounts[cat.id]})
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Upcoming vs All Dates */}
            <div className="inline-flex p-1 rounded-lg bg-[#F7F7F5] border border-slate-200">
              <button
                type="button"
                onClick={() => setTimeframe('upcoming')}
                className={`min-h-[34px] px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  timeframe === 'upcoming'
                    ? 'bg-white text-pust-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Upcoming
              </button>
              <button
                type="button"
                onClick={() => setTimeframe('all')}
                className={`min-h-[34px] px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  timeframe === 'all'
                    ? 'bg-white text-pust-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Full Session
              </button>
            </div>

            {/* Month Grid vs Timeline List */}
            <div className="inline-flex p-1 rounded-lg bg-[#F7F7F5] border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('month')}
                className={`min-h-[34px] inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  viewMode === 'month'
                    ? 'bg-white text-pust-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                Month Grid
              </button>
              <button
                type="button"
                onClick={() => setViewMode('timeline')}
                className={`min-h-[34px] inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  viewMode === 'timeline'
                    ? 'bg-white text-pust-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                Timeline
              </button>
            </div>
          </div>
        </div>

        {/* Search, Term Selector, Admin Edit & ICS Export */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search exams, holidays, deadlines..."
                aria-label="Search academic calendar events"
                className="w-full min-h-[40px] pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:border-pust-700 focus:outline-none"
              />
            </div>

            <select
              aria-label="Filter by academic term"
              value={termFilter}
              onChange={(e) => setTermFilter(e.target.value)}
              className="min-h-[40px] px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] text-slate-800 focus:bg-white focus:border-pust-700 focus:outline-none cursor-pointer"
            >
              {termOptions.map((term) => (
                <option key={term} value={term}>
                  {term}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <EditTriggerButton
              target={{ kind: 'academic-calendar' }}
              label="Edit Calendar"
              variant="compact"
            />
            <button
              type="button"
              disabled={visibleItems.length === 0}
              onClick={() =>
                downloadIcsCalendar(
                  visibleItems.map((row) => ({
                    uid: row.id,
                    title: row.event,
                    date: row.date,
                    endDate: row.effectiveEndDate,
                    location: row.venue,
                    description: `${CATEGORY_META[row.resolvedCategory].label} · ${row.term}${
                      row.details ? ` — ${row.details}` : ''
                    }`,
                  })),
                  'PUST-Academic-Calendar.ics'
                )
              }
              className="min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-pust-900 text-white hover:bg-pust-950 disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <CalendarPlus className="w-3.5 h-3.5" />
              Export Filtered (.ics)
            </button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {visibleItems.length === 0 ? (
        <div className="p-8 sm:p-10 rounded-2xl border border-slate-200 bg-[#F7F7F5] text-center space-y-3">
          <p className="text-sm text-slate-700">
            No academic calendar events match your current filters.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                setCategoryFilter('all');
                setTermFilter('All Terms');
                setSearchQuery('');
                setTimeframe('all');
                setSelectedDate(null);
              }}
              className="min-h-[40px] px-4 py-2 text-xs font-medium rounded-lg bg-pust-900 text-white cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        </div>
      ) : viewMode === 'month' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Interactive Monthly Grid */}
          <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <div className="px-4 sm:px-5 py-3.5 bg-[#F7F7F5] border-b border-slate-200 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <h2 className="font-serif text-lg sm:text-xl font-medium text-slate-900 truncate">
                  {MONTH_NAMES[cursorMonth.month]} {cursorMonth.year}
                </h2>
                <button
                  type="button"
                  onClick={jumpToToday}
                  className="px-2.5 py-1 text-[11px] font-mono font-medium rounded-md border border-slate-300 bg-white text-slate-700 hover:border-pust-800 hover:text-pust-900 whitespace-nowrap cursor-pointer"
                >
                  Today
                </button>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  aria-label="Previous month"
                  onClick={() => {
                    setCursorMonth((prev) => shiftMonth(prev.year, prev.month, -1));
                    setSelectedDate(null);
                  }}
                  className="w-9 h-9 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:border-pust-800 hover:text-pust-900 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  aria-label="Next month"
                  onClick={() => {
                    setCursorMonth((prev) => shiftMonth(prev.year, prev.month, 1));
                    setSelectedDate(null);
                  }}
                  className="w-9 h-9 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:border-pust-800 hover:text-pust-900 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Weekday Header */}
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/70">
              {WEEKDAYS.map((day, idx) => {
                const isWeekend = idx === 5 || idx === 6;
                return (
                  <div
                    key={day}
                    className={`py-2 text-center font-mono text-[11px] uppercase tracking-wider ${
                      isWeekend ? 'text-slate-400' : 'text-slate-600 font-semibold'
                    }`}
                  >
                    {day}
                  </div>
                );
              })}
            </div>

            {/* Day Cells */}
            <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
              {monthCells.map((cell, idx) => {
                if (!cell.iso || cell.dayNum === null) {
                  return (
                    <div
                      key={`empty-${idx}`}
                      className="min-h-[54px] sm:min-h-[76px] bg-slate-50/40"
                    />
                  );
                }
                const iso = cell.iso;
                const dayEvents = eventsByDay.get(iso) || [];
                const isToday = iso === todayIso;
                const isSelected = iso === selectedDate;
                const isWeekend = cell.weekday === 5 || cell.weekday === 6;

                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => setSelectedDate(isSelected ? null : iso)}
                    aria-label={`${formatReadableDate(iso)}, ${dayEvents.length} events`}
                    aria-pressed={isSelected}
                    className={`min-h-[54px] sm:min-h-[76px] p-1 sm:p-1.5 text-left flex flex-col justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-pust-50 ring-2 ring-inset ring-pust-800'
                        : isWeekend
                        ? 'bg-slate-50/60 hover:bg-slate-100/70'
                        : 'bg-white hover:bg-[#FAF8F4]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 w-full">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-md font-mono text-xs tabular-nums ${
                          isToday
                            ? 'bg-pust-900 text-white font-semibold'
                            : isSelected
                            ? 'text-pust-900 font-bold'
                            : isWeekend
                            ? 'text-slate-500'
                            : 'text-slate-800 font-medium'
                        }`}
                      >
                        {cell.dayNum}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="sm:hidden font-mono text-[10px] text-slate-500 tabular-nums">
                          {dayEvents.length}
                        </span>
                      )}
                    </div>

                    {dayEvents.length > 0 && (
                      <div className="w-full space-y-0.5 mt-1">
                        {/* Mobile compact category strips */}
                        <div className="flex sm:hidden gap-0.5">
                          {dayEvents.slice(0, 3).map((ev) => (
                            <span
                              key={ev.id}
                              className={`h-1 flex-1 rounded-full ${CATEGORY_META[ev.resolvedCategory].dotClass}`}
                            />
                          ))}
                        </div>
                        {/* Desktop compact labeled bars */}
                        <div className="hidden sm:flex flex-col gap-0.5">
                          {dayEvents.slice(0, 2).map((ev) => {
                            const meta = CATEGORY_META[ev.resolvedCategory];
                            return (
                              <span
                                key={ev.id}
                                className={`block w-full truncate rounded px-1 py-0.5 text-[10px] font-medium leading-tight ${meta.bgSoftClass} ${meta.textClass}`}
                              >
                                {ev.event}
                              </span>
                            );
                          })}
                          {dayEvents.length > 2 && (
                            <span className="block font-mono text-[10px] text-slate-500 px-1">
                              +{dayEvents.length - 2} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Category Legend */}
            <div className="px-4 sm:px-5 py-3 border-t border-slate-200 bg-[#FAF8F4] flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                {(['exam', 'holiday', 'deadline', 'academic'] as AcademicCalendarCategory[]).map(
                  (cat) => (
                    <span key={cat} className="inline-flex items-center gap-1.5">
                      <span
                        aria-hidden="true"
                        className={`w-2.5 h-2.5 rounded-xs ${CATEGORY_META[cat].dotClass}`}
                      />
                      {CATEGORY_META[cat].shortLabel}
                    </span>
                  )
                )}
              </div>
              <span className="font-mono text-[10px] text-slate-500">
                Sun–Thu Classes · Fri–Sat Weekly Off
              </span>
            </div>
          </div>

          {/* Right Column: Selected Day / Monthly Schedule Inspector */}
          <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <div className="px-5 py-3.5 bg-[#F7F7F5] border-b border-slate-200 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="font-mono text-[11px] uppercase tracking-wider text-pust-800 font-semibold">
                  {selectedDate ? 'Selected Date Schedule' : 'Monthly Schedule'}
                </p>
                <h3 className="font-serif text-lg font-medium text-slate-900 truncate">
                  {selectedDate
                    ? formatReadableDate(selectedDate)
                    : `${MONTH_NAMES[cursorMonth.month]} ${cursorMonth.year}`}
                </h3>
              </div>
              {selectedDate ? (
                <button
                  type="button"
                  onClick={() => setSelectedDate(null)}
                  className="px-2.5 py-1 text-xs font-medium rounded-md border border-slate-300 bg-white text-slate-700 hover:border-pust-800 hover:text-pust-900 whitespace-nowrap cursor-pointer"
                >
                  All Month
                </button>
              ) : (
                <span className="font-mono text-xs text-slate-500 tabular-nums shrink-0">
                  {inspectorItems.length} event{inspectorItems.length === 1 ? '' : 's'}
                </span>
              )}
            </div>

            {inspectorItems.length === 0 ? (
              <div className="p-6 text-center space-y-3">
                <p className="text-xs text-slate-600 leading-relaxed">
                  {selectedDate
                    ? `No filtered academic events fall on ${formatReadableDate(selectedDate)}.`
                    : `No filtered events in ${MONTH_NAMES[cursorMonth.month]} ${cursorMonth.year}.`}
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {selectedDate && (
                    <button
                      type="button"
                      onClick={() => setSelectedDate(null)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 text-slate-800 hover:border-pust-800 cursor-pointer"
                    >
                      Show All {MONTH_NAMES[cursorMonth.month]} Events
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={jumpToNearestMatch}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-pust-900 text-white hover:bg-pust-950 cursor-pointer"
                  >
                    Jump to Next Matching Event
                  </button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-200 max-h-[580px] overflow-y-auto">
                {inspectorItems.map((row) => {
                  const meta = CATEGORY_META[row.resolvedCategory];
                  const rel = getRelativeDayLabel(row.date, row.effectiveEndDate, todayIso);
                  return (
                    <article key={row.id} className="p-4 sm:p-5 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span
                          className={`inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider font-semibold ${meta.textClass}`}
                        >
                          {renderCategoryIcon(row.resolvedCategory, 'w-3.5 h-3.5')}
                          {meta.label}
                        </span>
                        <span
                          className={`font-mono text-[11px] tabular-nums ${
                            rel.tone === 'ongoing'
                              ? 'text-emerald-800 font-semibold'
                              : rel.tone === 'soon'
                              ? 'text-pust-900 font-semibold'
                              : 'text-slate-500'
                          }`}
                        >
                          {rel.label}
                        </span>
                      </div>

                      <h4 className="font-serif text-base font-medium text-slate-900">
                        {row.event}
                      </h4>

                      <p className="font-mono text-xs text-slate-600 tabular-nums">
                        {formatDateRange(row.date, row.endDate)} · {row.term}
                      </p>

                      {row.venue && (
                        <p className="text-xs text-slate-600 inline-flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{row.venue}</span>
                        </p>
                      )}

                      {row.details && (
                        <p className="text-xs text-slate-600 leading-relaxed">{row.details}</p>
                      )}

                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() =>
                            downloadIcsCalendar(
                              [
                                {
                                  uid: row.id,
                                  title: row.event,
                                  date: row.date,
                                  endDate: row.effectiveEndDate,
                                  location: row.venue,
                                  description: `${meta.label} · ${row.term}${
                                    row.details ? ` — ${row.details}` : ''
                                  }`,
                                },
                              ],
                              `PUST-${row.date}.ics`
                            )
                          }
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-[#F7F7F5] text-slate-700 hover:border-pust-800 hover:text-pust-900 cursor-pointer"
                        >
                          <CalendarPlus className="w-3.5 h-3.5" />
                          Add to Calendar (.ics)
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Timeline View Grouped Chronologically by Month */
        <div className="space-y-6">
          {timelineGroups.map(([monthKey, groupItems]) => (
            <section key={monthKey} className="space-y-3">
              <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2">
                <h2 className="font-serif text-xl font-medium text-slate-900">
                  {formatMonthHeading(monthKey)}
                </h2>
                <span className="font-mono text-xs text-slate-500 tabular-nums">
                  {groupItems.length} item{groupItems.length === 1 ? '' : 's'}
                </span>
              </div>

              <div className="rounded-2xl divide-y divide-slate-200 border border-slate-200 bg-white overflow-hidden shadow-xs">
                {groupItems.map((row) => {
                  const meta = CATEGORY_META[row.resolvedCategory];
                  const rel = getRelativeDayLabel(row.date, row.effectiveEndDate, todayIso);
                  return (
                    <div
                      key={row.id}
                      className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start"
                    >
                      <div className="lg:col-span-3 space-y-1">
                        <p className="font-mono text-xs font-semibold text-pust-800 tabular-nums">
                          {formatDateRange(row.date, row.endDate)}
                        </p>
                        <p
                          className={`font-mono text-[11px] tabular-nums ${
                            rel.tone === 'ongoing'
                              ? 'text-emerald-800 font-semibold'
                              : rel.tone === 'soon'
                              ? 'text-amber-800 font-semibold'
                              : 'text-slate-500'
                          }`}
                        >
                          {rel.label}
                        </p>
                      </div>

                      <div className="lg:col-span-7 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span
                            className={`inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider font-semibold ${meta.textClass}`}
                          >
                            {renderCategoryIcon(row.resolvedCategory, 'w-3.5 h-3.5')}
                            {meta.label}
                          </span>
                          <span aria-hidden="true" className="text-slate-300">
                            ·
                          </span>
                          <span className="text-slate-600">{row.term}</span>
                        </div>
                        <h3 className="font-serif text-lg font-medium text-slate-900">{row.event}</h3>
                        {row.venue && (
                          <p className="text-xs text-slate-600 inline-flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{row.venue}</span>
                          </p>
                        )}
                        {row.details && (
                          <p className="text-xs text-slate-600 leading-relaxed">{row.details}</p>
                        )}
                      </div>

                      <div className="lg:col-span-2 flex lg:justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            downloadIcsCalendar(
                              [
                                {
                                  uid: row.id,
                                  title: row.event,
                                  date: row.date,
                                  endDate: row.effectiveEndDate,
                                  location: row.venue,
                                  description: `${meta.label} · ${row.term}${
                                    row.details ? ` — ${row.details}` : ''
                                  }`,
                                },
                              ],
                              `PUST-${row.date}.ics`
                            )
                          }
                          className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-[#F7F7F5] text-slate-700 hover:border-pust-800 hover:text-pust-900 whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <CalendarPlus className="w-3.5 h-3.5" />
                          Add (.ics)
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

export function AcademicCalendarHighlights({ items }: { items: AcademicCalendarItem[] }) {
  const [todayIso, setTodayIso] = useState<string>('2026-11-24');
  const [filter, setFilter] = useState<'all' | 'exam' | 'holiday' | 'deadline'>('all');

  useEffect(() => {
    setTodayIso(getLocalTodayIso());
  }, []);

  const upcoming = useMemo(() => {
    return items
      .map((item, idx) => ({
        ...item,
        id: `preview-${idx}-${item.date}`,
        resolvedCategory: inferCalendarCategory(item),
        effectiveEndDate:
          item.endDate && isValidIsoDate(item.endDate) && item.endDate >= item.date
            ? item.endDate
            : item.date,
      }))
      .filter((item) => item.effectiveEndDate >= todayIso)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [items, todayIso]);

  const filtered = useMemo(() => {
    if (filter === 'all') return upcoming.slice(0, 4);
    return upcoming.filter((i) => i.resolvedCategory === filter).slice(0, 4);
  }, [upcoming, filter]);

  if (upcoming.length === 0) return null;

  return (
    <div className="pt-8 border-t border-slate-200 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-pust-800">
            Academic Calendar 2026–2027
          </p>
          <h2 className="font-serif text-2xl font-medium text-slate-900 mt-1">
            Upcoming Exams, Holidays &amp; Semester Deadlines
          </h2>
        </div>

        <Link
          href="/academics/calendar"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-pust-900 text-white hover:bg-pust-950 whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          <Calendar className="w-3.5 h-3.5" />
          Open Interactive Calendar
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar sm:flex-wrap pb-1 sm:pb-0">
        {(
          [
            { id: 'all', label: 'All Upcoming' },
            { id: 'exam', label: 'Exams' },
            { id: 'holiday', label: 'Holidays' },
            { id: 'deadline', label: 'Semester Deadlines' },
          ] as Array<{ id: 'all' | 'exam' | 'holiday' | 'deadline'; label: string }>
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`min-h-[38px] px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              filter === tab.id
                ? 'bg-pust-900 text-white'
                : 'bg-[#F7F7F5] border border-slate-200 text-slate-700 hover:border-pust-700/50 hover:text-pust-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((item) => {
          const meta = CATEGORY_META[item.resolvedCategory];
          const rel = getRelativeDayLabel(item.date, item.effectiveEndDate, todayIso);
          return (
            <div
              key={item.id}
              className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-[#F7F7F5] flex flex-col justify-between gap-2.5"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span
                    className={`inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider font-semibold ${meta.textClass}`}
                  >
                    {renderCategoryIcon(item.resolvedCategory, 'w-3.5 h-3.5')}
                    {meta.label}
                  </span>
                  <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                    {rel.label}
                  </span>
                </div>
                <h3 className="font-serif text-base font-medium text-slate-900">{item.event}</h3>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/80 text-xs">
                <span className="font-mono text-pust-800 tabular-nums">
                  {formatDateRange(item.date, item.endDate)}
                </span>
                <span className="text-slate-500 truncate">{item.term}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
