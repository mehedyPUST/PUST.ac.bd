'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Compass, Info } from 'lucide-react';
import type { DepartmentRecord } from '../types/pust';

type GstUnitKey = 'A' | 'B' | 'C';

interface GstEligibilityCheckerProps {
  departments: DepartmentRecord[];
  onSelectDepartment?: (dept: DepartmentRecord) => void;
  onPrefillInquiry: (deptCode: string, message: string) => void;
}

const UNIT_A_CODES = new Set([
  'CSE',
  'EEE',
  'EECE',
  'ICE',
  'CE',
  'ARCH',
  'URP',
  'MATH',
  'PHY',
  'PHARM',
  'CHEM',
  'STAT',
  'GE',
]);

const UNIT_B_CODES = new Set(['ECON', 'BNG', 'SW', 'ENG', 'PA', 'HIST']);
const UNIT_C_CODES = new Set(['BBA', 'THM']);

export function GstEligibilityChecker({
  departments,
  onPrefillInquiry,
}: GstEligibilityCheckerProps) {
  const [unit, setUnit] = useState<GstUnitKey>('A');
  const [sscGpa, setSscGpa] = useState<string>('4.80');
  const [hscGpa, setHscGpa] = useState<string>('4.75');
  const [englishTwentyPct, setEnglishTwentyPct] = useState<boolean>(true);
  const [hscMathOrEcon, setHscMathOrEcon] = useState<boolean>(true);
  const [archDrawingAptitude, setArchDrawingAptitude] = useState<boolean>(false);

  const evaluation = useMemo(() => {
    const ssc = Math.max(0, Math.min(5, Number(sscGpa) || 0));
    const hsc = Math.max(0, Math.min(5, Number(hscGpa) || 0));
    const combined = ssc + hsc;

    // GST baseline guidelines: Unit A typically requires combined GPA >= 8.00 (min 3.50 each),
    // Unit B >= 6.00 (min 3.00 each), Unit C >= 6.50 (min 3.00 each)
    const minEach = unit === 'A' ? 3.5 : 3.0;
    const minCombined = unit === 'A' ? 8.0 : unit === 'C' ? 6.5 : 6.0;
    const meetsBaselineGpa = ssc >= minEach && hsc >= minEach && combined >= minCombined;

    const unitSet =
      unit === 'A' ? UNIT_A_CODES : unit === 'B' ? UNIT_B_CODES : UNIT_C_CODES;

    const matchedDepts = departments
      .filter((d) => unitSet.has(d.code))
      .map((dept) => {
        let note = 'Meets unit baseline';
        let eligible = meetsBaselineGpa;

        if (dept.code === 'ARCH' && unit === 'A') {
          if (!archDrawingAptitude) {
            eligible = false;
            note = 'Requires Architecture Drawing Aptitude Pass';
          } else {
            note = 'Eligible (includes Architecture Drawing)';
          }
        } else if ((dept.code === 'ENG' || dept.code === 'PA') && unit === 'B') {
          if (!englishTwentyPct) {
            eligible = false;
            note = 'Requires ≥ 20% English score in GST Unit B';
          } else {
            note = 'Eligible (≥ 20% English satisfied)';
          }
        } else if (dept.code === 'ECON' && unit === 'B') {
          if (!hscMathOrEcon) {
            eligible = false;
            note = 'Requires Mathematics / Economics / Statistics in HSC';
          } else {
            note = 'Eligible (HSC Math/Economics satisfied)';
          }
        }

        return { dept, eligible, note };
      });

    const eligibleCount = matchedDepts.filter((m) => m.eligible).length;

    return {
      ssc,
      hsc,
      combined,
      minEach,
      minCombined,
      meetsBaselineGpa,
      matchedDepts,
      eligibleCount,
    };
  }, [unit, sscGpa, hscGpa, englishTwentyPct, hscMathOrEcon, archDrawingAptitude, departments]);

  return (
    <div
      id="gst-eligibility-checker"
      className="rounded-2xl border border-stone-200 bg-white overflow-hidden scroll-mt-28"
    >
      <div className="px-6 py-4 border-b border-stone-200 bg-[#FAF9F6] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Compass className="w-5 h-5 text-pust-800 shrink-0" />
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-pust-800">
              Interactive GST Admission Matcher
            </p>
            <h2 className="font-serif text-xl font-medium text-slate-900">
              Check Department Eligibility by GST Unit &amp; GPA
            </h2>
          </div>
        </div>

        <div
          className="flex overflow-x-auto no-scrollbar sm:flex-wrap gap-1.5 w-full sm:w-auto pb-1 sm:pb-0"
          role="group"
          aria-label="Select GST Unit"
        >
          {(
            [
              { key: 'A', label: 'Unit A (Science & Engg.)' },
              { key: 'B', label: 'Unit B (Humanities)' },
              { key: 'C', label: 'Unit C (Business)' },
            ] as const
          ).map((u) => (
            <button
              key={u.key}
              type="button"
              onClick={() => setUnit(u.key)}
              className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                unit === u.key
                  ? 'bg-pust-700 text-white'
                  : 'bg-white border border-stone-200 text-slate-700 hover:border-pust-700/50'
              }`}
            >
              {u.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-600 mb-1">
                SSC GPA (out of 5.00)
              </label>
              <input
                type="number"
                min="1"
                max="5"
                step="0.01"
                value={sscGpa}
                onChange={(e) => setSscGpa(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums rounded-lg border border-stone-300 bg-[#FAF9F6] focus:bg-white focus:border-pust-700 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-600 mb-1">
                HSC GPA (out of 5.00)
              </label>
              <input
                type="number"
                min="1"
                max="5"
                step="0.01"
                value={hscGpa}
                onChange={(e) => setHscGpa(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums rounded-lg border border-stone-300 bg-[#FAF9F6] focus:bg-white focus:border-pust-700 focus:outline-none"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-stone-200 bg-[#FAF9F6] space-y-2 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-slate-600">Combined SSC + HSC GPA</span>
              <span className="font-mono font-semibold text-slate-900 tabular-nums">
                {evaluation.combined.toFixed(2)} / 10.00
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-slate-600">Unit {unit} Baseline</span>
              <span
                className={`font-mono font-semibold tabular-nums sm:text-right ${
                  evaluation.meetsBaselineGpa ? 'text-emerald-700' : 'text-red-700'
                }`}
              >
                {evaluation.meetsBaselineGpa
                  ? `Met (≥ ${evaluation.minCombined.toFixed(2)})`
                  : `Need ≥ ${evaluation.minCombined.toFixed(2)} & ${evaluation.minEach.toFixed(2)} each`}
              </span>
            </div>
          </div>

          {unit === 'A' && (
            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-stone-200 bg-white text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={archDrawingAptitude}
                onChange={(e) => setArchDrawingAptitude(e.target.checked)}
                className="mt-0.5 accent-pust-700"
              />
              <span>
                Include <strong className="text-slate-900">Architecture (ARCH)</strong> Drawing
                Aptitude Exam qualification
              </span>
            </label>
          )}

          {unit === 'B' && (
            <div className="space-y-2">
              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-stone-200 bg-white text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={englishTwentyPct}
                  onChange={(e) => setEnglishTwentyPct(e.target.checked)}
                  className="mt-0.5 accent-pust-700"
                />
                <span>
                  Scored <strong className="text-slate-900">≥ 20% in English</strong> on GST Unit B
                  (Required for ENG &amp; PA)
                </span>
              </label>
              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-stone-200 bg-white text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hscMathOrEcon}
                  onChange={(e) => setHscMathOrEcon(e.target.checked)}
                  className="mt-0.5 accent-pust-700"
                />
                <span>
                  Studied <strong className="text-slate-900">Math / Economics / Statistics</strong>{' '}
                  in HSC (Required for ECON)
                </span>
              </label>
            </div>
          )}

          <p className="text-[11px] text-slate-500 flex items-start gap-1.5 leading-relaxed">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-pust-800" />
            Click any matching department card to inspect intake seats and labs, or prefill an
            admission inquiry.
          </p>
        </div>

        <div className="lg:col-span-8 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span className="font-mono uppercase tracking-wider text-pust-800">
              Unit {unit} Eligible Departments: {evaluation.eligibleCount} /{' '}
              {evaluation.matchedDepts.length}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-stretch">
            {(() => {
              let eligibleIdx = 0;
              let ineligibleIdx = 0;
              return evaluation.matchedDepts.map(({ dept, eligible, note }) => {
                const statusOcc = eligible ? eligibleIdx++ : ineligibleIdx++;
                const cardSurface = eligible
                  ? statusOcc % 2 === 0
                    ? 'bg-white border-stone-200 hover:border-pust-700/45'
                    : 'bg-[#FAF9F6] border-stone-200 hover:border-pust-700/45'
                  : 'border-stone-200 bg-[#FAF9F6] opacity-70';

                return (
                  <div
                    key={dept.id}
                    className={`h-full p-4 rounded-xl border transition-colors flex flex-col justify-between gap-3 ${cardSurface}`}
                  >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-pust-800 tabular-nums">
                      {dept.code} · {dept.intakeSeats} Seats
                    </span>
                    {eligible && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    )}
                  </div>
                  <h3 className="font-serif text-base font-medium text-slate-900 mt-1 text-left">
                    {dept.name}
                  </h3>
                  <p className="text-[11px] text-slate-600 mt-1 text-left">{note}</p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-200/80 text-xs">
                  <Link
                    href={`/academics/departments/${encodeURIComponent(dept.code.toLowerCase())}`}
                    prefetch={true}
                    className="font-medium text-slate-800 hover:text-pust-900 hover:underline cursor-pointer"
                  >
                    View Prospectus
                  </Link>
                  <button
                    type="button"
                    onClick={() =>
                      onPrefillInquiry(
                        dept.code,
                        `Hello Admissions Desk, I am checking GST Unit ${unit} eligibility for Department of ${dept.name} (${dept.code}) with SSC GPA ${evaluation.ssc.toFixed(2)} and HSC GPA ${evaluation.hsc.toFixed(2)}.`
                      )
                    }
                    className="inline-flex items-center gap-1 font-semibold text-pust-900 hover:underline cursor-pointer"
                  >
                    Ask Desk
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
