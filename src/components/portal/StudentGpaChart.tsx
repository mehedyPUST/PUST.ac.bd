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
    <div className="rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 shadow-sm text-xs space-y-1.5 min-w-[180px]">
      <div className="flex items-center justify-between gap-3 border-b border-stone-200 pb-1">
        <span className="font-semibold text-slate-950">Semester {point.semester}</span>
        <span className="font-mono text-[11px] text-slate-500 tabular-nums">
          {point.session}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 tabular-nums">
        <span className="text-slate-600">Term SGPA</span>
        <span className="font-mono font-bold text-pust-900 text-right">
          {point.sgpa.toFixed(2)}
        </span>
        <span className="text-slate-600">Running CGPA</span>
        <span className="font-mono font-semibold text-slate-900 text-right">
          {point.runningCgpa.toFixed(2)}
        </span>
        <span className="text-slate-600">Credits</span>
        <span className="font-mono text-slate-800 text-right">
          {point.credits.toFixed(1)} ({point.coursesCount} cr.)
        </span>
      </div>
      <p className="font-mono text-[10px] text-slate-500 pt-0.5 border-t border-stone-100">
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

  useEffect(() => {
    setChartMounted(true);
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
    <div className="rounded-xl border border-stone-200 bg-[#FAF9F6] p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-0.5">
          <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
            {isPreview
              ? 'Historical GPA Trajectory (Sample Departmental Preview)'
              : 'Historical Semester GPA Progression'}
          </p>
          <p className="text-xs text-slate-600">
            {isPreview
              ? 'Illustrative 4-semester SGPA curve on the 4.00 scale · Sign in to plot your official transcript'
              : onSelectSemester
                ? 'Term-by-term SGPA from published results · Click any bar to filter semester courses'
                : 'Term-by-term SGPA from published results'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-slate-600 tabular-nums shrink-0">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#6D0D11] inline-block" />
            <span>Term SGPA</span>
          </span>
          {effectiveReferenceCgpa && effectiveReferenceCgpa > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3.5 border-t-2 border-dashed border-[#B48318] inline-block" />
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
                stroke="#E7E5E4"
                strokeDasharray="3 3"
              />
              <XAxis
                dataKey="label"
                axisLine={{ stroke: '#D6D3D1' }}
                tickLine={false}
                tick={{ fill: '#475569', fontSize: 11, fontFamily: 'monospace' }}
                dy={6}
              />
              <YAxis
                domain={[0, 4]}
                ticks={[0, 1, 2, 3, 4]}
                axisLine={false}
                tickLine={false}
                width={38}
                tickFormatter={(value) => Number(value).toFixed(1)}
                tick={{ fill: '#64748B', fontSize: 11, fontFamily: 'monospace' }}
              />
              <Tooltip
                cursor={{ fill: 'rgba(109, 13, 17, 0.06)' }}
                content={<GpaTooltip />}
              />
              {effectiveReferenceCgpa && effectiveReferenceCgpa > 0 && (
                <ReferenceLine
                  y={effectiveReferenceCgpa}
                  stroke="#B48318"
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

                  let fill = isPreview ? '#851217' : '#6D0D11';
                  if (isSelected || (selectedSemester === 'all' && isLatest && !isPreview)) {
                    fill = '#3E0406';
                  } else if (isDimmed) {
                    fill = '#D6B6B8';
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
            className="h-full w-full rounded-lg border border-stone-200/80 bg-white/60 animate-pulse"
          />
        )}
      </div>
    </div>
  );
}
