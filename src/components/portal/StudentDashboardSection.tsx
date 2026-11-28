'use client';

import { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  FileCheck2,
  GraduationCap,
  Lock,
  Receipt,
  RefreshCw,
  Wallet,
} from 'lucide-react';
import {
  PUST_WEEK_DAYS,
  REFERENCE_GPA_PROGRESSION,
  buildHistoricalGpaSeries,
  buildStudentClassSchedules,
  buildStudentCourseHistory,
  buildStudentFeeSummary,
  summarizeStudentResults,
} from '../../lib/studentDashboard';
import type {
  ClassScheduleDay,
  PaymentReceiptRecord,
} from '../../types/pust';
import { usePust } from '../PustContext';
import { PortalRecordsSkeleton } from '../PustSkeletons';
import { StudentGpaChart } from './StudentGpaChart';
import type { PortalTab } from './portalMeta';

interface StudentDashboardSectionProps {
  onSelectTab?: (tab: PortalTab) => void;
  onOpenReceipt?: (receipt: PaymentReceiptRecord) => void;
  onFocusSignIn?: () => void;
}

type DayFilter = 'ALL' | ClassScheduleDay;
type FeeFilter = 'all' | 'due' | 'settled';
type CourseHistoryFilter = 'all' | 'enrolled' | 'completed';

export function StudentDashboardSection({
  onSelectTab,
  onOpenReceipt,
  onFocusSignIn,
}: StudentDashboardSectionProps) {
  const {
    user,
    profile,
    departments,
    studentProfile,
    studentExamResults,
    studentCourses,
    studentClassSchedules,
    studentExamApplications,
    studentHallDues,
    studentCertificateApps,
    studentPaymentReceipts,
    studentFeeConfig,
    studentHallClearanceBlocked,
    loadingStudentDashboard,
    studentDashboardError,
    loadStudentDashboard,
  } = usePust();

  const isStudent = user?.role === 'student';

  // Interactive Filters
  const [selectedSemester, setSelectedSemester] = useState<'all' | number>('all');
  const [dayFilter, setDayFilter] = useState<DayFilter>('ALL');
  const [feeFilter, setFeeFilter] = useState<FeeFilter>('all');
  const [courseHistoryFilter, setCourseHistoryFilter] = useState<CourseHistoryFilter>('all');
  const [previewDeptCode, setPreviewDeptCode] = useState<string>(
    () => departments[0]?.code || 'CSE'
  );

  const activePreviewDeptCode = useMemo(() => {
    if (isStudent && user?.departmentCode) return user.departmentCode;
    if (departments.some((d) => d.code === previewDeptCode)) return previewDeptCode;
    return departments[0]?.code || 'CSE';
  }, [isStudent, user?.departmentCode, departments, previewDeptCode]);

  const effectiveSchedules = useMemo(() => {
    if (isStudent) return studentClassSchedules;
    return buildStudentClassSchedules({
      courses: studentCourses,
      departments,
      departmentCode: activePreviewDeptCode,
    });
  }, [isStudent, studentClassSchedules, studentCourses, departments, activePreviewDeptCode]);

  const filteredSchedules = useMemo(() => {
    if (dayFilter === 'ALL') return effectiveSchedules;
    return effectiveSchedules.filter((slot) => slot.day === dayFilter);
  }, [effectiveSchedules, dayFilter]);

  const resultsSummary = useMemo(
    () => summarizeStudentResults(studentExamResults, studentProfile),
    [studentExamResults, studentProfile]
  );

  const historicalGpaSeries = useMemo(
    () => buildHistoricalGpaSeries(studentExamResults),
    [studentExamResults]
  );

  const visibleResults = useMemo(() => {
    if (selectedSemester === 'all') return resultsSummary.sortedResults;
    return resultsSummary.sortedResults.filter((r) => r.semester === selectedSemester);
  }, [resultsSummary.sortedResults, selectedSemester]);

  const feeSummary = useMemo(
    () =>
      buildStudentFeeSummary({
        hallDues: studentHallDues,
        examApplications: studentExamApplications,
        certificateApps: studentCertificateApps,
        paymentReceipts: studentPaymentReceipts,
        hallClearanceBlocked: studentHallClearanceBlocked,
      }),
    [
      studentHallDues,
      studentExamApplications,
      studentCertificateApps,
      studentPaymentReceipts,
      studentHallClearanceBlocked,
    ]
  );

  const filteredFeeItems = useMemo(() => {
    if (feeFilter === 'all') return feeSummary.items;
    if (feeFilter === 'due') {
      return feeSummary.items.filter(
        (item) => item.status === 'due' || item.status === 'submitted'
      );
    }
    return feeSummary.items.filter((item) => item.status === 'settled');
  }, [feeSummary.items, feeFilter]);

  const upcomingAcademicEvents = useMemo(
    () => (profile?.academicExtras?.academicCalendar ?? []).slice(0, 4),
    [profile?.academicExtras?.academicCalendar]
  );

  const gradingScale = useMemo(
    () => profile?.governanceContent?.gradingScale ?? [],
    [profile?.governanceContent?.gradingScale]
  );

  const uniqueScheduleCourses = useMemo(
    () => new Set(effectiveSchedules.map((s) => s.courseCode)).size,
    [effectiveSchedules]
  );

  const isReferenceTimetable =
    effectiveSchedules.length > 0 && Boolean(effectiveSchedules[0]?.isReferenceSlot);

  const courseHistory = useMemo(
    () =>
      buildStudentCourseHistory({
        results: studentExamResults,
        courses: studentCourses,
        examApplications: studentExamApplications,
        departments,
        studentProfile,
        departmentCode: activePreviewDeptCode,
      }),
    [
      studentExamResults,
      studentCourses,
      studentExamApplications,
      departments,
      studentProfile,
      activePreviewDeptCode,
    ]
  );

  const previewCurriculumCourses = useMemo(() => {
    const seen = new Set<string>();
    return effectiveSchedules
      .filter((slot) => {
        if (seen.has(slot.courseCode)) return false;
        seen.add(slot.courseCode);
        return true;
      })
      .map((slot) => ({
        code: slot.courseCode,
        title: slot.courseTitle,
        credits: slot.credits,
        semester: slot.semester,
        sessionType: slot.sessionType,
        instructor: slot.instructor,
      }));
  }, [effectiveSchedules]);

  const defaultExamFeeBdt = studentFeeConfig?.defaultExamFeeBdt ?? 650;
  const certificateFeeBdt = studentFeeConfig?.certificateFeeBdt ?? 500;

  if (
    isStudent &&
    loadingStudentDashboard &&
    !studentProfile &&
    studentExamResults.length === 0 &&
    studentHallDues.length === 0
  ) {
    return (
      <section aria-label="Student Dashboard" className="space-y-4">
        <PortalRecordsSkeleton rows={4} />
      </section>
    );
  }

  return (
    <section
      id="student-dashboard-section"
      aria-labelledby="student-dashboard-heading"
      className="space-y-6"
    >
      {/* Top Overview Bar */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
          <div className="space-y-1 min-w-0">
            <p className="font-mono text-[11px] uppercase tracking-wider text-pust-800 font-semibold text-left">
              {isStudent
                ? 'Student Academic & Fee Workspace'
                : 'Student Portal Preview · Academic & Fee Overview'}
            </p>
            <h2
              id="student-dashboard-heading"
              className="font-serif text-xl sm:text-2xl font-medium text-slate-950 leading-tight text-left"
            >
              Student Dashboard
            </h2>
            {isStudent && user ? (
              <p className="text-xs text-slate-600 font-mono tabular-nums text-left truncate">
                {user.name} · ID {user.academicId} · {user.departmentCode}
                {studentProfile?.currentSemester
                  ? ` · Semester ${studentProfile.currentSemester}`
                  : ''}
                {user.session ? ` · Session ${user.session}` : ''}
              </p>
            ) : (
              <p className="text-xs sm:text-sm text-slate-600 text-left">
                Explore Academic Progress, weekly Sun–Thu Schedules, and university Finance details. Sign in above to load your personal GPA history, course grades, and fee ledger.
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {isStudent ? (
              <button
                type="button"
                onClick={() => void loadStudentDashboard()}
                disabled={loadingStudentDashboard}
                className="h-9 inline-flex items-center gap-1.5 px-3.5 rounded-lg border border-stone-300 bg-[#FAF9F6] text-xs font-semibold text-slate-800 hover:border-pust-800 hover:text-pust-900 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 text-pust-800 ${
                    loadingStudentDashboard ? 'animate-spin' : ''
                  }`}
                />
                <span>{loadingStudentDashboard ? 'Syncing...' : 'Refresh Records'}</span>
              </button>
            ) : (
              onFocusSignIn && (
                <button
                  type="button"
                  onClick={onFocusSignIn}
                  className="h-9 inline-flex items-center gap-1.5 px-4 rounded-lg bg-pust-900 text-white text-xs font-semibold hover:bg-pust-950 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Sign In to Personal Records</span>
                </button>
              )
            )}
          </div>
        </div>

        {studentDashboardError && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-red-900"
          >
            <span className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-700" />
              <span>{studentDashboardError}</span>
            </span>
            <button
              type="button"
              onClick={() => void loadStudentDashboard()}
              className="px-3 py-1.5 rounded-lg bg-white border border-red-300 font-semibold text-red-900 hover:bg-red-100 whitespace-nowrap shrink-0 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* 4-Column Summary Strip */}
        {isStudent ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-stone-200 rounded-xl border border-stone-200 bg-[#FAF9F6] overflow-hidden">
            <div className="p-4 space-y-1">
              <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500">
                Cumulative CGPA
              </p>
              <p className="font-serif text-2xl font-medium text-slate-950 tabular-nums">
                {resultsSummary.cumulativeCgpa > 0
                  ? resultsSummary.cumulativeCgpa.toFixed(2)
                  : 'N/A'}
                <span className="text-xs font-mono text-slate-500 font-normal"> / 4.00</span>
              </p>
              <p className="font-mono text-[11px] text-slate-600 tabular-nums">
                {resultsSummary.completedSemesters} sem completed ·{' '}
                {resultsSummary.latestResult
                  ? `Latest SGPA ${resultsSummary.latestResult.sgpa.toFixed(2)}`
                  : 'Awaiting published term'}
              </p>
            </div>

            <div className="p-4 space-y-1">
              <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500">
                Weekly Schedule
              </p>
              <p className="font-serif text-2xl font-medium text-slate-950 tabular-nums">
                {effectiveSchedules.length}{' '}
                <span className="text-xs font-sans font-normal text-slate-600">sessions / wk</span>
              </p>
              <p className="font-mono text-[11px] text-slate-600 tabular-nums">
                {uniqueScheduleCourses} courses · Sun–Thu
              </p>
            </div>

            <div className="p-4 space-y-1">
              <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500">
                Fee Balance Due
              </p>
              <p
                className={`font-serif text-2xl font-medium tabular-nums ${
                  feeSummary.totalOutstandingBdt > 0 ? 'text-amber-900' : 'text-emerald-900'
                }`}
              >
                BDT {feeSummary.totalOutstandingBdt.toLocaleString('en-US')}
              </p>
              <p className="text-[11px] flex items-center gap-1.5 font-medium">
                {feeSummary.totalOutstandingBdt > 0 ? (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span className="text-amber-900 tabular-nums">
                      {feeSummary.pendingCount} pending item(s)
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span className="text-emerald-900">All university dues cleared</span>
                  </>
                )}
              </p>
            </div>

            <div className="p-4 space-y-1">
              <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500">
                Settled Fees
              </p>
              <p className="font-serif text-2xl font-medium text-slate-950 tabular-nums">
                BDT {feeSummary.totalSettledBdt.toLocaleString('en-US')}
              </p>
              <p className="font-mono text-[11px] text-slate-600 tabular-nums">
                {studentPaymentReceipts.length} verified receipt(s) ·{' '}
                {studentProfile?.hallName || user?.hallAffiliation || 'Hall'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-stone-200 rounded-xl border border-stone-200 bg-[#FAF9F6] overflow-hidden">
            <div className="p-4 space-y-1">
              <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500">
                Grading Standard
              </p>
              <p className="font-serif text-2xl font-medium text-slate-950 tabular-nums">
                4.00 <span className="text-xs font-sans font-normal text-slate-600">CGPA scale</span>
              </p>
              <p className="text-[11px] text-slate-600">
                PUST Academic Ordinance · OBE
              </p>
            </div>

            <div className="p-4 space-y-1">
              <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500">
                Academic Week
              </p>
              <p className="font-serif text-2xl font-medium text-slate-950">Sun – Thu</p>
              <p className="font-mono text-[11px] text-slate-600 tabular-nums">
                09:00 – 17:00 · {departments.length} departments
              </p>
            </div>

            <div className="p-4 space-y-1">
              <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500">
                Exam &amp; Cert Fees
              </p>
              <p className="font-serif text-2xl font-medium text-slate-950 tabular-nums">
                BDT {defaultExamFeeBdt} / {certificateFeeBdt}
              </p>
              <p className="text-[11px] text-slate-600">
                Exam form · Provisional certificate
              </p>
            </div>

            <div className="p-4 space-y-1">
              <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500">
                Personal Records
              </p>
              <p className="font-serif text-lg font-medium text-slate-950 flex items-center gap-1.5 pt-1">
                <Lock className="w-4 h-4 text-pust-800 shrink-0" />
                <span>Sign In Required</span>
              </p>
              <p className="text-[11px] text-slate-600">
                Protects grades, admit &amp; fee receipts
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Responsive Grid Layout: Academic Progress + Finance (Row 1), Schedule (Row 2) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Card 1: Academic Progress */}
        <article
          aria-labelledby="card-academic-progress"
          className="xl:col-span-7 bg-white rounded-2xl border border-stone-200 overflow-hidden"
        >
          <div className="px-5 sm:px-6 py-4 bg-[#FAF9F6] border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-pust-50 border border-stone-200 flex items-center justify-center shrink-0">
                <GraduationCap className="w-4.5 h-4.5 text-pust-800" />
              </div>
              <div className="min-w-0">
                <h3
                  id="card-academic-progress"
                  className="font-serif text-lg font-medium text-slate-950 leading-snug"
                >
                  Academic Progress
                </h3>
                <p className="text-xs text-slate-600">
                  {isStudent
                    ? 'Historical semester GPA chart, course marks, and promotion standing'
                    : 'Sample GPA trajectory and official PUST Outcome-Based grading scale'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {isStudent && resultsSummary.sortedResults.length > 1 && (
                <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-stone-100 border border-stone-200 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setSelectedSemester('all')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      selectedSemester === 'all'
                        ? 'bg-pust-900 text-white'
                        : 'text-slate-700 hover:text-slate-950'
                    }`}
                  >
                    All Terms
                  </button>
                  {historicalGpaSeries.map((point) => (
                    <button
                      key={point.semester}
                      type="button"
                      onClick={() => setSelectedSemester(point.semester)}
                      className={`px-2.5 py-1 rounded-md font-mono text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums ${
                        selectedSemester === point.semester
                          ? 'bg-pust-900 text-white'
                          : 'text-slate-700 hover:text-slate-950'
                      }`}
                    >
                      {point.label}
                    </button>
                  ))}
                </div>
              )}

              {isStudent && onSelectTab && (
                <button
                  type="button"
                  onClick={() => onSelectTab('exams')}
                  className="h-8 inline-flex items-center gap-1.5 px-3 rounded-lg border border-stone-300 bg-white text-xs font-semibold text-slate-800 hover:border-pust-800 hover:text-pust-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <FileCheck2 className="w-3.5 h-3.5 text-pust-800" />
                  <span>Transcript</span>
                </button>
              )}
            </div>
          </div>

          <div className="p-5 sm:p-6 space-y-5">
            {isStudent ? (
              <>
                {historicalGpaSeries.length > 0 && (
                  <StudentGpaChart
                    data={historicalGpaSeries}
                    cumulativeCgpa={resultsSummary.cumulativeCgpa}
                    selectedSemester={selectedSemester}
                    onSelectSemester={setSelectedSemester}
                  />
                )}

                {visibleResults.length > 0 ? (
                  <div className="space-y-4">
                    {visibleResults.map((result) => {
                      const termCredits = result.courses.reduce((sum, c) => sum + c.credits, 0);
                      const isProbation = result.promotionStatus
                        .toLowerCase()
                        .includes('probation');
                      return (
                        <div
                          key={result.id}
                          className="rounded-xl border border-stone-200 overflow-hidden"
                        >
                          <div className="px-4 py-3 bg-[#FAF9F6] border-b border-stone-200 flex flex-wrap items-center justify-between gap-3">
                            <div className="space-y-0.5">
                              <p className="text-sm font-semibold text-slate-950 tabular-nums">
                                Semester {result.semester} · {result.departmentCode} ({result.session})
                              </p>
                              <p className="font-mono text-[11px] text-slate-500 tabular-nums">
                                {result.courses.length} courses · {termCredits.toFixed(1)} credits ·
                                Published {result.publishedAt}
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-xs">
                              <div className="text-right">
                                <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500 block">
                                  Term SGPA
                                </span>
                                <span className="font-mono text-base font-bold text-pust-900 tabular-nums">
                                  {result.sgpa.toFixed(2)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 font-medium">
                                {isProbation ? (
                                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                                ) : (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                                )}
                                <span
                                  className={isProbation ? 'text-amber-900' : 'text-emerald-900'}
                                >
                                  {result.promotionStatus}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="border-b border-stone-200 text-[11px] font-mono uppercase tracking-wider text-slate-500 bg-white">
                                  <th className="py-2.5 px-4 font-semibold">Code</th>
                                  <th className="py-2.5 px-4 font-semibold">Course Title</th>
                                  <th className="py-2.5 px-4 font-semibold text-right">Cr</th>
                                  <th className="py-2.5 px-4 font-semibold text-right">Marks</th>
                                  <th className="py-2.5 px-4 font-semibold text-right">Grade</th>
                                  <th className="py-2.5 px-4 font-semibold text-right">GP</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-stone-200">
                                {result.courses.map((course) => (
                                  <tr
                                    key={`${result.id}-${course.code}`}
                                    className="hover:bg-[#FAF9F6] transition-colors"
                                  >
                                    <td className="py-2.5 px-4 font-mono font-semibold text-pust-900 whitespace-nowrap tabular-nums">
                                      {course.code}
                                    </td>
                                    <td className="py-2.5 px-4 text-slate-800">{course.title}</td>
                                    <td className="py-2.5 px-4 font-mono text-right text-slate-700 tabular-nums">
                                      {course.credits.toFixed(1)}
                                    </td>
                                    <td className="py-2.5 px-4 font-mono text-right text-slate-700 tabular-nums">
                                      {course.marks}
                                    </td>
                                    <td className="py-2.5 px-4 font-mono text-right font-semibold text-slate-950">
                                      {course.letterGrade}
                                    </td>
                                    <td className="py-2.5 px-4 font-mono text-right font-semibold text-pust-900 tabular-nums">
                                      {course.gradePoint.toFixed(2)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl border border-stone-200 bg-[#FAF9F6] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-900">
                        No published semester results yet
                      </p>
                      <p className="text-xs text-slate-600">
                        Published course grades for student ID {user?.academicId} will appear here once finalized by the Exam Committee.
                      </p>
                    </div>
                    {onSelectTab && (
                      <button
                        type="button"
                        onClick={() => onSelectTab('exams')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-pust-900 text-white text-xs font-semibold hover:bg-pust-950 whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <span>Open Exams &amp; Results</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-4">
                <StudentGpaChart
                  data={REFERENCE_GPA_PROGRESSION}
                  cumulativeCgpa={3.75}
                  isPreview
                />

                {gradingScale.length > 0 && (
                  <div className="overflow-x-auto rounded-xl border border-stone-200">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-stone-200 bg-[#FAF9F6] font-mono text-[11px] uppercase tracking-wider text-slate-500">
                          <th className="py-2.5 px-4 font-semibold">Numerical Range</th>
                          <th className="py-2.5 px-4 font-semibold">Letter Grade</th>
                          <th className="py-2.5 px-4 font-semibold">Grade Point</th>
                          <th className="py-2.5 px-4 font-semibold">Standing</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-200">
                        {gradingScale.slice(0, 6).map((row) => (
                          <tr key={row.letter} className="hover:bg-[#FAF9F6]">
                            <td className="py-2 px-4 font-mono text-slate-800 tabular-nums">
                              {row.range}
                            </td>
                            <td className="py-2 px-4 font-mono font-semibold text-pust-900">
                              {row.letter}
                            </td>
                            <td className="py-2 px-4 font-mono font-semibold text-slate-950 tabular-nums">
                              {row.gp}
                            </td>
                            <td className="py-2 px-4 text-slate-600">{row.remarks}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="rounded-xl border border-stone-200 bg-[#FAF9F6] px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <span className="text-slate-700 flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-pust-800 shrink-0" />
                    <span>
                      Sign in with a student account to plot your semester GPA chart and course marks.
                    </span>
                  </span>
                  {onFocusSignIn && (
                    <button
                      type="button"
                      onClick={onFocusSignIn}
                      className="font-semibold text-pust-900 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Sign In Above →
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </article>

        {/* Card 2: Finance */}
        <article
          aria-labelledby="card-student-finance"
          className="xl:col-span-5 bg-white rounded-2xl border border-stone-200 overflow-hidden"
        >
          <div className="px-5 sm:px-6 py-4 bg-[#FAF9F6] border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-pust-50 border border-stone-200 flex items-center justify-center shrink-0">
                <Wallet className="w-4.5 h-4.5 text-pust-800" />
              </div>
              <div className="min-w-0">
                <h3
                  id="card-student-finance"
                  className="font-serif text-lg font-medium text-slate-950 leading-snug"
                >
                  Finance
                </h3>
                <p className="text-xs text-slate-600">
                  {isStudent
                    ? 'Hall dues, exam form fees, certificates & verified receipts'
                    : 'Examination, certificate & payment gateway schedule'}
                </p>
              </div>
            </div>

            {isStudent && (
              <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-stone-100 border border-stone-200 shrink-0 self-start sm:self-auto">
                {(
                  [
                    { id: 'all', label: `All (${feeSummary.items.length})` },
                    { id: 'due', label: `Due (${feeSummary.pendingCount})` },
                    { id: 'settled', label: `Paid (${feeSummary.settledCount})` },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFeeFilter(tab.id)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums ${
                      feeFilter === tab.id
                        ? 'bg-pust-900 text-white'
                        : 'text-slate-700 hover:text-slate-950'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-5 sm:p-6 space-y-4">
            {isStudent ? (
              <>
                {/* Compact Balance Breakdown */}
                <div className="grid grid-cols-2 divide-x divide-stone-200 rounded-xl border border-stone-200 bg-[#FAF9F6]">
                  <div className="p-3.5 space-y-0.5">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                      Outstanding Due
                    </p>
                    <p
                      className={`font-mono text-base font-bold tabular-nums ${
                        feeSummary.totalOutstandingBdt > 0 ? 'text-amber-900' : 'text-emerald-900'
                      }`}
                    >
                      BDT {feeSummary.totalOutstandingBdt.toLocaleString('en-US')}
                    </p>
                  </div>
                  <div className="p-3.5 space-y-0.5">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                      Settled Total
                    </p>
                    <p className="font-mono text-base font-bold text-slate-950 tabular-nums">
                      BDT {feeSummary.totalSettledBdt.toLocaleString('en-US')}
                    </p>
                  </div>
                </div>

                {feeSummary.hallClearanceBlocked && (
                  <div
                    role="status"
                    className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 space-y-2.5 text-xs text-amber-950"
                  >
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <span>
                        Unpaid hall dues temporarily block new semester exam form submissions.
                      </span>
                    </div>
                    {onSelectTab && (
                      <button
                        type="button"
                        onClick={() => onSelectTab('halls')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-amber-300 font-semibold text-amber-950 hover:bg-amber-100 whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        <span>Open Hall Desk</span>
                      </button>
                    )}
                  </div>
                )}

                {filteredFeeItems.length > 0 ? (
                  <div className="divide-y divide-stone-200 rounded-xl border border-stone-200 overflow-hidden">
                    {filteredFeeItems.map((item) => {
                      const isDue = item.status === 'due';
                      const isSubmitted = item.status === 'submitted';

                      return (
                        <div
                          key={item.id}
                          className="p-4 space-y-3 hover:bg-[#FAF9F6] transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 space-y-0.5">
                              <p className="font-mono text-[11px] text-slate-500 tabular-nums truncate">
                                {item.category}
                                {item.referenceNo ? ` · ${item.referenceNo}` : ''}
                              </p>
                              <p className="text-sm font-semibold text-slate-950 leading-snug">
                                {item.title}
                              </p>
                              <p className="text-xs text-slate-600">{item.subtitle}</p>
                            </div>
                            <p className="font-mono text-sm font-bold text-slate-950 tabular-nums whitespace-nowrap shrink-0">
                              BDT {item.amountBdt.toLocaleString('en-US')}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                            <p className="text-xs font-medium flex items-center gap-1.5">
                              {isDue ? (
                                <>
                                  <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                                  <span className="text-amber-900">{item.statusLabel}</span>
                                </>
                              ) : isSubmitted ? (
                                <>
                                  <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                                  <span className="text-amber-900">{item.statusLabel}</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                                  <span className="text-emerald-900">{item.statusLabel}</span>
                                </>
                              )}
                            </p>

                            <div className="flex items-center gap-2 shrink-0">
                              {item.receipt && onOpenReceipt && (
                                <button
                                  type="button"
                                  onClick={() => onOpenReceipt(item.receipt!)}
                                  className="h-7 inline-flex items-center gap-1 px-2.5 rounded-lg border border-stone-300 bg-white text-[11px] font-semibold text-slate-800 hover:border-pust-800 hover:text-pust-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                                >
                                  <Receipt className="w-3 h-3 text-pust-800" />
                                  <span>Receipt</span>
                                </button>
                              )}
                              {onSelectTab && (
                                <button
                                  type="button"
                                  onClick={() => onSelectTab(item.actionTab)}
                                  className={`h-7 inline-flex items-center gap-1 px-2.5 rounded-lg text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                                    isDue
                                      ? 'bg-pust-900 text-white hover:bg-pust-950'
                                      : 'border border-stone-300 bg-[#FAF9F6] text-slate-800 hover:border-pust-800 hover:text-pust-900'
                                  }`}
                                >
                                  <CreditCard className="w-3 h-3" />
                                  <span>{item.actionLabel}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl border border-stone-200 bg-[#FAF9F6] p-4 text-xs text-slate-600 space-y-2">
                    <p>
                      {feeFilter === 'due'
                        ? 'No pending or unpaid fees found on your ledger.'
                        : 'No fee records match the selected filter.'}
                    </p>
                    {onSelectTab && (
                      <div className="flex flex-wrap items-center gap-4">
                        <button
                          type="button"
                          onClick={() => onSelectTab('halls')}
                          className="font-semibold text-pust-900 hover:underline whitespace-nowrap cursor-pointer"
                        >
                          Hall Dues →
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectTab('exams')}
                          className="font-semibold text-pust-900 hover:underline whitespace-nowrap cursor-pointer"
                        >
                          Exam Forms →
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-3">
                <div className="divide-y divide-stone-200 rounded-xl border border-stone-200 bg-[#FAF9F6] overflow-hidden">
                  <div className="p-4 flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                        Semester Exam Form Fee
                      </p>
                      <p className="text-xs text-slate-600">
                        Required per semester exam registration with hall clearance check.
                      </p>
                    </div>
                    <p className="font-mono text-sm font-bold text-slate-950 tabular-nums whitespace-nowrap shrink-0">
                      BDT {defaultExamFeeBdt.toLocaleString('en-US')}
                    </p>
                  </div>

                  <div className="p-4 flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                        Certificate &amp; Transcript
                      </p>
                      <p className="text-xs text-slate-600">
                        Includes 4-office digital clearance &amp; QR-verified temporary issuance.
                      </p>
                    </div>
                    <p className="font-mono text-sm font-bold text-slate-950 tabular-nums whitespace-nowrap shrink-0">
                      BDT {certificateFeeBdt.toLocaleString('en-US')}
                    </p>
                  </div>

                  <div className="p-4 space-y-0.5">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                      Authorized Payment Gateways
                    </p>
                    <p className="text-sm font-semibold text-slate-950">
                      Sonali eSheba · bKash · Nagad
                    </p>
                    <p className="text-xs text-slate-600">
                      Instant verified digital payment receipts issued to your ledger.
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-stone-200 bg-[#FAF9F6] px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <span className="text-slate-700 flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-pust-800 shrink-0" />
                    <span>Sign in to settle dues and download receipts.</span>
                  </span>
                  {onFocusSignIn && (
                    <button
                      type="button"
                      onClick={onFocusSignIn}
                      className="font-semibold text-pust-900 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Sign In Above →
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </article>

        {/* Card 3: Course History */}
        <article
          aria-labelledby="card-course-history"
          className="xl:col-span-12 bg-white rounded-2xl border border-stone-200 overflow-hidden"
        >
          <div className="px-5 sm:px-6 py-4 bg-[#FAF9F6] border-b border-stone-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-pust-50 border border-stone-200 flex items-center justify-center shrink-0">
                <BookOpen className="w-4.5 h-4.5 text-pust-800" />
              </div>
              <div>
                <h3
                  id="card-course-history"
                  className="font-serif text-lg font-medium text-slate-950 leading-snug"
                >
                  Course History
                </h3>
                <p className="text-xs text-slate-600">
                  {isStudent
                    ? 'Current semester enrollments and previously completed courses from your university transcript'
                    : `Sample ${activePreviewDeptCode} departmental courses · Sign in to load completed grades and active enrollments`}
                </p>
              </div>
            </div>

            {isStudent && (
              <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-stone-100 border border-stone-200 shrink-0 self-start lg:self-auto">
                {(
                  [
                    {
                      id: 'all',
                      label: `All (${courseHistory.enrolledCourses.length + courseHistory.completedCourses.length})`,
                    },
                    {
                      id: 'enrolled',
                      label: `Current (${courseHistory.enrolledCourses.length})`,
                    },
                    {
                      id: 'completed',
                      label: `Completed (${courseHistory.completedCourses.length})`,
                    },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setCourseHistoryFilter(tab.id)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums ${
                      courseHistoryFilter === tab.id
                        ? 'bg-pust-900 text-white'
                        : 'text-slate-700 hover:text-slate-950'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-5 sm:p-6 space-y-5">
            {isStudent ? (
              <>
                {/* Credit & Course Count Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-stone-200 rounded-xl border border-stone-200 bg-[#FAF9F6]">
                  <div className="p-3.5 space-y-0.5">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                      Current Enrollments
                    </p>
                    <p className="font-mono text-sm font-bold text-slate-950 tabular-nums">
                      {courseHistory.enrolledCourses.length} courses ·{' '}
                      {courseHistory.enrolledCredits.toFixed(1)} cr
                    </p>
                  </div>
                  <div className="p-3.5 space-y-0.5">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                      Previously Completed
                    </p>
                    <p className="font-mono text-sm font-bold text-slate-950 tabular-nums">
                      {courseHistory.completedCourses.length} courses ·{' '}
                      {courseHistory.completedCredits.toFixed(1)} cr
                    </p>
                  </div>
                  <div className="p-3.5 space-y-0.5">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                      Total Tracked Credits
                    </p>
                    <p className="font-mono text-sm font-bold text-pust-900 tabular-nums">
                      {courseHistory.totalCredits.toFixed(1)} credits
                    </p>
                  </div>
                </div>

                {/* Current Enrollments Table */}
                {(courseHistoryFilter === 'all' || courseHistoryFilter === 'enrolled') && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                        Current Semester Enrollments
                      </p>
                      {onSelectTab && (
                        <button
                          type="button"
                          onClick={() => onSelectTab('exams')}
                          className="text-xs font-semibold text-pust-900 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          Exam Registration →
                        </button>
                      )}
                    </div>

                    {courseHistory.enrolledCourses.length > 0 ? (
                      <div className="overflow-x-auto rounded-xl border border-stone-200">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-stone-200 bg-[#FAF9F6] font-mono text-[11px] uppercase tracking-wider text-slate-500">
                              <th className="py-2.5 px-4 font-semibold">Course</th>
                              <th className="py-2.5 px-4 font-semibold">Title</th>
                              <th className="py-2.5 px-4 font-semibold">Term</th>
                              <th className="py-2.5 px-4 font-semibold text-right">Credits</th>
                              <th className="py-2.5 px-4 font-semibold">Instructor</th>
                              <th className="py-2.5 px-4 font-semibold">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-200">
                            {courseHistory.enrolledCourses.map((course) => (
                              <tr key={course.id} className="hover:bg-[#FAF9F6] transition-colors">
                                <td className="py-2.5 px-4 font-mono font-semibold text-pust-900 whitespace-nowrap tabular-nums">
                                  {course.code}
                                </td>
                                <td className="py-2.5 px-4">
                                  <p className="font-medium text-slate-900">{course.title}</p>
                                  <p className="text-[11px] text-slate-500">{course.sessionType}</p>
                                </td>
                                <td className="py-2.5 px-4 font-mono text-slate-700 whitespace-nowrap tabular-nums">
                                  Sem {course.semester} · {course.session}
                                </td>
                                <td className="py-2.5 px-4 font-mono text-right text-slate-700 tabular-nums">
                                  {course.credits.toFixed(1)}
                                </td>
                                <td className="py-2.5 px-4 text-slate-700">{course.instructor}</td>
                                <td className="py-2.5 px-4 whitespace-nowrap">
                                  <span className="inline-flex items-center gap-1.5 font-medium text-slate-800">
                                    {course.isExamRegistered ? (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                                    ) : (
                                      <Clock className="w-3.5 h-3.5 text-pust-800 shrink-0" />
                                    )}
                                    <span>{course.enrollmentStatus}</span>
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-stone-200 bg-[#FAF9F6] p-4 text-xs text-slate-600">
                        No active course enrollments found for your current department and semester.
                      </div>
                    )}
                  </div>
                )}

                {/* Previously Completed Courses Table */}
                {(courseHistoryFilter === 'all' || courseHistoryFilter === 'completed') && (
                  <div className="space-y-2.5">
                    <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                      Previously Completed Courses
                    </p>

                    {courseHistory.completedCourses.length > 0 ? (
                      <div className="overflow-x-auto rounded-xl border border-stone-200">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-stone-200 bg-[#FAF9F6] font-mono text-[11px] uppercase tracking-wider text-slate-500">
                              <th className="py-2.5 px-4 font-semibold">Course</th>
                              <th className="py-2.5 px-4 font-semibold">Title</th>
                              <th className="py-2.5 px-4 font-semibold">Term</th>
                              <th className="py-2.5 px-4 font-semibold text-right">Credits</th>
                              <th className="py-2.5 px-4 font-semibold text-right">Marks</th>
                              <th className="py-2.5 px-4 font-semibold text-right">Grade</th>
                              <th className="py-2.5 px-4 font-semibold">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-200">
                            {courseHistory.completedCourses.map((course) => (
                              <tr key={course.id} className="hover:bg-[#FAF9F6] transition-colors">
                                <td className="py-2.5 px-4 font-mono font-semibold text-pust-900 whitespace-nowrap tabular-nums">
                                  {course.code}
                                </td>
                                <td className="py-2.5 px-4 font-medium text-slate-900">
                                  {course.title}
                                </td>
                                <td className="py-2.5 px-4 font-mono text-slate-700 whitespace-nowrap tabular-nums">
                                  Sem {course.semester} · {course.session}
                                </td>
                                <td className="py-2.5 px-4 font-mono text-right text-slate-700 tabular-nums">
                                  {course.credits.toFixed(1)}
                                </td>
                                <td className="py-2.5 px-4 font-mono text-right text-slate-700 tabular-nums">
                                  {course.marks}
                                </td>
                                <td className="py-2.5 px-4 font-mono text-right font-semibold text-slate-950 whitespace-nowrap tabular-nums">
                                  {course.letterGrade} ({course.gradePoint.toFixed(2)})
                                </td>
                                <td className="py-2.5 px-4 whitespace-nowrap">
                                  <span className="inline-flex items-center gap-1.5 font-medium text-emerald-900">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                                    <span>Completed</span>
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-stone-200 bg-[#FAF9F6] p-4 text-xs text-slate-600">
                        No previously completed courses published on your transcript yet.
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-4">
                {previewCurriculumCourses.length > 0 && (
                  <div className="overflow-x-auto rounded-xl border border-stone-200">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-stone-200 bg-[#FAF9F6] font-mono text-[11px] uppercase tracking-wider text-slate-500">
                          <th className="py-2.5 px-4 font-semibold">Course</th>
                          <th className="py-2.5 px-4 font-semibold">Title</th>
                          <th className="py-2.5 px-4 font-semibold">Format</th>
                          <th className="py-2.5 px-4 font-semibold text-right">Credits</th>
                          <th className="py-2.5 px-4 font-semibold">Faculty Lead</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-200">
                        {previewCurriculumCourses.map((course) => (
                          <tr key={course.code} className="hover:bg-[#FAF9F6]">
                            <td className="py-2.5 px-4 font-mono font-semibold text-pust-900 whitespace-nowrap tabular-nums">
                              {course.code}
                            </td>
                            <td className="py-2.5 px-4 font-medium text-slate-900">
                              {course.title}
                            </td>
                            <td className="py-2.5 px-4 text-slate-700 whitespace-nowrap">
                              {course.sessionType} · Sem {course.semester}
                            </td>
                            <td className="py-2.5 px-4 font-mono text-right text-slate-700 tabular-nums">
                              {course.credits.toFixed(1)}
                            </td>
                            <td className="py-2.5 px-4 text-slate-700">{course.instructor}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="rounded-xl border border-stone-200 bg-[#FAF9F6] px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <span className="text-slate-700 flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-pust-800 shrink-0" />
                    <span>
                      Sign in with a student account to view your previously completed courses and active semester enrollments.
                    </span>
                  </span>
                  {onFocusSignIn && (
                    <button
                      type="button"
                      onClick={onFocusSignIn}
                      className="font-semibold text-pust-900 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Sign In Above →
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </article>

        {/* Card 4: Schedule */}
        <article
          aria-labelledby="card-student-schedule"
          className="xl:col-span-12 bg-white rounded-2xl border border-stone-200 overflow-hidden"
        >
          <div className="px-5 sm:px-6 py-4 bg-[#FAF9F6] border-b border-stone-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-pust-50 border border-stone-200 flex items-center justify-center shrink-0">
                <Calendar className="w-4.5 h-4.5 text-pust-800" />
              </div>
              <div>
                <h3
                  id="card-student-schedule"
                  className="font-serif text-lg font-medium text-slate-950 leading-snug"
                >
                  Schedule
                </h3>
                <p className="text-xs text-slate-600">
                  {activePreviewDeptCode} weekly Sun–Thu routine ·{' '}
                  {isReferenceTimetable
                    ? 'Department reference timetable'
                    : 'Derived from enrolled semester courses'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {!isStudent && departments.length > 0 && (
                <select
                  aria-label="Select department timetable"
                  value={activePreviewDeptCode}
                  onChange={(e) => setPreviewDeptCode(e.target.value)}
                  className="h-8 px-2.5 rounded-lg border border-stone-300 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:border-pust-800"
                >
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.code}>
                      {dept.code} — {dept.name}
                    </option>
                  ))}
                </select>
              )}

              <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-stone-100 border border-stone-200 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setDayFilter('ALL')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    dayFilter === 'ALL'
                      ? 'bg-pust-900 text-white'
                      : 'text-slate-700 hover:text-slate-950'
                  }`}
                >
                  All Days ({effectiveSchedules.length})
                </button>
                {PUST_WEEK_DAYS.map((day) => {
                  const count = effectiveSchedules.filter((s) => s.day === day.key).length;
                  return (
                    <button
                      key={day.key}
                      type="button"
                      onClick={() => setDayFilter(day.key)}
                      className={`px-2.5 py-1 rounded-md font-mono text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums ${
                        dayFilter === day.key
                          ? 'bg-pust-900 text-white'
                          : 'text-slate-700 hover:text-slate-950'
                      }`}
                    >
                      {day.key} ({count})
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6 space-y-5">
            {filteredSchedules.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-stone-200">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-stone-200 bg-[#FAF9F6] font-mono text-[11px] uppercase tracking-wider text-slate-500">
                      <th className="py-2.5 px-4 font-semibold">Day &amp; Time</th>
                      <th className="py-2.5 px-4 font-semibold">Course</th>
                      <th className="py-2.5 px-4 font-semibold">Session</th>
                      <th className="py-2.5 px-4 font-semibold">Room &amp; Building</th>
                      <th className="py-2.5 px-4 font-semibold">Instructor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {filteredSchedules.map((slot) => (
                      <tr key={slot.id} className="hover:bg-[#FAF9F6] transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap">
                          <p className="font-semibold text-slate-950">{slot.dayLabel}</p>
                          <p className="font-mono text-[11px] text-slate-500 tabular-nums">
                            {slot.startTime} – {slot.endTime}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-mono font-semibold text-pust-900 tabular-nums">
                            {slot.courseCode} · {slot.credits.toFixed(1)} cr
                          </p>
                          <p className="text-slate-800 font-medium">{slot.courseTitle}</p>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-slate-700">
                          {slot.sessionType} · Sem {slot.semester}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-slate-900">{slot.room}</p>
                          <p className="text-[11px] text-slate-500">{slot.building}</p>
                        </td>
                        <td className="py-3 px-4 text-slate-700">{slot.instructor}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-xl border border-stone-200 bg-[#FAF9F6] p-4 text-xs text-slate-600 flex items-center justify-between gap-3">
                <span>
                  No classes scheduled for {dayFilter}. Select &ldquo;All Days&rdquo; to inspect the full Sunday–Thursday week.
                </span>
                <button
                  type="button"
                  onClick={() => setDayFilter('ALL')}
                  className="font-semibold text-pust-900 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Show All Days
                </button>
              </div>
            )}

            {upcomingAcademicEvents.length > 0 && (
              <div className="space-y-2.5">
                <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                  Academic Calendar Milestones
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {upcomingAcademicEvents.map((ev) => (
                    <div
                      key={`${ev.term}-${ev.event}`}
                      className="rounded-xl border border-stone-200 bg-[#FAF9F6] p-3.5 space-y-1"
                    >
                      <p className="font-mono text-[11px] text-pust-800 font-semibold tabular-nums">
                        {ev.date}
                        {ev.endDate ? ` → ${ev.endDate}` : ''}
                      </p>
                      <p className="text-xs font-semibold text-slate-950 leading-snug">{ev.event}</p>
                      <p className="text-[11px] text-slate-600 truncate">
                        {ev.term}
                        {ev.venue ? ` · ${ev.venue}` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
