'use client';

import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { GpaChartPoint } from '../../lib/studentDashboard';

interface StudentGpaChartProps {
  data: GpaChartPoint[];
  cumulativeCgpa?: number;
  selectedSemester?: 'all' | number;
  onSelectSemester?: (semester: 'all' | number) => void;
  isPreview?: boolean;
}

interface ChartTooltipPayload {
  payload?: GpaChartPoint;
}

function GpaTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: ChartTooltipPayload[];
}) {
  const point = active && payload && payload.length > 0 ? payload[0]?.payload : undefined;
  if (!point) return null;

  return (
    <div className="rounded-xl border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 shadow-sm text-xs space-y-1.5 min-w-[180px]">
      <div className="flex items-center justify-between gap-3 border-b border-stone-200 dark:border-slate-800 pb-1">
        <span className="font-semibold text-slate-950 dark:text-slate-100">
          Semester {point.semester}
        </span>
        <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
          {point.session}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 tabular-nums">
        <span className="text-slate-600 dark:text-slate-300">Term SGPA</span>
        <span className="font-mono font-bold text-pust-800 dark:text-gold-300 text-right">
          {point.sgpa.toFixed(2)}
        </span>
        <span className="text-slate-600 dark:text-slate-300">Running CGPA</span>
        <span className="font-mono font-semibold text-slate-900 dark:text-slate-100 text-right">
          {point.runningCgpa.toFixed(2)}
        </span>
        <span className="text-slate-600 dark:text-slate-300">Credits</span>
        <span className="font-mono text-slate-800 dark:text-slate-200 text-right">
          {point.credits.toFixed(1)} ({point.coursesCount} cr.)
        </span>
      </div>
      <p className="font-mono text-[10px] text-slate-500 dark:text-slate-400 pt-0.5 border-t border-stone-200/70 dark:border-slate-800">
        {point.isSample
          ? 'Representative PUST progression sample'
          : `${point.promotionStatus} · ${point.publishedAt}`}
      </p>
    </div>
  );
}

export function StudentGpaChart({
  data,
  cumulativeCgpa,
  selectedSemester = 'all',
  onSelectSemester,
  isPreview = false,
}: StudentGpaChartProps) {
  const [chartMounted, setChartMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setChartMounted(true);
    const root = document.documentElement;
    const syncTheme = () => setIsDark(root.classList.contains('dark'));
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  if (data.length === 0) {
    return null;
  }

  const latestSemester = data[data.length - 1]?.semester;
  const effectiveReferenceCgpa =
    cumulativeCgpa && cumulativeCgpa > 0
      ? cumulativeCgpa
      : data[data.length - 1]?.runningCgpa;

  return (
    <div className="rounded-xl border border-stone-200 dark:border-slate-800 bg-[#FAF9F6] dark:bg-slate-800/70 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-0.5">
          <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
            {isPreview
              ? 'Historical GPA Trajectory (Sample Departmental Preview)'
              : 'Historical Semester GPA Progression'}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            {isPreview
              ? 'Illustrative 4-semester SGPA curve on the 4.00 scale · Sign in to plot your official transcript'
              : onSelectSemester
                ? 'Term-by-term SGPA from published results · Click any bar to filter semester courses'
                : 'Term-by-term SGPA from published results'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-slate-600 dark:text-slate-300 tabular-nums shrink-0">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-pust-700 dark:bg-[#B4232A] inline-block" />
            <span>Term SGPA</span>
          </span>
          {effectiveReferenceCgpa && effectiveReferenceCgpa > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3.5 border-t-2 border-dashed border-[#B48318] dark:border-gold-400 inline-block" />
              <span>CGPA {effectiveReferenceCgpa.toFixed(2)}</span>
            </span>
          )}
        </div>
      </div>

      <div className="h-56 sm:h-64 w-full min-w-0">
        {chartMounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 12, right: 12, left: -8, bottom: 4 }}
              barCategoryGap="24%"
            >
              <CartesianGrid
                vertical={false}
                stroke={isDark ? 'rgba(148, 163, 184, 0.2)' : '#E7E5E4'}
                strokeDasharray="3 3"
              />
              <XAxis
                dataKey="label"
                axisLine={{ stroke: isDark ? '#475569' : '#D6D3D1' }}
                tickLine={false}
                tick={{ fill: isDark ? '#CBD5E1' : '#475569', fontSize: 11, fontFamily: 'monospace' }}
                dy={6}
              />
              <YAxis
                domain={[0, 4]}
                ticks={[0, 1, 2, 3, 4]}
                axisLine={false}
                tickLine={false}
                width={38}
                tickFormatter={(value) => Number(value).toFixed(1)}
                tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontFamily: 'monospace' }}
              />
              <Tooltip
                cursor={{ fill: isDark ? 'rgba(217, 167, 38, 0.08)' : 'rgba(114, 14, 19, 0.06)' }}
                content={<GpaTooltip />}
              />
              {effectiveReferenceCgpa && effectiveReferenceCgpa > 0 && (
                <ReferenceLine
                  y={effectiveReferenceCgpa}
                  stroke={isDark ? '#EAB308' : '#B48318'}
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                />
              )}
              <Bar
                dataKey="sgpa"
                name="Term SGPA"
                radius={[4, 4, 0, 0]}
                maxBarSize={48}
                onClick={
                  onSelectSemester
                    ? (barData) => {
                        const sem = Number(
                          (barData as unknown as { semester?: number; payload?: GpaChartPoint })
                            ?.semester ??
                            (barData as unknown as { payload?: GpaChartPoint })?.payload?.semester
                        );
                        if (!Number.isFinite(sem) || sem <= 0) return;
                        onSelectSemester(selectedSemester === sem ? 'all' : sem);
                      }
                    : undefined
                }
              >
                {data.map((entry) => {
                  const isSelected = selectedSemester === entry.semester;
                  const isDimmed =
                    selectedSemester !== 'all' && selectedSemester !== entry.semester;
                  const isLatest = entry.semester === latestSemester;

                  let fill = isDark
                    ? isPreview
                      ? '#B4232A'
                      : '#9E1B22'
                    : isPreview
                    ? '#851217'
                    : '#720E13';
                  if (isSelected || (selectedSemester === 'all' && isLatest && !isPreview)) {
                    fill = isDark ? '#D9A726' : '#5B0A0E';
                  } else if (isDimmed) {
                    fill = isDark ? '#475569' : '#D6B6B8';
                  }

                  return (
                    <Cell
                      key={`gpa-bar-${entry.semester}`}
                      fill={fill}
                      cursor={onSelectSemester ? 'pointer' : 'default'}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div
            aria-hidden="true"
            className="h-full w-full rounded-lg border border-stone-200/80 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 animate-pulse"
          />
        )}
      </div>
    </div>
  );
}
