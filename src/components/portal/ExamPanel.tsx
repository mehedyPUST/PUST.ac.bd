'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Printer } from 'lucide-react';
import { pustApi } from '../../lib/api';
import { PortalRecordsSkeleton } from '../PustSkeletons';
import type {
  AuthUser,
  CourseRecord,
  DepartmentRecord,
  ExamApplicationRecord,
  ExamCircularRecord,
  ExamResultRecord,
  HallDueRecord,
  PaymentGatewayConfig,
} from '../../types/pust';

interface ExamPanelProps {
  user: AuthUser;
  departments: DepartmentRecord[];
}

export function ExamPanel({ user, departments }: ExamPanelProps) {
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [circulars, setCirculars] = useState<ExamCircularRecord[]>([]);
  const [applications, setApplications] = useState<ExamApplicationRecord[]>([]);
  const [results, setResults] = useState<ExamResultRecord[]>([]);
  const [gateways, setGateways] = useState<PaymentGatewayConfig[]>([]);
  const [hallBlocked, setHallBlocked] = useState(false);
  const [unpaidHallDues, setUnpaidHallDues] = useState<HallDueRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Student Exam Apply & Pay
  const [selectedCircularId, setSelectedCircularId] = useState('');
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [payInputs, setPayInputs] = useState<Record<string, { method: string; txn: string }>>({});
  const [admitPreview, setAdmitPreview] = useState<ExamApplicationRecord | null>(null);

  // Chairman/Admin Create Course
  const [courseCode, setCourseCode] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [courseCredits, setCourseCredits] = useState(3);
  const [courseDept, setCourseDept] = useState(
    user.departmentCode === 'ADMIN' ? 'CSE' : user.departmentCode
  );
  const [courseSem, setCourseSem] = useState(6);
  const [courseSession, setCourseSession] = useState('2022-23');

  // Chairman/Admin Create Exam Circular
  const [circTitle, setCircTitle] = useState('');
  const [circDept, setCircDept] = useState(
    user.departmentCode === 'ADMIN' ? 'CSE' : user.departmentCode
  );
  const [circSem, setCircSem] = useState(6);
  const [circSession, setCircSession] = useState('2022-23');
  const [circDeadline, setCircDeadline] = useState('2026-12-10');
  const [circFee, setCircFee] = useState(1450);
  const [circCourseCodes, setCircCourseCodes] = useState<string[]>([]);

  // Chairman/Admin Result Entry
  const [resAcademicId, setResAcademicId] = useState('');
  const [resSemester, setResSemester] = useState(6);
  const [resPromoMode, setResPromoMode] = useState<'auto' | 'manual_promoted' | 'manual_repeat'>(
    'auto'
  );
  const [resCourseCode, setResCourseCode] = useState('CSE-3201');
  const [resCourseTitle, setResCourseTitle] = useState('Operating Systems');
  const [resCredits, setResCredits] = useState(3);
  const [resMarks, setResMarks] = useState(82);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await pustApi.getExamsOverview();
      setCourses(data.courses);
      setCirculars(data.circulars);
      setApplications(data.applications);
      setResults(data.results);
      setGateways(data.gateways);
      setHallBlocked(data.hallClearanceBlocked);
      setUnpaidHallDues(data.unpaidHallDues);
      if (data.circulars.length > 0 && !selectedCircularId) {
        setSelectedCircularId(data.circulars[0].id);
        setSelectedCourses(data.circulars[0].eligibleCourseCodes);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load examination records.');
    } finally {
      setLoading(false);
    }
  }, [selectedCircularId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const activeCircular = circulars.find((c) => c.id === selectedCircularId) || circulars[0];

  function handleSelectCircular(id: string) {
    setSelectedCircularId(id);
    const found = circulars.find((c) => c.id === id);
    if (found) setSelectedCourses(found.eligibleCourseCodes);
  }

  function toggleStudentCourse(code: string) {
    setSelectedCourses((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  }

  function toggleCircularCourse(code: string) {
    setCircCourseCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  }

  async function handleCreateCourse(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    try {
      const res = await pustApi.createCourse({
        code: courseCode.toUpperCase(),
        title: courseTitle,
        credits: Number(courseCredits),
        departmentCode: courseDept,
        semester: Number(courseSem),
        session: courseSession,
      });
      setFeedback(`Added course ${res.course.code} — ${res.course.title}.`);
      setCourseCode('');
      setCourseTitle('');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add course.');
    }
  }

  async function handleCreateExamCircular(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    try {
      const res = await pustApi.createExamCircular({
        title: circTitle,
        departmentCode: circDept,
        semester: Number(circSem),
        session: circSession,
        deadline: circDeadline,
        feeBdt: Number(circFee),
        eligibleCourseCodes: circCourseCodes,
      });
      setFeedback(`Published Examination Circular "${res.circular.title}".`);
      setCircTitle('');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to publish exam circular.');
    }
  }

  async function handleApplyExam(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    if (!activeCircular) return;
    try {
      const res = await pustApi.applyExam({
        circularId: activeCircular.id,
        selectedCourseCodes: selectedCourses,
      });
      setFeedback(
        `Exam form submitted (${res.application.formReference}). Complete fee payment below to unlock Admit Card verification.`
      );
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit exam form.');
    }
  }

  async function handlePayExam(app: ExamApplicationRecord) {
    setError(null);
    setFeedback(null);
    const defaultMethod = gateways[0]?.name || 'SSLCommerz';
    const input = payInputs[app.id] || { method: defaultMethod, txn: '' };
    if (!input.txn.trim()) {
      setError('Enter the payment transaction reference ID.');
      return;
    }
    try {
      await pustApi.payExam(app.id, {
        paymentMethod: input.method,
        transactionId: input.txn,
      });
      setFeedback(`Payment recorded for ${app.formReference}. Awaiting Chairman Admit Card approval.`);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit exam fee.');
    }
  }

  async function handleVerifyExam(
    app: ExamApplicationRecord,
    decision: 'Approved' | 'Rejected',
    physicalCollected?: boolean
  ) {
    setError(null);
    setFeedback(null);
    try {
      const res = await pustApi.verifyExam(app.id, { decision, physicalCollected });
      setFeedback(
        decision === 'Approved'
          ? `Issued Admit Card ${res.application.admitCardNo ?? ''} for ${app.academicId}.`
          : `Rejected exam form ${app.formReference}.`
      );
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to verify exam form.');
    }
  }

  async function handlePublishResult(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    try {
      const res = await pustApi.publishExamResult({
        academicId: resAcademicId,
        semester: Number(resSemester),
        promotionMode: resPromoMode,
        courses: [
          {
            code: resCourseCode,
            title: resCourseTitle,
            credits: Number(resCredits),
            marks: Number(resMarks),
          },
        ],
      });
      setFeedback(
        `Published Semester ${res.result.semester} result for ${res.result.academicId}: SGPA ${res.result.sgpa.toFixed(
          2
        )} (${res.result.promotionStatus}).`
      );
      setResAcademicId('');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to publish result.');
    }
  }

  const pendingVerifyCount = applications.filter(
    (a) => a.paymentStatus === 'Paid' && a.verificationStatus === 'Pending Chairman Verification'
  ).length;

  const deptCourses =
    user.role === 'teacher' || user.role === 'chairman'
      ? courses.filter((c) => c.departmentCode === user.departmentCode)
      : courses;

  return (
    <div className="space-y-6">
      {/* Role-Specific Module Header */}
      <div className="bg-white border border-stone-200 shadow-xs overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-emerald-900 to-emerald-700" />
        <div className="p-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-emerald-800">
              {user.role === 'student'
                ? 'Controller of Examinations · Student Desk'
                : user.role === 'teacher'
                ? `Department of ${user.departmentCode} · Teaching & Exam Schedule`
                : 'Examinations, Hall Dues Clearance & Results'}
            </p>
            <h2 className="font-serif text-2xl font-medium text-slate-900 mt-1">
              {user.role === 'student'
                ? 'Exam Form Fill-up, Admit Cards & My SGPA Results'
                : user.role === 'teacher'
                ? `${user.departmentCode} Departmental Courses, Circulars & Published Results`
                : 'Exam Form Fill-up, Admit Cards & SGPA Publishing'}
            </h2>
          </div>
          <p className="font-mono text-xs text-slate-600 tabular-nums">
            {user.role === 'chairman' || user.role === 'admin'
              ? `${pendingVerifyCount} awaiting verification · ${circulars.length} circular(s)`
              : user.role === 'teacher'
              ? `${deptCourses.length} course(s) · ${results.length} published result(s)`
              : `${applications.length} form(s) · ${results.length} result(s)`}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3.5 border border-red-200 bg-red-50 text-sm text-red-900">{error}</div>
      )}
      {feedback && (
        <div className="p-3.5 border border-emerald-200 bg-emerald-50 text-sm text-emerald-900">
          {feedback}
        </div>
      )}

      {/* Teacher: Department Courses & Active Exam Circulars */}
      {user.role === 'teacher' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-6 bg-white border border-stone-200 p-6 space-y-4 shadow-xs">
            <h3 className="font-serif text-lg font-medium text-slate-900">
              Department Course Catalog ({deptCourses.length})
            </h3>
            {deptCourses.length === 0 ? (
              <p className="text-sm text-slate-600">No departmental courses assigned yet.</p>
            ) : (
              <div className="divide-y divide-stone-200 border border-stone-200 text-sm">
                {deptCourses.map((c) => (
                  <div key={c.id} className="p-3.5 flex items-center justify-between gap-2">
                    <div>
                      <p className="font-mono text-xs font-semibold text-emerald-800">
                        {c.code} · Sem {c.semester} ({c.session})
                      </p>
                      <p className="font-medium text-slate-900">{c.title}</p>
                    </div>
                    <span className="font-mono text-xs text-slate-600 tabular-nums shrink-0">
                      {c.credits} Cr
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-6 bg-white border border-stone-200 p-6 space-y-4 shadow-xs">
            <h3 className="font-serif text-lg font-medium text-slate-900">
              Active Examination Circulars
            </h3>
            {circulars.length === 0 ? (
              <p className="text-sm text-slate-600">No active examination circulars.</p>
            ) : (
              <div className="divide-y divide-stone-200 border border-stone-200 text-sm">
                {circulars.map((c) => (
                  <div key={c.id} className="p-3.5 space-y-1">
                    <p className="font-mono text-xs text-emerald-800 tabular-nums">
                      {c.departmentCode} · Sem {c.semester} ({c.session}) · Deadline {c.deadline}
                    </p>
                    <p className="font-medium text-slate-900">{c.title}</p>
                    <p className="font-mono text-xs text-slate-500">
                      Courses: {c.eligibleCourseCodes.join(', ')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Student Hall Clearance Alert + Form Fill-up */}
      {user.role === 'student' && (
        <div className="bg-white border border-stone-200 p-6 space-y-5 shadow-xs">
          <h3 className="font-serif text-lg font-medium text-slate-900">
            Semester Examination Form Fill-up
          </h3>

          {hallBlocked ? (
            <div className="p-4 border border-amber-300 bg-amber-50 text-sm text-amber-900 space-y-1">
              <p className="font-semibold">
                Hall Financial Clearance Required Before Exam Form Fill-up
              </p>
              <p>
                Our system detected {unpaidHallDues.length} uncleared Hall due(s). Pay and clear
                your Hall dues in the Hall Seat &amp; Dues module before filling out examination
                forms.
              </p>
            </div>
          ) : (
            <div className="p-3.5 border border-emerald-200 bg-[#FAF8F4] text-xs text-emerald-900 font-mono">
              Hall Clearance Verified: No outstanding Hall dues blocking examination registration.
            </div>
          )}

          {circulars.length > 0 && activeCircular && (
            <form onSubmit={handleApplyExam} className="space-y-4">
              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-600 mb-1.5">
                  Select Examination Circular
                </label>
                <select
                  value={activeCircular.id}
                  onChange={(e) => handleSelectCircular(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-stone-300 bg-[#FAF8F4] focus:bg-white focus:border-emerald-800 focus:outline-none"
                >
                  {circulars.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.departmentCode} · Sem {c.semester} ({c.session}) — {c.title} · Fee ৳
                      {c.feeBdt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <p className="font-mono text-[11px] uppercase tracking-wider text-slate-600 mb-2">
                  Pre-Assigned Eligible Courses (Select Courses to Register)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {activeCircular.eligibleCourseCodes.map((code) => {
                    const courseInfo = courses.find((c) => c.code === code);
                    const checked = selectedCourses.includes(code);
                    return (
                      <label
                        key={code}
                        className={`flex items-start gap-2.5 p-3 border text-sm cursor-pointer transition-colors ${
                          checked
                            ? 'border-emerald-800 bg-emerald-50/40'
                            : 'border-stone-200 bg-[#FAF8F4]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleStudentCourse(code)}
                          className="mt-1 accent-emerald-800"
                        />
                        <div>
                          <p className="font-mono text-xs font-semibold text-emerald-800">
                            {code} · {courseInfo?.credits ?? 3} Credits
                          </p>
                          <p className="text-slate-900">
                            {courseInfo?.title ?? 'Departmental Core Course'}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={hallBlocked || selectedCourses.length === 0}
                className="px-5 py-2.5 text-sm font-medium bg-gradient-to-r from-emerald-900 to-emerald-800 hover:from-emerald-950 hover:to-emerald-900 text-white disabled:opacity-50 cursor-pointer"
              >
                Submit Exam Registration Form
              </button>
            </form>
          )}
        </div>
      )}

      {/* Chairman / Admin: Course Creation & Circular Publisher */}
      {(user.role === 'chairman' || user.role === 'admin') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={handleCreateCourse}
            className="lg:col-span-5 bg-white border border-stone-200 p-6 space-y-3 shadow-xs"
          >
            <h3 className="font-serif text-lg font-medium text-slate-900">
              Assign Departmental Course
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                required
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                placeholder="Code (e.g. CSE-4101)"
                className="px-3 py-2 text-xs border border-stone-300 bg-[#FAF8F4] focus:bg-white focus:border-emerald-800 focus:outline-none"
              />
              <input
                type="number"
                step="0.5"
                min={0.5}
                max={6}
                required
                value={courseCredits}
                onChange={(e) => setCourseCredits(Number(e.target.value))}
                className="px-3 py-2 text-xs border border-stone-300 bg-[#FAF8F4] focus:bg-white focus:border-emerald-800 focus:outline-none"
              />
            </div>
            <input
              type="text"
              required
              value={courseTitle}
              onChange={(e) => setCourseTitle(e.target.value)}
              placeholder="Course Title"
              className="w-full px-3 py-2 text-xs border border-stone-300 bg-[#FAF8F4] focus:bg-white focus:border-emerald-800 focus:outline-none"
            />
            <div className="grid grid-cols-3 gap-2">
              <select
                value={courseDept}
                disabled={user.role === 'chairman'}
                onChange={(e) => setCourseDept(e.target.value)}
                className="px-2.5 py-2 text-xs border border-stone-300 bg-[#FAF8F4]"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.code}>
                    {d.code}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                max={10}
                value={courseSem}
                onChange={(e) => setCourseSem(Number(e.target.value))}
                className="px-2.5 py-2 text-xs border border-stone-300 bg-[#FAF8F4]"
              />
              <input
                type="text"
                value={courseSession}
                onChange={(e) => setCourseSession(e.target.value)}
                placeholder="Session"
                className="px-2.5 py-2 text-xs border border-stone-300 bg-[#FAF8F4]"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium bg-gradient-to-r from-emerald-900 to-emerald-800 text-white hover:from-emerald-950 hover:to-emerald-900 cursor-pointer"
            >
              Save Course
            </button>
          </form>

          <form
            onSubmit={handleCreateExamCircular}
            className="lg:col-span-7 bg-white border border-stone-200 p-6 space-y-3 shadow-xs"
          >
            <h3 className="font-serif text-lg font-medium text-slate-900">
              Publish Exam Form Fill-up Circular
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input
                type="text"
                required
                value={circTitle}
                onChange={(e) => setCircTitle(e.target.value)}
                placeholder="Exam Circular Title"
                className="sm:col-span-2 px-3 py-2 text-xs border border-stone-300 bg-[#FAF8F4] focus:bg-white focus:border-emerald-800 focus:outline-none"
              />
              <select
                value={circDept}
                disabled={user.role === 'chairman'}
                onChange={(e) => setCircDept(e.target.value)}
                className="px-3 py-2 text-xs border border-stone-300 bg-[#FAF8F4]"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.code}>
                    {d.code}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={100}
                value={circFee}
                onChange={(e) => setCircFee(Number(e.target.value))}
                placeholder="Fee BDT"
                className="px-3 py-2 text-xs border border-stone-300 bg-[#FAF8F4]"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <input
                type="number"
                min={1}
                max={10}
                value={circSem}
                onChange={(e) => setCircSem(Number(e.target.value))}
                placeholder="Semester"
                className="px-3 py-2 text-xs border border-stone-300 bg-[#FAF8F4]"
              />
              <input
                type="text"
                value={circSession}
                onChange={(e) => setCircSession(e.target.value)}
                placeholder="Session (e.g. 2022-23)"
                className="px-3 py-2 text-xs border border-stone-300 bg-[#FAF8F4]"
              />
              <input
                type="date"
                value={circDeadline}
                onChange={(e) => setCircDeadline(e.target.value)}
                className="px-3 py-2 text-xs border border-stone-300 bg-[#FAF8F4]"
              />
            </div>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500 mb-1.5">
                Assign Eligible Courses
              </p>
              <div className="flex flex-wrap gap-1.5">
                {courses.map((c) => {
                  const active = circCourseCodes.includes(c.code);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleCircularCourse(c.code)}
                      className={`px-2.5 py-1 text-xs font-mono border transition-colors cursor-pointer whitespace-nowrap ${
                        active
                          ? 'bg-emerald-800 text-white border-emerald-900'
                          : 'bg-[#FAF8F4] text-slate-700 border-stone-200 hover:border-emerald-700'
                      }`}
                    >
                      {c.code}
                    </button>
                  );
                })}
              </div>
            </div>
            <button
              type="submit"
              disabled={circCourseCodes.length === 0}
              className="px-4 py-2 text-xs font-medium bg-gradient-to-r from-emerald-900 to-emerald-800 text-white hover:from-emerald-950 hover:to-emerald-900 disabled:opacity-50 cursor-pointer"
            >
              Publish Exam Circular
            </button>
          </form>
        </div>
      )}

      {/* Exam Form Applications, Payment, Chairman Admit Card Issuance (Student, Chairman & Admin) */}
      {(user.role === 'student' || user.role === 'chairman' || user.role === 'admin') && (
        <div className="bg-white border border-stone-200 p-6 space-y-4 shadow-xs">
          <h3 className="font-serif text-lg font-medium text-slate-900">
            Examination Registrations, Payments &amp; Admit Cards
          </h3>
          {loading ? (
            <PortalRecordsSkeleton rows={3} />
          ) : applications.length === 0 ? (
            <p className="text-sm text-slate-600">No examination applications submitted yet.</p>
          ) : (
            <div className="divide-y divide-stone-200 border border-stone-200">
              {applications.map((app) => {
                const payInput = payInputs[app.id] || {
                  method: gateways[0]?.name || 'SSLCommerz',
                  txn: '',
                };
                return (
                  <div key={app.id} className="p-4 space-y-3 hover:bg-[#FAF8F4]/50 transition-colors">
                    <div className="flex flex-wrap justify-between gap-2 text-sm">
                      <div>
                        <p className="font-medium text-slate-900">
                          {app.examTitle} · <span className="font-mono">{app.formReference}</span>
                        </p>
                        <p className="font-mono text-xs text-slate-500 tabular-nums">
                          {app.studentName} ({app.academicId}) · {app.departmentCode} · Credits{' '}
                          {app.totalCredits} · Fee ৳{app.feeBdt} · Payment:{' '}
                          <span className="font-semibold text-emerald-800">{app.paymentStatus}</span>{' '}
                          · Verification: {app.verificationStatus}
                        </p>
                        <p className="font-mono text-xs text-slate-600 mt-1">
                          Courses: {app.selectedCourseCodes.join(', ')}
                        </p>
                      </div>

                      {app.admitCardNo && (
                        <button
                          type="button"
                          onClick={() => setAdmitPreview(app)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-gradient-to-r from-emerald-900 to-emerald-800 text-white hover:from-emerald-950 hover:to-emerald-900 cursor-pointer h-fit whitespace-nowrap"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Admit Card ({app.admitCardNo})
                        </button>
                      )}
                    </div>

                    {user.role === 'student' && app.paymentStatus === 'Pending' && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        <select
                          value={payInput.method}
                          onChange={(e) =>
                            setPayInputs((prev) => ({
                              ...prev,
                              [app.id]: { ...payInput, method: e.target.value },
                            }))
                          }
                          className="px-3 py-1.5 text-xs border border-stone-300 bg-[#FAF8F4]"
                        >
                          {gateways.map((g) => (
                            <option key={g.id} value={g.name}>
                              {g.name}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={payInput.txn}
                          onChange={(e) =>
                            setPayInputs((prev) => ({
                              ...prev,
                              [app.id]: { ...payInput, txn: e.target.value },
                            }))
                          }
                          placeholder="Transaction ID (e.g. SSL-2026-8842)"
                          className="px-3 py-1.5 text-xs border border-stone-300 bg-[#FAF8F4] focus:bg-white focus:border-emerald-800 focus:outline-none w-64"
                        />
                        <button
                          type="button"
                          onClick={() => handlePayExam(app)}
                          className="px-4 py-1.5 text-xs font-medium bg-gradient-to-r from-emerald-900 to-emerald-800 text-white hover:from-emerald-950 hover:to-emerald-900 cursor-pointer whitespace-nowrap"
                        >
                          Confirm Fee Payment
                        </button>
                      </div>
                    )}

                    {(user.role === 'chairman' || user.role === 'admin') &&
                      app.paymentStatus === 'Paid' &&
                      app.verificationStatus === 'Pending Chairman Verification' && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => handleVerifyExam(app, 'Approved', true)}
                            className="px-3.5 py-1.5 text-xs font-medium bg-gradient-to-r from-emerald-900 to-emerald-800 text-white hover:from-emerald-950 hover:to-emerald-900 cursor-pointer whitespace-nowrap"
                          >
                            Verify Payment &amp; Issue Digital Admit Card
                          </button>
                          <button
                            type="button"
                            onClick={() => handleVerifyExam(app, 'Rejected', false)}
                            className="px-3.5 py-1.5 text-xs font-medium border border-red-300 text-red-700 hover:bg-red-50 cursor-pointer whitespace-nowrap"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Chairman / Admin Result Publishing */}
      {(user.role === 'chairman' || user.role === 'admin') && (
        <form
          onSubmit={handlePublishResult}
          className="bg-white border border-stone-200 p-6 space-y-4 shadow-xs"
        >
          <h3 className="font-serif text-lg font-medium text-slate-900">
            Result Entry, Auto-GPA Calculation &amp; Semester Promotion
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              required
              value={resAcademicId}
              onChange={(e) => setResAcademicId(e.target.value)}
              placeholder="Student Academic ID (e.g. 220101)"
              className="px-3 py-2 text-xs border border-stone-300 bg-[#FAF8F4] focus:bg-white focus:border-emerald-800 focus:outline-none"
            />
            <input
              type="number"
              min={1}
              max={10}
              value={resSemester}
              onChange={(e) => setResSemester(Number(e.target.value))}
              className="px-3 py-2 text-xs border border-stone-300 bg-[#FAF8F4]"
            />
            <select
              value={resPromoMode}
              onChange={(e) => setResPromoMode(e.target.value as typeof resPromoMode)}
              className="px-3 py-2 text-xs border border-stone-300 bg-[#FAF8F4]"
            >
              <option value="auto">Automatic Promotion Check (SGPA &gt;= 2.00)</option>
              <option value="manual_promoted">Manual Override — Promoted</option>
              <option value="manual_repeat">Manual Override — Repeat / Probation</option>
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input
              type="text"
              required
              value={resCourseCode}
              onChange={(e) => setResCourseCode(e.target.value)}
              placeholder="Course Code"
              className="px-3 py-2 text-xs border border-stone-300 bg-[#FAF8F4]"
            />
            <input
              type="text"
              required
              value={resCourseTitle}
              onChange={(e) => setResCourseTitle(e.target.value)}
              placeholder="Course Title"
              className="px-3 py-2 text-xs border border-stone-300 bg-[#FAF8F4]"
            />
            <input
              type="number"
              step="0.5"
              value={resCredits}
              onChange={(e) => setResCredits(Number(e.target.value))}
              placeholder="Credits"
              className="px-3 py-2 text-xs border border-stone-300 bg-[#FAF8F4]"
            />
            <input
              type="number"
              min={0}
              max={100}
              value={resMarks}
              onChange={(e) => setResMarks(Number(e.target.value))}
              placeholder="Marks (0-100)"
              className="px-3 py-2 text-xs border border-stone-300 bg-[#FAF8F4]"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2 text-xs font-medium bg-gradient-to-r from-emerald-900 to-emerald-800 text-white hover:from-emerald-950 hover:to-emerald-900 cursor-pointer"
          >
            Calculate SGPA &amp; Publish Result
          </button>
        </form>
      )}

      {/* Results Ledger */}
      <div className="bg-white border border-stone-200 p-6 space-y-4 shadow-xs">
        <h3 className="font-serif text-lg font-medium text-slate-900">
          Published Semester Results &amp; Promotion Standing
        </h3>
        {loading ? (
          <PortalRecordsSkeleton rows={2} />
        ) : results.length === 0 ? (
          <p className="text-sm text-slate-600">No semester results published yet.</p>
        ) : (
          <div className="divide-y divide-stone-200 border border-stone-200">
            {results.map((r) => (
              <div key={r.id} className="p-4 space-y-2 text-sm hover:bg-[#FAF8F4]/50 transition-colors">
                <div className="flex flex-wrap justify-between gap-2">
                  <p className="font-medium text-slate-900">
                    {r.studentName} ({r.academicId}) · Semester {r.semester} ({r.session})
                  </p>
                  <p className="font-mono text-xs font-semibold text-emerald-800 tabular-nums">
                    SGPA {r.sgpa.toFixed(2)} · {r.promotionStatus}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 font-mono text-xs text-slate-600">
                  {r.courses.map((c) => (
                    <span key={c.code}>
                      {c.code}: {c.marks} ({c.letterGrade}, {c.gradePoint.toFixed(2)})
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Printable Admit Card Modal */}
      {admitPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
          onClick={() => setAdmitPreview(null)}
        >
          <div
            className="w-full max-w-xl bg-white border border-stone-300 shadow-2xl overflow-hidden animate__animated animate__fadeInUp"
            style={{ animationDuration: '200ms' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1.5 bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-800" />
            <div className="p-6 space-y-4">
              <div className="border-b border-stone-200 pb-3 flex justify-between items-start">
                <div>
                  <p className="font-mono text-xs uppercase text-emerald-800">
                    Controller of Examinations · Official Admit Card
                  </p>
                  <h3 className="font-serif text-xl font-semibold text-slate-900">
                    Pabna University of Science and Technology
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setAdmitPreview(null)}
                  className="text-xs text-slate-500 hover:text-slate-900 cursor-pointer"
                >
                  Close
                </button>
              </div>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-slate-500">Admit Card No.</dt>
                  <dd className="font-mono font-semibold text-emerald-800">
                    {admitPreview.admitCardNo}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Issued Date</dt>
                  <dd className="font-mono tabular-nums">{admitPreview.admitCardIssuedAt}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Student Name</dt>
                  <dd className="font-medium">{admitPreview.studentName}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Academic ID</dt>
                  <dd className="font-mono tabular-nums">{admitPreview.academicId}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Department &amp; Session</dt>
                  <dd className="font-mono">
                    {admitPreview.departmentCode} · {admitPreview.session}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Form &amp; Payment Ref</dt>
                  <dd className="font-mono">
                    {admitPreview.formReference} ({admitPreview.transactionId})
                  </dd>
                </div>
              </dl>
              <div className="border-t border-stone-200 pt-3 text-xs font-mono text-slate-700">
                Registered Courses: {admitPreview.selectedCourseCodes.join(', ')}
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const text = [
                      'PABNA UNIVERSITY OF SCIENCE AND TECHNOLOGY',
                      'OFFICIAL EXAMINATION ADMIT CARD',
                      `Admit Card No: ${admitPreview.admitCardNo}`,
                      `Form Reference: ${admitPreview.formReference}`,
                      `Issued Date: ${admitPreview.admitCardIssuedAt}`,
                      `Student: ${admitPreview.studentName} (${admitPreview.academicId})`,
                      `Department & Session: ${admitPreview.departmentCode} · ${admitPreview.session}`,
                      `Semester: ${admitPreview.semester}`,
                      `Courses: ${admitPreview.selectedCourseCodes.join(', ')}`,
                      `Payment: ${admitPreview.paymentMethod} (${admitPreview.transactionId})`,
                    ].join('\n');
                    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${admitPreview.admitCardNo}.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-4 py-2 text-xs font-medium bg-gradient-to-r from-emerald-900 to-emerald-800 text-white hover:from-emerald-950 hover:to-emerald-900 cursor-pointer"
                >
                  Download Admit Card Copy
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 text-xs font-medium border border-stone-300 text-slate-700 hover:border-emerald-800 hover:text-emerald-800 cursor-pointer"
                >
                  Print / Save PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
