'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import {
  CheckCircle2,
  Clock,
  CreditCard,
  FileCheck2,
  Plus,
  Printer,
  Search,
  Trash2,
} from 'lucide-react';
import { pustApi } from '../../lib/api';
import { usePust } from '../PustContext';
import { PortalRecordsSkeleton } from '../PustSkeletons';
import { DigitalCheckoutModal, type CheckoutTarget } from './DigitalCheckoutModal';
import { DigitalDocumentModal, type DigitalDocumentData } from './DigitalDocumentModal';
import type {
  AuthUser,
  CourseRecord,
  DepartmentRecord,
  ExamApplicationRecord,
  ExamCircularRecord,
  ExamResultRecord,
  HallDueRecord,
  PaymentGatewayConfig,
  StudentRecord,
} from '../../types/pust';

interface ExamPanelProps {
  user: AuthUser;
  departments: DepartmentRecord[];
}

interface GradeRowInput {
  key: string;
  code: string;
  title: string;
  credits: number;
  marks: number;
}

function computePustGrade(marks: number): { letter: string; gp: number } {
  const m = Math.max(0, Math.min(100, Number(marks) || 0));
  if (m >= 80) return { letter: 'A+', gp: 4.0 };
  if (m >= 75) return { letter: 'A', gp: 3.75 };
  if (m >= 70) return { letter: 'A-', gp: 3.5 };
  if (m >= 65) return { letter: 'B+', gp: 3.25 };
  if (m >= 60) return { letter: 'B', gp: 3.0 };
  if (m >= 55) return { letter: 'B-', gp: 2.75 };
  if (m >= 50) return { letter: 'C+', gp: 2.5 };
  if (m >= 45) return { letter: 'C', gp: 2.25 };
  if (m >= 40) return { letter: 'D', gp: 2.0 };
  return { letter: 'F', gp: 0.0 };
}

const ACADEMIC_SESSIONS = ['2025-26', '2024-25', '2023-24', '2022-23', '2021-22', '2020-21'];

const ACADEMIC_YEARS = [
  { value: 1, label: '1st' },
  { value: 2, label: '2nd' },
  { value: 3, label: '3rd' },
  { value: 4, label: '4th' },
  { value: 5, label: '5th' },
] as const;

const YEAR_SEMESTERS = [
  { value: 1, label: '1st' },
  { value: 2, label: '2nd' },
] as const;

export function ExamPanel({ user, departments }: ExamPanelProps) {
  const { navigateTo } = usePust();
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

  // Digital Checkout & Document Modals
  const [checkoutTarget, setCheckoutTarget] = useState<CheckoutTarget | null>(null);
  const [activeDoc, setActiveDoc] = useState<DigitalDocumentData | null>(null);

  // Student Exam Apply
  const [selectedCircularId, setSelectedCircularId] = useState('');
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);

  // Chairman/Admin Create Course
  const [courseCodeSuffix, setCourseCodeSuffix] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [courseCredits, setCourseCredits] = useState(3);
  const [courseDept, setCourseDept] = useState(
    user.departmentCode === 'ADMIN' ? 'CSE' : user.departmentCode
  );
  const [courseYear, setCourseYear] = useState(3);
  const [courseTermSem, setCourseTermSem] = useState(2);
  const [courseSession, setCourseSession] = useState('2022-23');
  const [savingCourse, setSavingCourse] = useState(false);

  // Chairman/Admin Create Exam Circular
  const [circTitle, setCircTitle] = useState('');
  const [circDept, setCircDept] = useState(
    user.departmentCode === 'ADMIN' ? 'CSE' : user.departmentCode
  );
  const [circYear, setCircYear] = useState(3);
  const [circTermSem, setCircTermSem] = useState(1);
  const [circSession, setCircSession] = useState('2022-23');
  const [circDeadline, setCircDeadline] = useState('2026-12-10');
  const [circFee, setCircFee] = useState(1450);
  const [circCourseCodes, setCircCourseCodes] = useState<string[]>([]);
  const [showAllDeptCourses, setShowAllDeptCourses] = useState(false);
  const [publishingCircular, setPublishingCircular] = useState(false);

  // Teacher / Chairman / Admin Multi-Course Gradebook Entry
  const [resAcademicId, setResAcademicId] = useState('');
  const [resYear, setResYear] = useState(3);
  const [resTermSem, setResTermSem] = useState(1);
  const [resPromoMode, setResPromoMode] = useState<'auto' | 'manual_promoted' | 'manual_repeat'>(
    'auto'
  );
  const [retrievedStudent, setRetrievedStudent] = useState<StudentRecord | null>(null);
  const [previousStudentResults, setPreviousStudentResults] = useState<ExamResultRecord[]>([]);
  const [studentLookupLoading, setStudentLookupLoading] = useState(false);
  const [studentLookupError, setStudentLookupError] = useState<string | null>(null);
  const [publishingResult, setPublishingResult] = useState(false);
  const [courseRows, setCourseRows] = useState<GradeRowInput[]>([
    { key: 'row-1', code: 'CSE-3201', title: 'Operating Systems', credits: 3, marks: 82 },
    { key: 'row-2', code: 'CSE-3203', title: 'Computer Networks', credits: 3, marks: 76 },
  ]);
  const [pendingPromoModes, setPendingPromoModes] = useState<
    Record<string, 'auto' | 'manual_promoted' | 'manual_repeat'>
  >({});

  const initializedCircularRef = useRef(false);

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
      if (data.circulars.length > 0 && !initializedCircularRef.current) {
        initializedCircularRef.current = true;
        setSelectedCircularId(data.circulars[0].id);
        setSelectedCourses(data.circulars[0].eligibleCourseCodes);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load examination records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (user.role === 'chairman' && user.departmentCode && user.departmentCode !== 'ADMIN') {
      setCourseDept(user.departmentCode);
      setCircDept(user.departmentCode);
    } else if (departments.length > 0) {
      if (!courseDept) setCourseDept(departments[0].code);
      if (!circDept) setCircDept(departments[0].code);
    }
  }, [user.role, user.departmentCode, departments, courseDept, circDept]);

  const courseDeptPrefix = (courseDept || 'CSE')
    .replace(/[^A-Za-z]/g, '')
    .slice(0, 3)
    .toUpperCase();
  const computedCourseSemester = (courseYear - 1) * 2 + courseTermSem;
  const computedCircSemester = (circYear - 1) * 2 + circTermSem;

  const filteredCircularCourses = useMemo(
    () =>
      courses.filter(
        (c) =>
          c.departmentCode === circDept &&
          c.session === circSession &&
          c.semester === computedCircSemester
      ),
    [courses, circDept, circSession, computedCircSemester]
  );

  const deptAllCircularCourses = useMemo(
    () => courses.filter((c) => c.departmentCode === circDept),
    [courses, circDept]
  );

  const circularVisibleCourses = showAllDeptCourses
    ? deptAllCircularCourses
    : filteredCircularCourses;

  useEffect(() => {
    setCircCourseCodes(filteredCircularCourses.slice(0, 15).map((c) => c.code));
  }, [filteredCircularCourses]);

  const selectedCircularCredits = useMemo(
    () =>
      circCourseCodes.reduce((sum, code) => {
        const match = courses.find((c) => c.code === code);
        return sum + (match?.credits ?? 0);
      }, 0),
    [circCourseCodes, courses]
  );

  const activeCircular = circulars.find((c) => c.id === selectedCircularId) || circulars[0];

  const computedResSemester = (resYear - 1) * 2 + resTermSem;

  const fetchStudentContext = useCallback(
    async (academicIdInput: string, syncTermAndCourses: boolean) => {
      const trimmed = academicIdInput.trim();
      if (trimmed.length < 3) {
        setRetrievedStudent(null);
        setPreviousStudentResults([]);
        setStudentLookupError(null);
        setStudentLookupLoading(false);
        return;
      }

      setStudentLookupLoading(true);
      setStudentLookupError(null);
      try {
        const data = await pustApi.getExamStudentContext(trimmed);
        setRetrievedStudent(data.student);
        setPreviousStudentResults(data.previousResults);
        setStudentLookupError(null);

        if (syncTermAndCourses) {
          const targetSem = Math.max(1, Math.min(10, data.student.currentSemester || 1));
          setResYear(Math.ceil(targetSem / 2));
          setResTermSem(targetSem % 2 === 1 ? 1 : 2);
        }
      } catch (err) {
        setRetrievedStudent(null);
        setPreviousStudentResults([]);
        setStudentLookupError(err instanceof Error ? err.message : 'Student lookup failed.');
      } finally {
        setStudentLookupLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!['teacher', 'chairman', 'admin'].includes(user.role)) return;
    const trimmed = resAcademicId.trim();
    if (trimmed.length < 3) {
      setRetrievedStudent(null);
      setPreviousStudentResults([]);
      setStudentLookupError(null);
      setStudentLookupLoading(false);
      return;
    }

    let cancelled = false;
    setStudentLookupLoading(true);
    const timer = setTimeout(async () => {
      try {
        const data = await pustApi.getExamStudentContext(trimmed);
        if (cancelled) return;
        setRetrievedStudent(data.student);
        setPreviousStudentResults(data.previousResults);
        setStudentLookupError(null);

        const targetSem = Math.max(1, Math.min(10, data.student.currentSemester || 1));
        setResYear(Math.ceil(targetSem / 2));
        setResTermSem(targetSem % 2 === 1 ? 1 : 2);
      } catch (err) {
        if (cancelled) return;
        setRetrievedStudent(null);
        setPreviousStudentResults([]);
        setStudentLookupError(err instanceof Error ? err.message : 'Student lookup failed.');
      } finally {
        if (!cancelled) setStudentLookupLoading(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [resAcademicId, user.role]);

  const deptCourses = useMemo(() => {
    if (retrievedStudent) {
      return courses.filter((c) => c.departmentCode === retrievedStudent.departmentCode);
    }
    return user.role === 'teacher' || user.role === 'chairman'
      ? courses.filter((c) => c.departmentCode === user.departmentCode)
      : courses;
  }, [courses, retrievedStudent, user.role, user.departmentCode]);

  const matchingGradebookTermCourses = useMemo(() => {
    const deptCode = retrievedStudent?.departmentCode || (user.departmentCode !== 'ADMIN' ? user.departmentCode : '');
    if (!deptCode) return [];
    const exactSessionAndSem = courses.filter(
      (c) =>
        c.departmentCode === deptCode &&
        c.semester === computedResSemester &&
        (!retrievedStudent || c.session === retrievedStudent.session)
    );
    if (exactSessionAndSem.length > 0) return exactSessionAndSem;
    return courses.filter((c) => c.departmentCode === deptCode && c.semester === computedResSemester);
  }, [courses, retrievedStudent, user.departmentCode, computedResSemester]);

  const lastGradebookKeyRef = useRef<string>('');

  useEffect(() => {
    if (!retrievedStudent) {
      lastGradebookKeyRef.current = '';
      return;
    }
    const key = `${retrievedStudent.id}:${computedResSemester}`;
    if (lastGradebookKeyRef.current === key) return;
    if (matchingGradebookTermCourses.length > 0) {
      lastGradebookKeyRef.current = key;
      setCourseRows(
        matchingGradebookTermCourses.map((c, idx) => ({
          key: `row-${c.id}-${idx}`,
          code: c.code,
          title: c.title,
          credits: c.credits,
          marks: 75,
        }))
      );
    }
  }, [retrievedStudent, computedResSemester, matchingGradebookTermCourses]);

  const totalGradebookCredits = useMemo(
    () => courseRows.reduce((sum, r) => sum + (Number(r.credits) || 0), 0),
    [courseRows]
  );

  const currentWeightedPoints = useMemo(() => {
    let totalPts = 0;
    for (const row of courseRows) {
      const cr = Number(row.credits) || 0;
      const { gp } = computePustGrade(row.marks);
      totalPts += cr * gp;
    }
    return totalPts;
  }, [courseRows]);

  const estimatedSgpa = useMemo(
    () => (totalGradebookCredits > 0 ? currentWeightedPoints / totalGradebookCredits : 0),
    [currentWeightedPoints, totalGradebookCredits]
  );

  const priorResultsForCgpa = useMemo(
    () => previousStudentResults.filter((r) => r.semester !== computedResSemester),
    [previousStudentResults, computedResSemester]
  );

  const existingSameSemesterResult = useMemo(
    () => previousStudentResults.find((r) => r.semester === computedResSemester) ?? null,
    [previousStudentResults, computedResSemester]
  );

  const previousStandingStats = useMemo(() => {
    let credits = 0;
    let weighted = 0;
    for (const r of priorResultsForCgpa) {
      for (const c of r.courses) {
        credits += Number(c.credits) || 0;
        weighted += (Number(c.gradePoint) || 0) * (Number(c.credits) || 0);
      }
    }
    return {
      credits,
      weighted,
      cgpa: credits > 0 ? weighted / credits : null,
    };
  }, [priorResultsForCgpa]);

  const projectedCombinedCredits = previousStandingStats.credits + totalGradebookCredits;
  const projectedCumulativeCgpa = useMemo(() => {
    if (projectedCombinedCredits <= 0) return 0;
    return (previousStandingStats.weighted + currentWeightedPoints) / projectedCombinedCredits;
  }, [previousStandingStats.weighted, currentWeightedPoints, projectedCombinedCredits]);

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
    setCircCourseCodes((prev) => {
      if (prev.includes(code)) return prev.filter((c) => c !== code);
      if (prev.length >= 15) return prev;
      return [...prev, code];
    });
  }

  function handleSelectAllVisibleCircularCourses() {
    setCircCourseCodes(circularVisibleCourses.slice(0, 15).map((c) => c.code));
  }

  function addCatalogCourseRow(course: CourseRecord) {
    setCourseRows((prev) => {
      if (prev.some((r) => r.code.toUpperCase() === course.code.toUpperCase())) return prev;
      return [
        ...prev,
        {
          key: `row-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          code: course.code,
          title: course.title,
          credits: course.credits,
          marks: 75,
        },
      ];
    });
  }

  function addBlankCourseRow() {
    setCourseRows((prev) => [
      ...prev,
      {
        key: `row-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        code: '',
        title: '',
        credits: 3,
        marks: 75,
      },
    ]);
  }

  function updateCourseRow(key: string, patch: Partial<GradeRowInput>) {
    setCourseRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function removeCourseRow(key: string) {
    setCourseRows((prev) => (prev.length > 1 ? prev.filter((r) => r.key !== key) : prev));
  }

  async function handleCreateCourse(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFeedback(null);

    const sanitizedSuffix = courseCodeSuffix
      .trim()
      .toUpperCase()
      .replace(new RegExp(`^${courseDeptPrefix}[-\\s]*`, 'i'), '')
      .replace(/^-+/, '');

    if (!sanitizedSuffix) {
      setError(`Enter the course code suffix after ${courseDeptPrefix}- (e.g. 4101).`);
      return;
    }

    const fullCourseCode = `${courseDeptPrefix}-${sanitizedSuffix}`;
    if (fullCourseCode.length < 3 || fullCourseCode.length > 20) {
      setError('Course code must be between 3 and 20 characters.');
      return;
    }

    setSavingCourse(true);
    try {
      const res = await pustApi.createCourse({
        code: fullCourseCode,
        title: courseTitle.trim(),
        credits: Number(courseCredits),
        departmentCode: courseDept,
        semester: computedCourseSemester,
        session: courseSession,
      });
      const yearLabel = ACADEMIC_YEARS.find((y) => y.value === courseYear)?.label ?? `${courseYear}`;
      const semLabel = YEAR_SEMESTERS.find((s) => s.value === courseTermSem)?.label ?? `${courseTermSem}`;
      setFeedback(
        `Added course ${res.course.code} — ${res.course.title} (${yearLabel} Year, ${semLabel} Semester · ${res.course.session}).`
      );
      setCourseCodeSuffix('');
      setCourseTitle('');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add course.');
    } finally {
      setSavingCourse(false);
    }
  }

  async function handleCreateExamCircular(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFeedback(null);

    if (circCourseCodes.length === 0) {
      setError('Select at least one eligible course for this examination circular.');
      return;
    }

    setPublishingCircular(true);
    try {
      const res = await pustApi.createExamCircular({
        title: circTitle.trim(),
        departmentCode: circDept,
        semester: computedCircSemester,
        session: circSession,
        deadline: circDeadline,
        feeBdt: Math.round(Number(circFee)),
        eligibleCourseCodes: circCourseCodes,
      });
      const yearLabel = ACADEMIC_YEARS.find((y) => y.value === circYear)?.label ?? `${circYear}`;
      const semLabel = YEAR_SEMESTERS.find((s) => s.value === circTermSem)?.label ?? `${circTermSem}`;
      setFeedback(
        `Published Examination Circular "${res.circular.title}" (${yearLabel} Year, ${semLabel} Semester · ${res.circular.session}).`
      );
      setCircTitle('');
      setCircCourseCodes([]);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to publish exam circular.');
    } finally {
      setPublishingCircular(false);
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
        `Exam form submitted (${res.application.formReference}). Complete digital fee checkout below to unlock Chairman Admit Card approval.`
      );
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit exam form.');
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
    const sanitized = courseRows
      .map((r) => ({
        code: r.code.trim().toUpperCase(),
        title: r.title.trim(),
        credits: Number(r.credits),
        marks: Number(r.marks),
      }))
      .filter((r) => r.code && r.title && r.credits > 0);

    if (sanitized.length === 0) {
      setError('Add at least one valid course row with code, title, and credits.');
      return;
    }

    setPublishingResult(true);
    try {
      const res = await pustApi.publishExamResult({
        academicId: resAcademicId.trim(),
        semester: computedResSemester,
        promotionMode: resPromoMode,
        courses: sanitized,
      });

      const yearLabel = ACADEMIC_YEARS.find((y) => y.value === resYear)?.label ?? `${resYear}`;
      const semLabel = YEAR_SEMESTERS.find((s) => s.value === resTermSem)?.label ?? `${resTermSem}`;

      if (res.pendingChairmanReview) {
        setFeedback(
          `Submitted ${yearLabel} Year, ${semLabel} Semester marksheet for ${res.result.studentName} (${res.result.academicId}) to Chairman verification queue (SGPA ${res.result.sgpa.toFixed(
            2
          )}).`
        );
      } else {
        const cgpaText =
          typeof res.cumulativeCgpa === 'number'
            ? ` · Updated CGPA ${res.cumulativeCgpa.toFixed(2)}`
            : '';
        setFeedback(
          `Published ${yearLabel} Year, ${semLabel} Semester result for ${res.result.studentName} (${res.result.academicId}): SGPA ${res.result.sgpa.toFixed(
            2
          )}${cgpaText} (${res.result.promotionStatus}).`
        );
      }
      setResAcademicId('');
      setRetrievedStudent(null);
      setPreviousStudentResults([]);
      setStudentLookupError(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit exam result.');
    } finally {
      setPublishingResult(false);
    }
  }

  async function handleApprovePendingResult(r: ExamResultRecord) {
    setError(null);
    setFeedback(null);
    const promoMode = pendingPromoModes[r.id] || 'auto';
    try {
      const res = await pustApi.approvePendingExamResult(r.id, promoMode);
      setFeedback(
        `Verified & published Semester ${res.result.semester} marksheet for ${res.result.academicId} (SGPA ${res.result.sgpa.toFixed(
          2
        )} · ${res.result.promotionStatus}). Cumulative CGPA updated.`
      );
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to publish pending marksheet.');
    }
  }

  function openAdmitCardDocument(app: ExamApplicationRecord) {
    if (!app.admitCardNo) return;
    setActiveDoc({
      kind: 'admit_card',
      serialCode: app.admitCardNo,
      title: 'Official Examination Admit Card',
      subtitle: app.examTitle,
      holderName: app.studentName,
      academicId: app.academicId,
      departmentCode: app.departmentCode,
      session: app.session,
      issuedAt: app.admitCardIssuedAt || app.createdAt.slice(0, 10),
      issuedBy: 'Controller of Examinations & Department Chairman',
      statusLabel: 'Verified & Active',
      rows: [
        { label: 'Form Reference', value: app.formReference },
        { label: 'Semester', value: `Semester ${app.semester}` },
        { label: 'Total Registered Credits', value: `${app.totalCredits} Credits` },
        {
          label: 'Fee Settlement',
          value: `BDT ${app.feeBdt.toLocaleString()} · ${app.paymentMethod || 'Digital'} (${
            app.receiptNo || app.transactionId || 'Verified'
          })`,
        },
        { label: 'Hall Financial Check', value: 'Cleared' },
      ],
      tableHeaders: ['Course Code', 'Course Title', 'Credits'],
      tableRows: app.selectedCourseCodes.map((code) => {
        const info = courses.find((c) => c.code === code);
        return [code, info?.title || 'Departmental Registered Course', `${info?.credits ?? 3}`];
      }),
      footerNote:
        'Verify authenticity anytime on the Public Registry using the Admit Card number above.',
    });
  }

  function openGradeSheetDocument(r: ExamResultRecord) {
    const serial = `PUST-GRD-${r.departmentCode}-${r.academicId}-S${r.semester}`;
    setActiveDoc({
      kind: 'transcript',
      serialCode: serial,
      title: `Official Semester ${r.semester} Grade Sheet`,
      subtitle: 'Controller of Examinations · PUST 4.00 Grading Scale',
      holderName: r.studentName,
      academicId: r.academicId,
      departmentCode: r.departmentCode,
      session: r.session,
      issuedAt: r.publishedAt.slice(0, 10),
      issuedBy: r.reviewedBy ? `${r.reviewedBy} (Verified)` : r.enteredBy,
      statusLabel: r.promotionStatus,
      rows: [
        { label: 'Semester SGPA', value: `${r.sgpa.toFixed(2)} / 4.00` },
        { label: 'Academic Standing', value: r.promotionStatus },
        { label: 'Prepared By', value: r.enteredBy },
        { label: 'Verified & Published By', value: r.reviewedBy || 'Department Chairman' },
      ],
      tableHeaders: ['Code', 'Course Title', 'Cr', 'Marks', 'Grade', 'GP'],
      tableRows: r.courses.map((c) => [
        c.code,
        c.title,
        String(c.credits),
        String(c.marks),
        c.letterGrade,
        c.gradePoint.toFixed(2),
      ]),
      footerNote:
        'Grades computed automatically under the PUST Ordinance (80+ A+ 4.00 down to 40 D 2.00).',
    });
  }

  const pendingVerifyCount = applications.filter(
    (a) => a.paymentStatus === 'Paid' && a.verificationStatus === 'Pending Chairman Verification'
  ).length;

  const pendingResults = results.filter(
    (r) => !r.published || r.status === 'pending_chairman'
  );
  const publishedResults = results.filter(
    (r) => r.published && r.status !== 'pending_chairman'
  );

  const canEnterMarks = ['teacher', 'chairman', 'admin'].includes(user.role);

  return (
    <div className="space-y-6">
      {/* Role-Specific Module Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-pust-800">
            {user.role === 'student'
              ? 'Controller of Examinations · Student Desk'
              : user.role === 'teacher'
              ? `Department of ${user.departmentCode} · Gradebook & Exam Desk`
              : 'Examinations, Hall Dues Clearance & Results'}
          </p>
          <h2 className="font-serif text-2xl font-medium text-slate-900 mt-1">
            {user.role === 'student'
              ? 'Exam Form Fill-up, Admit Cards & My SGPA Results'
              : user.role === 'teacher'
              ? `${user.departmentCode} Courses, Circulars & Marksheet Submission`
              : 'Exam Form Fill-up, Admit Cards & SGPA Publishing'}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono tabular-nums">
          {(user.role === 'chairman' || user.role === 'admin') && (
            <>
              <div className="px-3.5 py-2 rounded-xl bg-[#F7F7F5] border border-slate-200">
                <span className="block text-[10px] uppercase tracking-wider text-slate-500">
                  Admit Queue
                </span>
                <span className="text-base font-semibold text-amber-800">{pendingVerifyCount}</span>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-[#F7F7F5] border border-slate-200">
                <span className="block text-[10px] uppercase tracking-wider text-slate-500">
                  Pending Results
                </span>
                <span className="text-base font-semibold text-pust-900">
                  {pendingResults.length}
                </span>
              </div>
            </>
          )}
          {user.role === 'teacher' && (
            <div className="px-3.5 py-2 rounded-xl bg-[#F7F7F5] border border-slate-200">
              <span className="block text-[10px] uppercase tracking-wider text-slate-500">
                Dept Courses
              </span>
              <span className="text-base font-semibold text-pust-900">{deptCourses.length}</span>
            </div>
          )}
          {user.role === 'student' && (
            <div className="px-3.5 py-2 rounded-xl bg-[#F7F7F5] border border-slate-200">
              <span className="block text-[10px] uppercase tracking-wider text-slate-500">
                Forms · Results
              </span>
              <span className="text-base font-semibold text-pust-900">
                {applications.length} · {publishedResults.length}
              </span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl border border-red-200 bg-red-50 text-sm text-red-900">
          {error}
        </div>
      )}
      {feedback && (
        <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50 text-sm text-emerald-900">
          {feedback}
        </div>
      )}

      {/* Teacher: Department Courses & Active Exam Circulars */}
      {user.role === 'teacher' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <h3 className="font-serif text-lg font-medium text-slate-900">
              Department Course Catalog ({deptCourses.length})
            </h3>
            {deptCourses.length === 0 ? (
              <p className="text-sm text-slate-600">No departmental courses assigned yet.</p>
            ) : (
              <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 overflow-hidden text-sm">
                {deptCourses.map((c) => (
                  <div
                    key={c.id}
                    className="p-3.5 flex items-center justify-between gap-2 bg-white hover:bg-[#F7F7F5] transition-colors"
                  >
                    <div>
                      <p className="font-mono text-xs font-semibold text-pust-800">
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

          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <h3 className="font-serif text-lg font-medium text-slate-900">
              Active Examination Circulars
            </h3>
            {circulars.length === 0 ? (
              <p className="text-sm text-slate-600">No active examination circulars.</p>
            ) : (
              <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 overflow-hidden text-sm">
                {circulars.map((c) => (
                  <div key={c.id} className="p-3.5 space-y-1 bg-white">
                    <p className="font-mono text-xs text-pust-800 tabular-nums">
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
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-xs">
          <h3 className="font-serif text-lg font-medium text-slate-900">
            Semester Examination Form Fill-up
          </h3>

          {hallBlocked ? (
            <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 text-sm text-amber-900 space-y-1">
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
            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/60 text-xs text-emerald-900 font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-800 shrink-0" />
              <span>
                Hall Clearance Verified: No outstanding Hall dues blocking examination registration.
              </span>
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
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:border-pust-800 focus:outline-none"
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
                        className={`flex items-start gap-2.5 p-3 rounded-xl border text-sm cursor-pointer transition-colors ${
                          checked
                            ? 'border-pust-800 bg-pust-50/50'
                            : 'border-slate-200 bg-[#F7F7F5]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleStudentCourse(code)}
                          className="mt-1 accent-pust-800"
                        />
                        <div>
                          <p className="font-mono text-xs font-semibold text-pust-800">
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
                className="px-5 py-2.5 text-sm font-medium rounded-lg bg-pust-900 hover:bg-pust-950 text-white disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
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
            className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs"
          >
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-serif text-lg font-medium text-slate-900">
                Assign Departmental Course
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Register a course under department, session, year, and semester.
              </p>
            </div>

            <div>
              <label
                htmlFor="course-dept"
                className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1"
              >
                Department Name
              </label>
              <select
                id="course-dept"
                value={courseDept}
                disabled={user.role === 'chairman'}
                onChange={(e) => setCourseDept(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:border-pust-800 focus:outline-none disabled:opacity-75"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.code}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label
                  htmlFor="course-session"
                  className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1"
                >
                  Session
                </label>
                <select
                  id="course-session"
                  value={courseSession}
                  onChange={(e) => setCourseSession(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:border-pust-800 focus:outline-none tabular-nums"
                >
                  {ACADEMIC_SESSIONS.map((sess) => (
                    <option key={sess} value={sess}>
                      {sess}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="course-year"
                  className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1"
                >
                  Year
                </label>
                <select
                  id="course-year"
                  value={courseYear}
                  onChange={(e) => setCourseYear(Number(e.target.value))}
                  className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:border-pust-800 focus:outline-none"
                >
                  {ACADEMIC_YEARS.map((yr) => (
                    <option key={yr.value} value={yr.value}>
                      {yr.label} Year
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="course-term-semester"
                  className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1"
                >
                  Semester
                </label>
                <select
                  id="course-term-semester"
                  value={courseTermSem}
                  onChange={(e) => setCourseTermSem(Number(e.target.value))}
                  className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:border-pust-800 focus:outline-none"
                >
                  {YEAR_SEMESTERS.map((sem) => (
                    <option key={sem.value} value={sem.value}>
                      {sem.label} Semester
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-8">
                <label
                  htmlFor="course-code-suffix"
                  className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1"
                >
                  Course Code
                </label>
                <div className="flex items-stretch rounded-lg border border-slate-300 bg-[#F7F7F5] focus-within:bg-white focus-within:border-pust-800 overflow-hidden">
                  <span
                    className="inline-flex items-center px-3 py-2 font-mono text-xs font-semibold text-pust-900 bg-pust-50 border-r border-slate-300 select-none shrink-0"
                    title="First 3 letters of selected department"
                  >
                    {courseDeptPrefix}-
                  </span>
                  <input
                    id="course-code-suffix"
                    type="text"
                    required
                    maxLength={14}
                    value={courseCodeSuffix}
                    onChange={(e) => setCourseCodeSuffix(e.target.value.toUpperCase())}
                    placeholder="4101"
                    className="w-full min-w-0 px-3 py-2 font-mono text-xs uppercase bg-transparent text-slate-900 focus:outline-none tabular-nums"
                  />
                </div>
              </div>

              <div className="sm:col-span-4">
                <label
                  htmlFor="course-credits"
                  className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1"
                >
                  Credits
                </label>
                <input
                  id="course-credits"
                  type="number"
                  step="0.5"
                  min={0.5}
                  max={6}
                  required
                  value={courseCredits}
                  onChange={(e) => setCourseCredits(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:border-pust-800 focus:outline-none tabular-nums"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="course-title"
                className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1"
              >
                Course Title
              </label>
              <input
                id="course-title"
                type="text"
                required
                minLength={3}
                maxLength={120}
                value={courseTitle}
                onChange={(e) => setCourseTitle(e.target.value)}
                placeholder="e.g. Artificial Intelligence & Neural Networks"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:border-pust-800 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                {courseDeptPrefix}-
                {courseCodeSuffix.trim().toUpperCase() || '____'} · Semester {computedCourseSemester}/10
              </span>
              <button
                type="submit"
                disabled={savingCourse}
                className="px-4 py-2 text-xs font-medium rounded-lg bg-pust-900 text-white hover:bg-pust-950 disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
              >
                {savingCourse ? 'Saving Course...' : 'Save Course'}
              </button>
            </div>
          </form>

          <form
            onSubmit={handleCreateExamCircular}
            className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs"
          >
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-serif text-lg font-medium text-slate-900">
                Publish Exam Form Fill-up Circular
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure examination metadata, fee schedule, deadline, and eligible courses.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-7">
                <label
                  htmlFor="circ-title"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Circular Title
                </label>
                <input
                  id="circ-title"
                  type="text"
                  required
                  minLength={5}
                  maxLength={180}
                  value={circTitle}
                  onChange={(e) => setCircTitle(e.target.value)}
                  placeholder="e.g. B.Sc. Engineering 3rd Year 2nd Semester Exam 2026"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:border-pust-800 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-5">
                <label
                  htmlFor="circ-dept"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Department Name
                </label>
                <select
                  id="circ-dept"
                  value={circDept}
                  disabled={user.role === 'chairman'}
                  onChange={(e) => {
                    setCircDept(e.target.value);
                    setShowAllDeptCourses(false);
                  }}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:border-pust-800 focus:outline-none disabled:opacity-75"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.code}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label
                  htmlFor="circ-session"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Session
                </label>
                <select
                  id="circ-session"
                  value={circSession}
                  onChange={(e) => setCircSession(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:border-pust-800 focus:outline-none tabular-nums"
                >
                  {ACADEMIC_SESSIONS.map((sess) => (
                    <option key={sess} value={sess}>
                      {sess}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="circ-year"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Year
                </label>
                <select
                  id="circ-year"
                  value={circYear}
                  onChange={(e) => setCircYear(Number(e.target.value))}
                  className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:border-pust-800 focus:outline-none"
                >
                  {ACADEMIC_YEARS.map((yr) => (
                    <option key={yr.value} value={yr.value}>
                      {yr.label} Year
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="circ-term-semester"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Semester
                </label>
                <select
                  id="circ-term-semester"
                  value={circTermSem}
                  onChange={(e) => setCircTermSem(Number(e.target.value))}
                  className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:border-pust-800 focus:outline-none"
                >
                  {YEAR_SEMESTERS.map((sem) => (
                    <option key={sem.value} value={sem.value}>
                      {sem.label} Semester
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="circ-fee"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Exam Registration Fee (BDT)
                </label>
                <div className="flex items-stretch rounded-lg border border-slate-300 bg-[#F7F7F5] focus-within:bg-white focus-within:border-pust-800 overflow-hidden">
                  <span className="inline-flex items-center px-3 py-2 font-mono text-xs font-semibold text-pust-900 bg-pust-50 border-r border-slate-300 select-none shrink-0">
                    ৳
                  </span>
                  <input
                    id="circ-fee"
                    type="number"
                    min={100}
                    max={25000}
                    step={50}
                    required
                    value={circFee}
                    onChange={(e) => setCircFee(Number(e.target.value))}
                    className="w-full min-w-0 px-3 py-2 font-mono text-xs bg-transparent text-slate-900 focus:outline-none tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="circ-deadline"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Submission Deadline
                </label>
                <input
                  id="circ-deadline"
                  type="date"
                  required
                  value={circDeadline}
                  onChange={(e) => setCircDeadline(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:border-pust-800 focus:outline-none tabular-nums"
                />
              </div>
            </div>

            <div className="pt-1 border-t border-slate-100">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="text-xs font-medium text-slate-700">
                  Eligible Courses ({circCourseCodes.length}/{Math.min(15, circularVisibleCourses.length)} selected)
                </span>
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  {circularVisibleCourses.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSelectAllVisibleCircularCourses}
                      className="font-medium text-pust-800 hover:text-pust-950 hover:underline cursor-pointer whitespace-nowrap shrink-0"
                    >
                      Select all
                    </button>
                  )}
                  {circCourseCodes.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setCircCourseCodes([])}
                      className="text-slate-600 hover:text-red-700 hover:underline cursor-pointer whitespace-nowrap shrink-0"
                    >
                      Deselect all
                    </button>
                  )}
                  {deptAllCircularCourses.length > filteredCircularCourses.length && (
                    <button
                      type="button"
                      onClick={() => setShowAllDeptCourses((prev) => !prev)}
                      className="text-slate-500 hover:text-slate-900 hover:underline cursor-pointer whitespace-nowrap shrink-0"
                    >
                      {showAllDeptCourses
                        ? 'Filter by term'
                        : `All ${circDept} (${deptAllCircularCourses.length})`}
                    </button>
                  )}
                </div>
              </div>

              {circularVisibleCourses.length === 0 ? (
                <p className="text-xs text-slate-500 py-2">
                  No courses matched {circDept} · {circSession} ·{' '}
                  {ACADEMIC_YEARS.find((y) => y.value === circYear)?.label} Year,{' '}
                  {YEAR_SEMESTERS.find((s) => s.value === circTermSem)?.label} Semester. Add courses
                  on the left or view all {circDept} courses.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {circularVisibleCourses.map((c) => {
                    const active = circCourseCodes.includes(c.code);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleCircularCourse(c.code)}
                        aria-pressed={active}
                        className={`flex items-center justify-between gap-2.5 px-3 py-2 text-left rounded-lg border transition-colors cursor-pointer ${
                          active
                            ? 'bg-pust-900 text-white border-pust-900'
                            : 'bg-[#F7F7F5] text-slate-800 border-slate-200 hover:border-pust-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            aria-hidden="true"
                            className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] font-bold shrink-0 ${
                              active
                                ? 'bg-white text-pust-900 border-white'
                                : 'bg-white border-slate-300 text-transparent'
                            }`}
                          >
                            ✓
                          </span>
                          <div className="min-w-0">
                            <span className="block font-mono text-xs font-semibold truncate">
                              {c.code}
                            </span>
                            <span
                              className={`block text-[11px] truncate ${
                                active ? 'text-white/80' : 'text-slate-500'
                              }`}
                            >
                              {c.title}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`font-mono text-[11px] tabular-nums shrink-0 ${
                            active ? 'text-white/90' : 'text-slate-500'
                          }`}
                        >
                          {c.credits} Cr
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-slate-500 tabular-nums">
                <span>Semester {computedCircSemester}/10</span>
                <span aria-hidden="true">·</span>
                <span>{circCourseCodes.length} course(s)</span>
                <span aria-hidden="true">·</span>
                <span>{selectedCircularCredits} Cr</span>
              </div>
              <button
                type="submit"
                disabled={publishingCircular || circCourseCodes.length === 0}
                className="px-4 py-2 text-xs font-medium rounded-lg bg-pust-900 text-white hover:bg-pust-950 disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
              >
                {publishingCircular ? 'Publishing...' : 'Publish Exam Circular'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Exam Form Applications, Payment, Chairman Admit Card Issuance (Student, Chairman & Admin) */}
      {(user.role === 'student' || user.role === 'chairman' || user.role === 'admin') && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <h3 className="font-serif text-lg font-medium text-slate-900">
            Examination Registrations, Digital Payments &amp; Admit Cards
          </h3>
          {loading ? (
            <PortalRecordsSkeleton rows={3} />
          ) : applications.length === 0 ? (
            <p className="text-sm text-slate-600">No examination applications submitted yet.</p>
          ) : (
            <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 overflow-hidden">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="p-4 space-y-3 bg-white hover:bg-[#F7F7F5]/60 transition-colors"
                >
                  <div className="flex flex-wrap justify-between items-start gap-3 text-sm">
                    <div>
                      <p className="font-medium text-slate-900">
                        {app.examTitle} ·{' '}
                        <span className="font-mono text-xs text-slate-600">{app.formReference}</span>
                      </p>
                      <p className="font-mono text-xs text-slate-500 tabular-nums mt-0.5">
                        {app.studentName} ({app.academicId}) · {app.departmentCode} · Credits{' '}
                        {app.totalCredits} · Fee ৳{app.feeBdt.toLocaleString()} · Payment:{' '}
                        <span
                          className={`font-semibold ${
                            app.paymentStatus === 'Paid' ? 'text-emerald-800' : 'text-amber-800'
                          }`}
                        >
                          {app.paymentStatus}
                        </span>{' '}
                        {app.receiptNo ? `(${app.receiptNo})` : ''} · Verification:{' '}
                        <span className="font-semibold text-slate-800">
                          {app.verificationStatus}
                        </span>
                      </p>
                      <p className="font-mono text-xs text-slate-600 mt-1">
                        Courses: {app.selectedCourseCodes.join(', ')}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {user.role === 'student' && app.paymentStatus === 'Pending' && (
                        <button
                          type="button"
                          onClick={() =>
                            setCheckoutTarget({
                              targetType: 'exam_application',
                              targetId: app.id,
                              title: app.examTitle,
                              subtitle: `Form ${app.formReference} · ${app.selectedCourseCodes.length} Course(s) · ${app.totalCredits} Credits`,
                              amountBdt: app.feeBdt,
                            })
                          }
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-pust-900 text-white hover:bg-pust-950 cursor-pointer whitespace-nowrap shrink-0 tabular-nums"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          Pay Online (৳{app.feeBdt.toLocaleString()})
                        </button>
                      )}

                      {app.admitCardNo && (
                        <button
                          type="button"
                          onClick={() => openAdmitCardDocument(app)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-pust-900 text-white hover:bg-pust-950 cursor-pointer whitespace-nowrap shrink-0 tabular-nums"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          View Digital Admit Card ({app.admitCardNo})
                        </button>
                      )}
                    </div>
                  </div>

                  {(user.role === 'chairman' || user.role === 'admin') &&
                    app.paymentStatus === 'Paid' &&
                    app.verificationStatus === 'Pending Chairman Verification' && (
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => handleVerifyExam(app, 'Approved', true)}
                          className="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-pust-900 text-white hover:bg-pust-950 cursor-pointer whitespace-nowrap shrink-0"
                        >
                          Verify Payment &amp; Issue Digital Admit Card
                        </button>
                        <button
                          type="button"
                          onClick={() => handleVerifyExam(app, 'Rejected', false)}
                          className="px-3.5 py-1.5 text-xs font-medium rounded-lg border border-red-300 text-red-700 hover:bg-red-50 cursor-pointer whitespace-nowrap shrink-0"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Teacher / Chairman / Admin Interactive Multi-Course Gradebook Builder */}
      {canEnterMarks && (
        <form
          onSubmit={handlePublishResult}
          className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-xs"
        >
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <p className="text-xs font-semibold text-pust-800">
                {user.role === 'teacher'
                  ? 'Step 1 · Teacher Marksheet Preparation'
                  : 'Direct Result Entry & Publication'}
              </p>
              <h3 className="font-serif text-lg font-medium text-slate-900 mt-0.5">
                Interactive Multi-Course Gradebook &amp; SGPA Calculator
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                {user.role === 'teacher'
                  ? 'Retrieve a student by Academic ID, choose Year & Semester, and submit marks for Chairman review.'
                  : 'Retrieve a student by Academic ID, enter semester marks, and calculate live SGPA & cumulative CGPA.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 font-mono tabular-nums">
              <div className="px-4 py-2 rounded-xl bg-[#F7F7F5] border border-slate-200 text-right">
                <span className="block text-[11px] text-slate-500">
                  This Semester GPA
                </span>
                <span className="text-lg font-semibold text-pust-900">
                  {estimatedSgpa.toFixed(2)}{' '}
                  <span className="text-xs font-normal text-slate-500">
                    ({totalGradebookCredits} Cr)
                  </span>
                </span>
              </div>
              <div className="px-4 py-2 rounded-xl bg-[#F7F7F5] border border-slate-200 text-right">
                <span className="block text-[11px] text-slate-500">
                  CGPA (With Prev.)
                </span>
                <span className="text-lg font-semibold text-slate-900">
                  {projectedCumulativeCgpa.toFixed(2)}{' '}
                  <span className="text-xs font-normal text-slate-500">
                    ({projectedCombinedCredits} Cr)
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-4">
              <label
                htmlFor="gradebook-academic-id"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Student Academic ID
              </label>
              <div className="flex items-stretch rounded-lg border border-slate-300 bg-[#F7F7F5] focus-within:bg-white focus-within:border-pust-800 overflow-hidden">
                <input
                  id="gradebook-academic-id"
                  type="text"
                  required
                  value={resAcademicId}
                  onChange={(e) => setResAcademicId(e.target.value)}
                  placeholder="e.g. 220101"
                  className="w-full min-w-0 px-3 py-2 text-xs font-mono bg-transparent text-slate-900 focus:outline-none tabular-nums"
                />
                <button
                  type="button"
                  onClick={() => fetchStudentContext(resAcademicId, true)}
                  disabled={studentLookupLoading || resAcademicId.trim().length < 3}
                  className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-pust-900 bg-pust-50 border-l border-slate-300 hover:bg-pust-100 disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Search className="w-3.5 h-3.5" />
                  {studentLookupLoading ? 'Loading' : 'Retrieve'}
                </button>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="gradebook-year"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Year
              </label>
              <select
                id="gradebook-year"
                value={resYear}
                onChange={(e) => setResYear(Number(e.target.value))}
                className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:border-pust-800 focus:outline-none"
              >
                {ACADEMIC_YEARS.map((yr) => (
                  <option key={yr.value} value={yr.value}>
                    {yr.label} Year
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3">
              <label
                htmlFor="gradebook-term-semester"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Semester
              </label>
              <select
                id="gradebook-term-semester"
                value={resTermSem}
                onChange={(e) => setResTermSem(Number(e.target.value))}
                className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:border-pust-800 focus:outline-none"
              >
                {YEAR_SEMESTERS.map((sem) => (
                  <option key={sem.value} value={sem.value}>
                    {sem.label} Semester
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3">
              <label
                htmlFor="gradebook-promo"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Promotion Policy
              </label>
              <select
                id="gradebook-promo"
                value={resPromoMode}
                onChange={(e) => setResPromoMode(e.target.value as typeof resPromoMode)}
                className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:border-pust-800 focus:outline-none"
              >
                <option value="auto">Auto Promotion Check (SGPA &gt;= 2.00)</option>
                <option value="manual_promoted">Manual Override — Promoted</option>
                <option value="manual_repeat">Manual Override — Repeat / Probation</option>
              </select>
            </div>
          </div>

          {/* Retrieved Student Basic Information & Previous Semester Record */}
          {studentLookupLoading && (
            <div className="px-4 py-3 rounded-xl border border-slate-200 bg-[#F7F7F5] text-xs font-mono text-slate-600">
              Retrieving student record for Academic ID {resAcademicId.trim()}...
            </div>
          )}

          {!studentLookupLoading && studentLookupError && (
            <div className="px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-xs text-red-800">
              {studentLookupError}
            </div>
          )}

          {!studentLookupLoading && retrievedStudent && (
            <div className="px-4 py-3.5 rounded-xl border border-slate-200 bg-[#F7F7F5] space-y-2">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="flex flex-wrap items-baseline gap-2 text-sm">
                  <span className="font-semibold text-slate-900">{retrievedStudent.name}</span>
                  <span className="text-slate-400" aria-hidden="true">·</span>
                  <span className="font-mono text-xs font-semibold text-pust-900 tabular-nums">
                    ID {retrievedStudent.academicId}
                  </span>
                  <span className="text-slate-400" aria-hidden="true">·</span>
                  <span className="text-xs text-slate-700">
                    {departments.find((d) => d.code === retrievedStudent.departmentCode)?.name ??
                      retrievedStudent.departmentCode}{' '}
                    ({retrievedStudent.departmentCode})
                  </span>
                  <span className="text-slate-400" aria-hidden="true">·</span>
                  <span className="font-mono text-xs text-slate-600 tabular-nums">
                    Session {retrievedStudent.session}
                  </span>
                </div>
                <span className="font-mono text-xs font-semibold text-slate-800 tabular-nums">
                  Recorded CGPA: {retrievedStudent.cgpa.toFixed(2)}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600 tabular-nums">
                <span>Current Semester: {retrievedStudent.currentSemester}</span>
                <span aria-hidden="true">·</span>
                <span>Completed Semesters: {retrievedStudent.completedSemesters}</span>
                <span aria-hidden="true">·</span>
                <span>Hall: {retrievedStudent.hallName}</span>
                <span aria-hidden="true">·</span>
                <span>Disciplinary Standing: {retrievedStudent.disciplinaryStatus}</span>
                <span aria-hidden="true">·</span>
                <span>Email: {retrievedStudent.email}</span>
              </div>

              <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                {priorResultsForCgpa.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] text-slate-700 tabular-nums">
                    <span className="font-semibold text-slate-800">Previous Semesters:</span>
                    {priorResultsForCgpa.map((r, i) => {
                      const cr = r.courses.reduce((s, c) => s + (Number(c.credits) || 0), 0);
                      return (
                        <span key={r.id}>
                          {i > 0 && <span className="mr-2 text-slate-400">·</span>}
                          Sem {r.semester}: {r.sgpa.toFixed(2)} ({cr} Cr)
                        </span>
                      );
                    })}
                    <span className="text-slate-400" aria-hidden="true">·</span>
                    <span className="font-semibold text-pust-900">
                      Prev CGPA {previousStandingStats.cgpa?.toFixed(2)} ({previousStandingStats.credits} Cr)
                    </span>
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-500">
                    No prior published semester marksheets in gradebook yet (this semester establishes cumulative CGPA).
                  </span>
                )}

                {existingSameSemesterResult && (
                  <span className="text-[11px] font-medium text-amber-800 tabular-nums">
                    Note: Semester {computedResSemester} already has a published result (SGPA{' '}
                    {existingSameSemesterResult.sgpa.toFixed(2)}).
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Quick Pick Courses from Catalog */}
          {(deptCourses.length > 0 || matchingGradebookTermCourses.length > 0) && (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-medium text-slate-700">
                  Quick-Add From Course Catalog
                  {retrievedStudent ? ` (${retrievedStudent.departmentCode})` : ''}
                </p>
                {matchingGradebookTermCourses.length > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setCourseRows(
                        matchingGradebookTermCourses.map((c, idx) => ({
                          key: `row-${c.id}-${Date.now()}-${idx}`,
                          code: c.code,
                          title: c.title,
                          credits: c.credits,
                          marks: 75,
                        }))
                      )
                    }
                    className="text-xs font-medium text-pust-800 hover:text-pust-950 hover:underline cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Load Semester {computedResSemester} Courses ({matchingGradebookTermCourses.length})
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {deptCourses.map((c) => {
                  const already = courseRows.some(
                    (r) => r.code.toUpperCase() === c.code.toUpperCase()
                  );
                  return (
                    <button
                      key={c.id}
                      type="button"
                      disabled={already}
                      onClick={() => addCatalogCourseRow(c)}
                      className={`px-2.5 py-1 text-xs font-mono rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        already
                          ? 'bg-pust-50 border-pust-300 text-pust-900 opacity-70 cursor-default'
                          : 'bg-[#F7F7F5] border-slate-200 text-slate-700 hover:border-pust-700'
                      }`}
                    >
                      {already ? '✓ ' : '+ '}
                      {c.code}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Dynamic Multi-Course Table (This Semester Result) */}
          <div className="rounded-xl border border-slate-200 overflow-x-auto">
            <table className="w-full min-w-[680px] text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F7F7F5] border-b border-slate-200 font-mono text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="px-3 py-2.5">Course Code</th>
                  <th className="px-3 py-2.5">Course Title</th>
                  <th className="px-3 py-2.5 w-24">Credits</th>
                  <th className="px-3 py-2.5 w-24">Marks (0–100)</th>
                  <th className="px-3 py-2.5 w-28">Grade · GP</th>
                  <th className="px-3 py-2.5 w-12 text-right">Act</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {courseRows.map((row) => {
                  const { letter, gp } = computePustGrade(row.marks);
                  return (
                    <tr key={row.key} className="bg-white">
                      <td className="p-2">
                        <input
                          type="text"
                          required
                          value={row.code}
                          onChange={(e) => updateCourseRow(row.key, { code: e.target.value })}
                          placeholder="CSE-3201"
                          className="w-full px-2.5 py-1.5 font-mono rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:border-pust-800 focus:outline-none"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          required
                          value={row.title}
                          onChange={(e) => updateCourseRow(row.key, { title: e.target.value })}
                          placeholder="Course Title"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:border-pust-800 focus:outline-none"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          step="0.5"
                          min={0.5}
                          max={6}
                          required
                          value={row.credits}
                          onChange={(e) =>
                            updateCourseRow(row.key, { credits: Number(e.target.value) })
                          }
                          className="w-full px-2.5 py-1.5 font-mono rounded-lg border border-slate-300 bg-[#F7F7F5] tabular-nums"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          required
                          value={row.marks}
                          onChange={(e) =>
                            updateCourseRow(row.key, { marks: Number(e.target.value) })
                          }
                          className="w-full px-2.5 py-1.5 font-mono rounded-lg border border-slate-300 bg-[#F7F7F5] tabular-nums"
                        />
                      </td>
                      <td className="px-3 py-2 font-mono font-semibold tabular-nums whitespace-nowrap">
                        <span
                          className={
                            letter === 'F' ? 'text-red-700' : 'text-pust-800'
                          }
                        >
                          {letter} · {gp.toFixed(2)}
                        </span>
                      </td>
                      <td className="p-2 text-right">
                        <button
                          type="button"
                          onClick={() => removeCourseRow(row.key)}
                          disabled={courseRows.length <= 1}
                          aria-label="Remove course row"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-700 hover:bg-red-50 disabled:opacity-30 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Live Term GPA & Combined CGPA Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-[#F7F7F5] font-mono tabular-nums">
            <div>
              <span className="block text-[11px] text-slate-500">
                {ACADEMIC_YEARS.find((y) => y.value === resYear)?.label} Year ·{' '}
                {YEAR_SEMESTERS.find((s) => s.value === resTermSem)?.label} Sem (Sem{' '}
                {computedResSemester})
              </span>
              <span className="text-sm font-semibold text-pust-900">
                This Semester GPA: {estimatedSgpa.toFixed(2)}{' '}
                <span className="text-xs font-normal text-slate-500">
                  ({totalGradebookCredits} Cr)
                </span>
              </span>
            </div>
            <div>
              <span className="block text-[11px] text-slate-500">
                Previous Semesters ({priorResultsForCgpa.length} sem)
              </span>
              <span className="text-sm font-semibold text-slate-800">
                {previousStandingStats.cgpa !== null
                  ? `${previousStandingStats.cgpa.toFixed(2)} (${previousStandingStats.credits} Cr)`
                  : 'No prior record'}
              </span>
            </div>
            <div>
              <span className="block text-[11px] text-slate-500">
                CGPA (With Previous Semesters)
              </span>
              <span className="text-sm font-semibold text-slate-900">
                {projectedCumulativeCgpa.toFixed(2)}{' '}
                <span className="text-xs font-normal text-slate-500">
                  ({projectedCombinedCredits} Total Cr)
                </span>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={addBlankCourseRow}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-300 bg-[#F7F7F5] text-slate-700 hover:border-pust-700 hover:text-pust-900 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Custom Course Row
            </button>
            <button
              type="submit"
              disabled={publishingResult}
              className="px-5 py-2.5 text-xs font-semibold rounded-lg bg-pust-900 text-white hover:bg-pust-950 disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
            >
              {publishingResult
                ? 'Saving Result...'
                : user.role === 'teacher'
                ? 'Submit Marksheet for Chairman Review'
                : 'Calculate SGPA & Publish Result'}
            </button>
          </div>
        </form>
      )}

      {/* Pending Chairman Review Queue */}
      {pendingResults.length > 0 && (user.role === 'teacher' || user.role === 'chairman' || user.role === 'admin') && (
        <div className="bg-white rounded-2xl border border-amber-300 p-6 space-y-4 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Pending Chairman Verification Queue ({pendingResults.length})
              </p>
              <h3 className="font-serif text-lg font-medium text-slate-900 mt-0.5">
                Teacher-Submitted Marksheets Awaiting Departmental Seal
              </h3>
            </div>
          </div>

          <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 overflow-hidden">
            {pendingResults.map((r) => (
              <div key={r.id} className="p-4 space-y-3 bg-amber-50/30 text-sm">
                <div className="flex flex-wrap justify-between items-start gap-2">
                  <div>
                    <p className="font-medium text-slate-900">
                      {r.studentName} ({r.academicId}) · Semester {r.semester} ({r.session})
                    </p>
                    <p className="font-mono text-xs text-slate-500 mt-0.5">
                      Submitted by {r.enteredBy} · Provisional SGPA{' '}
                      <span className="font-semibold text-amber-900 tabular-nums">
                        {r.sgpa.toFixed(2)}
                      </span>
                    </p>
                  </div>
                  {(user.role === 'chairman' || user.role === 'admin') && (
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={pendingPromoModes[r.id] || 'auto'}
                        onChange={(e) =>
                          setPendingPromoModes((prev) => ({
                            ...prev,
                            [r.id]: e.target.value as 'auto' | 'manual_promoted' | 'manual_repeat',
                          }))
                        }
                        className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                      >
                        <option value="auto">Auto Promotion</option>
                        <option value="manual_promoted">Override: Promoted</option>
                        <option value="manual_repeat">Override: Repeat</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => handleApprovePendingResult(r)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-pust-900 text-white hover:bg-pust-950 cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <FileCheck2 className="w-3.5 h-3.5" />
                        Verify &amp; Publish Result
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 font-mono text-xs text-slate-700">
                  {r.courses.map((c) => (
                    <span
                      key={c.code}
                      className="px-2 py-1 rounded-md bg-white border border-slate-200 tabular-nums"
                    >
                      {c.code}: {c.marks} ({c.letterGrade}, {c.gradePoint.toFixed(2)})
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Published Results Ledger */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
        <h3 className="font-serif text-lg font-medium text-slate-900">
          Published Semester Results &amp; Promotion Standing
        </h3>
        {loading ? (
          <PortalRecordsSkeleton rows={2} />
        ) : publishedResults.length === 0 ? (
          <p className="text-sm text-slate-600">No semester results published yet.</p>
        ) : (
          <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 overflow-hidden">
            {publishedResults.map((r) => (
              <div
                key={r.id}
                className="p-4 space-y-2.5 text-sm bg-white hover:bg-[#F7F7F5]/60 transition-colors"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">
                      {r.studentName} ({r.academicId}) · Semester {r.semester} ({r.session})
                    </p>
                    <p className="font-mono text-xs text-slate-500 mt-0.5 tabular-nums">
                      Prepared by {r.enteredBy}
                      {r.reviewedBy ? ` · Verified by ${r.reviewedBy}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 shrink-0">
                    <span className="font-mono text-xs font-semibold text-pust-800 tabular-nums">
                      SGPA {r.sgpa.toFixed(2)} · {r.promotionStatus}
                    </span>
                    <button
                      type="button"
                      onClick={() => openGradeSheetDocument(r)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-[#F7F7F5] text-slate-800 hover:border-pust-800 hover:text-pust-900 cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      View Official Grade Sheet
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2.5 font-mono text-xs text-slate-600">
                  {r.courses.map((c) => (
                    <span
                      key={c.code}
                      className="px-2 py-1 rounded-md bg-[#F7F7F5] border border-slate-200 tabular-nums"
                    >
                      {c.code}: {c.marks} ({c.letterGrade}, {c.gradePoint.toFixed(2)})
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Unified Digital Payment Checkout Modal */}
      <DigitalCheckoutModal
        target={checkoutTarget}
        gateways={gateways}
        onClose={() => setCheckoutTarget(null)}
        onSuccess={async (receipt, updatedTarget, meta) => {
          const updatedApp = updatedTarget as ExamApplicationRecord | undefined;
          if (meta?.autoIssued || updatedApp?.verificationStatus === 'Approved') {
            setFeedback(
              `Exam fee settled (${receipt.receiptNo} via ${receipt.gatewayName}). Admit Card ${
                updatedApp?.admitCardNo || ''
              } auto-issued.`
            );
          } else if (meta?.holdReason) {
            setFeedback(
              `Exam fee settled (${receipt.receiptNo} via ${receipt.gatewayName}). Auto-admit held: ${meta.holdReason}`
            );
          } else {
            setFeedback(
              `Exam fee settled cleanly (${receipt.receiptNo} via ${receipt.gatewayName}). Awaiting Chairman Admit Card verification.`
            );
          }
          await refresh();
        }}
      />

      {/* Unified Verified Digital Document Viewer (Admit Card / Official Grade Sheet) */}
      <DigitalDocumentModal
        doc={activeDoc}
        onClose={() => setActiveDoc(null)}
        onOpenVerify={(code) => navigateTo(`/verify?code=${encodeURIComponent(code)}`)}
      />
    </div>
  );
}
