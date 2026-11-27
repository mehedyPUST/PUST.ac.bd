'use client';

import { useMemo, useState } from 'react';
import { Calculator, Plus, RotateCcw, Trash2 } from 'lucide-react';

interface CourseEntry {
  id: string;
  code: string;
  credits: string;
  mode: 'grade' | 'marks';
  gradePoint: string;
  marks: string;
}

const PUST_GRADES: Array<{ letter: string; gp: string; minMarks: number }> = [
  { letter: 'A+', gp: '4.00', minMarks: 80 },
  { letter: 'A', gp: '3.75', minMarks: 75 },
  { letter: 'A-', gp: '3.50', minMarks: 70 },
  { letter: 'B+', gp: '3.25', minMarks: 65 },
  { letter: 'B', gp: '3.00', minMarks: 60 },
  { letter: 'B-', gp: '2.75', minMarks: 55 },
  { letter: 'C+', gp: '2.50', minMarks: 50 },
  { letter: 'C', gp: '2.25', minMarks: 45 },
  { letter: 'D', gp: '2.00', minMarks: 40 },
  { letter: 'F', gp: '0.00', minMarks: 0 },
];

function marksToGrade(rawMarks: string): { letter: string; gp: number } {
  const num = Number(rawMarks);
  if (!Number.isFinite(num) || rawMarks.trim() === '') return { letter: '—', gp: 0 };
  const clamped = Math.max(0, Math.min(100, num));
  for (const g of PUST_GRADES) {
    if (clamped >= g.minMarks) {
      return { letter: g.letter, gp: Number(g.gp) };
    }
  }
  return { letter: 'F', gp: 0 };
}

const INITIAL_COURSES: CourseEntry[] = [
  { id: 'c1', code: 'CSE 3101', credits: '3.0', mode: 'grade', gradePoint: '3.75', marks: '78' },
  { id: 'c2', code: 'CSE 3102', credits: '1.5', mode: 'grade', gradePoint: '4.00', marks: '86' },
  { id: 'c3', code: 'CSE 3103', credits: '3.0', mode: 'grade', gradePoint: '3.50', marks: '72' },
  { id: 'c4', code: 'MATH 3105', credits: '3.0', mode: 'grade', gradePoint: '3.25', marks: '68' },
];

export function CgpaCalculator() {
  const [courses, setCourses] = useState<CourseEntry[]>(INITIAL_COURSES);
  const [priorCredits, setPriorCredits] = useState<string>('');
  const [priorCgpa, setPriorCgpa] = useState<string>('');

  function addCourse() {
    setCourses((prev) => [
      ...prev,
      {
        id: `c-${Date.now()}-${prev.length + 1}`,
        code: `COURSE ${prev.length + 1}`,
        credits: '3.0',
        mode: 'grade',
        gradePoint: '3.50',
        marks: '72',
      },
    ]);
  }

  function removeCourse(id: string) {
    setCourses((prev) => (prev.length > 1 ? prev.filter((c) => c.id !== id) : prev));
  }

  function updateCourse(id: string, patch: Partial<CourseEntry>) {
    setCourses((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  function handleReset() {
    setCourses(INITIAL_COURSES);
    setPriorCredits('');
    setPriorCgpa('');
  }

  const summary = useMemo(() => {
    let termAttemptedCredits = 0;
    let termEarnedCredits = 0;
    let termWeightedPoints = 0;

    for (const c of courses) {
      const cr = Number(c.credits);
      if (!Number.isFinite(cr) || cr <= 0) continue;
      const gp =
        c.mode === 'marks' ? marksToGrade(c.marks).gp : Number(c.gradePoint);
      if (!Number.isFinite(gp)) continue;

      termAttemptedCredits += cr;
      if (gp >= 2.0) {
        termEarnedCredits += cr;
      }
      termWeightedPoints += cr * gp;
    }

    const sgpa =
      termAttemptedCredits > 0 ? termWeightedPoints / termAttemptedCredits : 0;

    const prevCr = Math.max(0, Number(priorCredits) || 0);
    const prevGpa = Math.max(0, Math.min(4, Number(priorCgpa) || 0));
    const hasPrior = prevCr > 0 && priorCgpa.trim() !== '';

    const cumulativeCredits = termAttemptedCredits + (hasPrior ? prevCr : 0);
    const cumulativePoints = termWeightedPoints + (hasPrior ? prevCr * prevGpa : 0);
    const cgpa = cumulativeCredits > 0 ? cumulativePoints / cumulativeCredits : 0;

    const standing =
      sgpa >= 3.75
        ? "Dean's List Standing"
        : sgpa >= 3.0
        ? 'First Class Standing'
        : sgpa >= 2.0
        ? 'Satisfactory Pass'
        : termAttemptedCredits > 0
        ? 'Below 2.00 Minimum Pass'
        : 'Enter Course Credits';

    return {
      termAttemptedCredits,
      termEarnedCredits,
      termWeightedPoints,
      sgpa,
      hasPrior,
      cumulativeCredits,
      cgpa,
      standing,
    };
  }, [courses, priorCredits, priorCgpa]);

  return (
    <div
      id="cgpa-calculator"
      className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden scroll-mt-28"
    >
      <div className="px-6 py-4 border-b border-slate-200 bg-[#F7F7F5] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Calculator className="w-5 h-5 text-pust-800 shrink-0" />
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-pust-800">
              Interactive Academic Tool · 4.00 Scale
            </p>
            <h3 className="font-serif text-xl font-medium text-slate-900">
              PUST SGPA &amp; Cumulative CGPA Calculator
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:border-pust-800 hover:text-pust-900 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
          <button
            type="button"
            onClick={addCourse}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-pust-900 text-white hover:bg-pust-950 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Course
          </button>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-4">
          <div className="space-y-2.5">
            {courses.map((course, idx) => {
              const resolvedFromMarks = marksToGrade(course.marks);
              return (
                <div
                  key={course.id}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center p-3 rounded-xl border border-slate-200 bg-[#FAF8F4]"
                >
                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1">
                      Course {idx + 1}
                    </label>
                    <input
                      type="text"
                      value={course.code}
                      onChange={(e) => updateCourse(course.id, { code: e.target.value })}
                      placeholder="e.g. CSE 3101"
                      className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-pust-700"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1">
                      Credits
                    </label>
                    <input
                      type="number"
                      min="0.5"
                      max="6"
                      step="0.25"
                      value={course.credits}
                      onChange={(e) => updateCourse(course.id, { credits: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-pust-700"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1">
                      Input Mode
                    </label>
                    <select
                      value={course.mode}
                      onChange={(e) =>
                        updateCourse(course.id, {
                          mode: e.target.value as 'grade' | 'marks',
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-pust-700"
                    >
                      <option value="grade">Letter Grade</option>
                      <option value="marks">Numerical Marks (%)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1">
                      {course.mode === 'marks' ? `Marks (${resolvedFromMarks.letter})` : 'Grade'}
                    </label>
                    {course.mode === 'grade' ? (
                      <select
                        value={course.gradePoint}
                        onChange={(e) =>
                          updateCourse(course.id, { gradePoint: e.target.value })
                        }
                        className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-pust-700"
                      >
                        {PUST_GRADES.map((g) => (
                          <option key={g.letter} value={g.gp}>
                            {g.letter} ({g.gp})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={course.marks}
                        onChange={(e) => updateCourse(course.id, { marks: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-pust-700"
                      />
                    )}
                  </div>

                  <div className="sm:col-span-1 flex sm:justify-end sm:pt-4">
                    <button
                      type="button"
                      onClick={() => removeCourse(course.id)}
                      disabled={courses.length <= 1}
                      aria-label={`Remove ${course.code}`}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-700 hover:bg-red-50 disabled:opacity-40 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-600 mb-1">
                Prior Completed Credits (Optional)
              </label>
              <input
                type="number"
                min="0"
                max="200"
                step="0.5"
                value={priorCredits}
                onChange={(e) => setPriorCredits(e.target.value)}
                placeholder="e.g. 60.0"
                className="w-full px-3 py-2 text-xs font-mono tabular-nums rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-pust-700"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-600 mb-1">
                Prior Cumulative CGPA (Optional)
              </label>
              <input
                type="number"
                min="0"
                max="4"
                step="0.01"
                value={priorCgpa}
                onChange={(e) => setPriorCgpa(e.target.value)}
                placeholder="e.g. 3.45"
                className="w-full px-3 py-2 text-xs font-mono tabular-nums rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-pust-700"
              />
            </div>
          </div>
        </div>

        <aside className="lg:col-span-4 rounded-2xl border border-stone-200 bg-[#FAF9F6] p-5 space-y-5">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-pust-800 text-left">
              Calculated Term Result
            </p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-sm text-slate-600">Semester GPA (SGPA)</span>
              <span className="font-mono text-3xl font-semibold text-pust-900 tabular-nums">
                {summary.sgpa.toFixed(2)}
              </span>
            </div>
            <p className="text-xs font-medium text-slate-700 mt-1 text-left">{summary.standing}</p>
          </div>

          <dl className="border-t border-stone-200 pt-4 space-y-2.5 text-xs">
            <div className="flex justify-between gap-2">
              <dt className="text-slate-600">Attempted Credits (Term)</dt>
              <dd className="font-mono font-medium text-slate-900 tabular-nums">
                {summary.termAttemptedCredits.toFixed(2)}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-600">Earned Credits (≥ D / 2.00)</dt>
              <dd className="font-mono font-medium text-slate-900 tabular-nums">
                {summary.termEarnedCredits.toFixed(2)}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-600">Total Grade Points</dt>
              <dd className="font-mono font-medium text-slate-900 tabular-nums">
                {summary.termWeightedPoints.toFixed(2)}
              </dd>
            </div>
            {summary.hasPrior && (
              <>
                <div className="pt-2 border-t border-stone-200 flex justify-between gap-2">
                  <dt className="text-slate-700 font-medium">Total Cumulative Credits</dt>
                  <dd className="font-mono font-semibold text-slate-900 tabular-nums">
                    {summary.cumulativeCredits.toFixed(2)}
                  </dd>
                </div>
                <div className="flex justify-between gap-2 items-baseline">
                  <dt className="text-slate-800 font-semibold">Projected CGPA</dt>
                  <dd className="font-mono text-lg font-semibold text-pust-900 tabular-nums">
                    {summary.cgpa.toFixed(2)}
                  </dd>
                </div>
              </>
            )}
          </dl>

          <p className="text-[11px] text-slate-600 leading-relaxed border-t border-stone-200 pt-3 text-left">
            Computes weighted averages using PUST’s statutory 4.00 scale (A+ = 4.00, D = 2.00
            minimum pass, F = 0.00). Official transcripts are issued by the Controller of
            Examinations.
          </p>
        </aside>
      </div>
    </div>
  );
}
